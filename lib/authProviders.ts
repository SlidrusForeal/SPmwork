// lib/authProviders.ts
import { serialize } from "cookie";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "./supabaseAdmin";
import { sp } from "./spworlds"; // экспортируется как `new SPWorlds({...})`

const {
  NEXT_PUBLIC_BASE_URL,
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  JWT_SECRET,
} = process.env;

if (
  !NEXT_PUBLIC_BASE_URL ||
  !DISCORD_CLIENT_ID ||
  !DISCORD_CLIENT_SECRET ||
  !JWT_SECRET
) {
  throw new Error(
    "❌ НЕЗАДАНЫ переменные окружения: NEXT_PUBLIC_BASE_URL, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET или JWT_SECRET"
  );
}

/**
 * Генерирует URL для начала OAuth2‑потока через Discord
 */
export function getDiscordAuthUrl(): string {
  const redirectUri = `${NEXT_PUBLIC_BASE_URL}/api/auth/discord/callback`;
  const params = new URLSearchParams();
  params.set("client_id", DISCORD_CLIENT_ID!);
  params.set("redirect_uri", redirectUri);
  params.set("response_type", "code");
  params.set("scope", "identify");
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

/**
 * Обработка callback от Discord:
 * 1) Обмен code → access_token
 * 2) Получение профиля из Discord
 * 3) Получение профиля из SPWorlds (getCardOwner)
 * 4) Upsert в Supabase
 * 5) Генерация JWT + Set-Cookie
 */
export async function handleDiscordCallback(code: string): Promise<string> {
  const redirectUri = `${NEXT_PUBLIC_BASE_URL}/api/auth/discord/callback`;

  // 1) Code → access_token
  const tokenParams = new URLSearchParams();
  tokenParams.set("client_id", DISCORD_CLIENT_ID!);
  tokenParams.set("client_secret", DISCORD_CLIENT_SECRET!);
  tokenParams.set("grant_type", "authorization_code");
  tokenParams.set("code", code);
  tokenParams.set("redirect_uri", redirectUri);

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams.toString(),
  });
  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.error("[Discord /token] ", tokenRes.status, body);
    throw new Error(`Discord token exchange failed: ${tokenRes.status}`);
  }
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  // 2) Профиль Discord
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!userRes.ok) {
    const body = await userRes.text();
    console.error("[Discord /users/@me] ", userRes.status, body);
    throw new Error(`Discord user fetch failed: ${userRes.status}`);
  }
  const { username: discordUsername } = (await userRes.json()) as {
    username: string;
  };

  // 3) Профиль SPWorlds — владелец токена
  const account = await sp.getCardOwner();

  // В типах может быть не массив, приводим к массиву
  const cards = Array.isArray((account as any).cards)
    ? (account as any).cards
    : [(account as any).cards];

  if (cards.length === 0) {
    throw new Error("У аккаунта SPWorlds нет привязанных карт");
  }
  const { id: uuid, name: spUsername } = cards[0] as {
    id: string;
    name: string;
  };

  // 4) Upsert пользователя в Supabase
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
    console.error("[Supabase upsert] ", error);
    throw new Error("Не удалось сохранить пользователя в базе");
  }

  // 5) Генерация JWT и упаковка в куку
  const token = jwt.sign(
    { id: userRecord.id, username: userRecord.username },
    JWT_SECRET!,
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
