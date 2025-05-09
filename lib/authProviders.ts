// lib/authProviders.ts
import { serialize } from "cookie";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "./supabaseAdmin";

const {
  NEXT_PUBLIC_BASE_URL,
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  JWT_SECRET,
  SPWORLDS_ID,
  SPWORLDS_TOKEN,
} = process.env;

if (
  !NEXT_PUBLIC_BASE_URL ||
  !DISCORD_CLIENT_ID ||
  !DISCORD_CLIENT_SECRET ||
  !JWT_SECRET ||
  !SPWORLDS_ID ||
  !SPWORLDS_TOKEN
) {
  throw new Error("❌ Не заданы все env‑переменные для Discord и SPWorlds");
}

const redirectBase = NEXT_PUBLIC_BASE_URL;
const discordClientId = DISCORD_CLIENT_ID;
const discordClientSecret = DISCORD_CLIENT_SECRET;
const jwtSecret = JWT_SECRET;
// Base64-ключ для SPWorlds API
const spAuthHeader = `Bearer ${Buffer.from(
  `${SPWORLDS_ID}:${SPWORLDS_TOKEN}`,
  "utf8"
).toString("base64")}`;

/**
 * URL для начала OAuth2-потока через Discord
 */
export function getDiscordAuthUrl(): string {
  const redirectUri = `${redirectBase}/api/auth/discord/callback`;
  const params = new URLSearchParams();
  params.set("client_id", discordClientId);
  params.set("redirect_uri", redirectUri);
  params.set("response_type", "code");
  params.set("scope", "identify");
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

/**
 * Обрабатывает callback от Discord:
 * 1) Обмен code → access_token
 * 2) Получение Discord‑ника
 * 3) Ручной вызов SPWorlds /accounts/me (гарантированно JSON)
 * 4) Upsert в Supabase
 * 5) Генерация JWT + Set-Cookie
 */
export async function handleDiscordCallback(code: string): Promise<string> {
  // 1) обмен кода на Discord access_token
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: discordClientId,
      client_secret: discordClientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: `${redirectBase}/api/auth/discord/callback`,
    }).toString(),
  });
  if (!tokenRes.ok) {
    const txt = await tokenRes.text();
    throw new Error(`Discord token error ${tokenRes.status}: ${txt}`);
  }
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  // 2) получение Discord‑ника
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!userRes.ok) {
    const txt = await userRes.text();
    throw new Error(`Discord user error ${userRes.status}: ${txt}`);
  }
  const { username: discordUsername } = (await userRes.json()) as {
    username: string;
  };

  // 3) ручной вызов SPWorlds /accounts/me
  const accountsRes = await fetch(
    "https://spworlds.ru/api/public/accounts/me",
    {
      headers: {
        Authorization: spAuthHeader,
        Accept: "application/json",
      },
    }
  );
  if (!accountsRes.ok) {
    const txt = await accountsRes.text();
    throw new Error(`SPWorlds accounts error ${accountsRes.status}: ${txt}`);
  }
  const account = (await accountsRes.json()) as {
    cards?: Array<{ id: string; name: string }>;
  };
  if (!account.cards || account.cards.length === 0) {
    throw new Error("У вашего аккаунта нет карт SPWorlds");
  }
  const { id: uuid, name: spUsername } = account.cards[0];

  // 4) upsert в Supabase
  const { data: userRecord, error } = await supabaseAdmin
    .from("users")
    .upsert(
      {
        id: uuid,
        username: spUsername,
        email: `${discordUsername}@discord`,
        role: "user",
        created_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .single();
  if (error || !userRecord) {
    throw new Error("Supabase upsert failed: " + error?.message);
  }

  // 5) генерация JWT и упаковка в куку
  const token = jwt.sign(
    { id: userRecord.id, username: userRecord.username },
    jwtSecret,
    { expiresIn: "7d" }
  );
  return serialize("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}
