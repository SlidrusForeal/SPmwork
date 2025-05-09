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
const spAuthHeader = `Bearer ${Buffer.from(
  `${SPWORLDS_ID}:${SPWORLDS_TOKEN}`,
  "utf8"
).toString("base64")}`;

export function getDiscordAuthUrl(): string {
  const redirectUri = `${redirectBase}/api/auth/discord/callback`;
  const params = new URLSearchParams({
    client_id: discordClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

export async function handleDiscordCallback(code: string): Promise<string> {
  // 1) Discord token
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

  // 2) Discord profile
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

  // 3) SPWorlds account
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
    throw new Error("У аккаунта нет карт SPWorlds");
  }
  const { id: uuid, name: spUsername } = account.cards[0];

  // 4) Supabase upsert
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

  // 5) Генерация JWT и cookie с SameSite=None
  const token = jwt.sign(
    { id: userRecord.id, username: userRecord.username },
    jwtSecret,
    { expiresIn: "7d" }
  );
  return serialize("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    domain: "spmwork.vercel.app",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}
