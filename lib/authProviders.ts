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

/**
 * Собирает ссылку для начала OAuth через Discord
 */
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
 * Обрабатывает callback от Discord:
 * 1) Получаем access_token
 * 2) Получаем профиль Discord
 * 3) Читаем ник через публичный API SPWorlds
 * 4) Создаём или обновляем пользователя в БД
 * 5) Генерируем JWT и возвращаем его в виде Set-Cookie
 */
export async function handleDiscordCallback(code: string): Promise<string> {
  // 1) Обмен code → access_token
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

  // 2) Получение профиля Discord
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const userText = await userRes.text();
  if (!userRes.ok) {
    console.error("Discord user error:", userText);
    throw new Error(`User fetch failed: ${userRes.status}`);
  }
  const { id: discordId, username } = JSON.parse(userText);

  // 3) Запрос ника через публичный API SPWorlds
  // Формируем ключ: base64(ID:TOKEN)
  const key = Buffer.from(`${SPWORLDS_ID}:${SPWORLDS_TOKEN}`).toString(
    "base64"
  );
  const spRes = await fetch(
    `https://spworlds.ru/api/public/users/${discordId}`,
    {
      headers: { Authorization: `Bearer ${key}` },
    }
  );
  const spText = await spRes.text();
  if (!spRes.ok) {
    console.error("SPWorlds user lookup error:", spText);
    throw new Error(`SPWorlds lookup failed: ${spRes.status}`);
  }
  // В ответе: { "username": "..."} или { "username": null }
  const { username: spUsername } = JSON.parse(spText);
  if (!spUsername) {
    throw new Error("SPWorlds: у пользователя нет карты");
  }

  // 4) Upsert пользователя в вашей БД
  const { data: userRecord, error } = await supabaseAdmin
    .from("users")
    .upsert(
      {
        id: discordId, // используем discordId как уникальный ключ
        username: spUsername, // имя из SPWorlds
        email: `${username}@discord`, // заглушка, если у вас нет email
        role: "user",
        created_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .single();
  if (error) {
    console.error("Supabase upsert error:", error);
    throw new Error("Не удалось сохранить пользователя в БД");
  }

  // 5) Генерация JWT и упаковка в куку
  const jwtToken = jwt.sign(
    { id: userRecord.id, username: userRecord.username },
    JWT_SECRET!,
    { expiresIn: "7d" }
  );
  const cookie = serialize("token", jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return cookie;
}
