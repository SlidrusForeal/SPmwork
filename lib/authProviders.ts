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

// Проверяем все необходимые переменные
if (
  !NEXT_PUBLIC_BASE_URL ||
  !DISCORD_CLIENT_ID ||
  !DISCORD_CLIENT_SECRET ||
  !JWT_SECRET ||
  !SPWORLDS_ID ||
  !SPWORLDS_TOKEN
) {
  throw new Error("❌ Не заданы env‑переменные Discord или SPWorlds");
}

// Тримим на всякий случай
const baseUrl = NEXT_PUBLIC_BASE_URL.trim();
const clientId = DISCORD_CLIENT_ID.trim();
const clientSecret = DISCORD_CLIENT_SECRET.trim();
const jwtSecret = JWT_SECRET.trim();
const spId = SPWORLDS_ID.trim();
const spToken = SPWORLDS_TOKEN.trim();

// Ключ для SPWorlds: base64("ID:TOKEN")
const spKey = Buffer.from(`${spId}:${spToken}`, "utf8").toString("base64");

/** URL для начала OAuth-потока через Discord */
export function getDiscordAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${baseUrl}/api/auth/discord/callback`,
    response_type: "code",
    scope: "identify",
  });
  return `https://discord.com/api/oauth2/authorize?${params}`;
}

/**
 * Обрабатывает callback от Discord:
 * 1) code → access_token
 * 2) получение профиля Discord
 * 3) получение карты через SPWorlds public API
 * 4) upsert в Supabase
 * 5) выдача JWT + Set-Cookie
 */
export async function handleDiscordCallback(code: string): Promise<string> {
  // 1) Token exchange
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: `${baseUrl}/api/auth/discord/callback`,
    }),
  });
  const tokenText = await tokenRes.text();
  if (!tokenRes.ok) {
    console.error("Discord /token ответ:", tokenText);
    throw new Error(`Ошибка обмена токена: ${tokenRes.status}`);
  }
  const { access_token } = JSON.parse(tokenText);

  // 2) Профиль Discord
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const userText = await userRes.text();
  if (!userRes.ok) {
    console.error("Discord /users/@me ответ:", userText);
    throw new Error(`Не удалось получить профиль: ${userRes.status}`);
  }
  const { id: discordId, username } = JSON.parse(userText);

  // 3) Запрос карты SPWorlds
  const spUrl = `https://spworlds.ru/api/public/users/${discordId}`;
  console.error("SPWorlds GET:", spUrl);
  console.error("SPWorlds Auth:", `Bearer ${spKey}`);
  const spRes = await fetch(spUrl, {
    headers: { Authorization: `Bearer ${spKey}` },
  });
  const spText = await spRes.text();
  if (!spRes.ok) {
    console.error("SPWorlds /users ответ:", spText);
    throw new Error(`SPWorlds lookup failed: ${spRes.status}`);
  }
  const { username: spUsername, uuid } = JSON.parse(spText);
  if (!spUsername || !uuid) {
    throw new Error("Карта SPWorlds не найдена или неверный формат ответа");
  }

  // 4) Upsert в Supabase
  const { data: userRecord, error } = await supabaseAdmin
    .from("users")
    .upsert(
      {
        id: uuid,
        username: spUsername,
        email: `${username}@discord`,
        role: "user",
        created_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .single();
  if (error || !userRecord) {
    console.error("Supabase upsert error:", error);
    throw new Error("Не удалось создать/обновить пользователя");
  }

  // 5) Генерация JWT и упаковка в cookie
  const jwtToken = jwt.sign(
    { id: userRecord.id, username: userRecord.username },
    jwtSecret,
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
