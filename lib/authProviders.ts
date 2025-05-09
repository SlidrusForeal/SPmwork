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
  throw new Error("❌ Не заданы необходимые env‑переменные");
}

// Собираем ключ в формате base64(id:token)
const spKey = Buffer.from(`${SPWORLDS_ID}:${SPWORLDS_TOKEN}`).toString(
  "base64"
);

/** Ссылка для начала OAuth через Discord */
export function getDiscordAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID!,
    redirect_uri: `${NEXT_PUBLIC_BASE_URL}/api/auth/discord/callback`,
    response_type: "code",
    scope: "identify",
  });
  return `https://discord.com/api/oauth2/authorize?${params}`;
}

/**
 * Обработка callback от Discord:
 * 1) code → access_token
 * 2) получение профиля Discord
 * 3) запрос ника через SPWorlds
 * 4) upsert в БД
 * 5) генерация JWT и Set-Cookie
 */
export async function handleDiscordCallback(code: string): Promise<string> {
  // 1) Обмен code → токен
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID!,
      client_secret: DISCORD_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: `${NEXT_PUBLIC_BASE_URL}/api/auth/discord/callback`,
    }),
  });
  const tokenText = await tokenRes.text();
  if (!tokenRes.ok) {
    console.error("Discord token error:", tokenText);
    throw new Error(`Token exchange failed: ${tokenRes.status}`);
  }
  const { access_token } = JSON.parse(tokenText);

  // 2) Профиль Discord
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const userText = await userRes.text();
  if (!userRes.ok) {
    console.error("Discord user error:", userText);
    throw new Error(`User fetch failed: ${userRes.status}`);
  }
  const { id: discordId, username } = JSON.parse(userText);

  // 3) Получение ника из SPWorlds
  const spRes = await fetch(
    `https://spworlds.ru/api/public/users/${discordId}`, // правильный endpoint :contentReference[oaicite:1]{index=1}
    { headers: { Authorization: `Bearer ${spKey}` } }
  );
  const spText = await spRes.text();
  if (!spRes.ok) {
    console.error("SPWorlds user lookup error:", spText);
    throw new Error(`SPWorlds lookup failed: ${spRes.status}`);
  }
  const { username: spUsername } = JSON.parse(spText);
  if (!spUsername) {
    throw new Error("У пользователя нет карты SPWorlds");
  }

  // 4) Upsert в Supabase
  const { data: userRecord, error } = await supabaseAdmin
    .from("users")
    .upsert(
      {
        id: discordId,
        username: spUsername,
        email: `${username}@discord`,
        role: "user",
        created_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .single();
  if (error) {
    console.error("Supabase upsert error:", error);
    throw new Error("Не удалось сохранить пользователя");
  }

  // 5) Генерация JWT + кука
  const jwtToken = jwt.sign(
    { id: userRecord.id, username: userRecord.username },
    JWT_SECRET!,
    { expiresIn: "7d" }
  );
  return serialize("token", jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}
