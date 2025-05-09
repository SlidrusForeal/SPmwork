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

// 1) Проверяем, что все нужные ENV прописаны
if (
  !NEXT_PUBLIC_BASE_URL ||
  !DISCORD_CLIENT_ID ||
  !DISCORD_CLIENT_SECRET ||
  !JWT_SECRET ||
  !SPWORLDS_ID ||
  !SPWORLDS_TOKEN
) {
  throw new Error(
    "❌ Не заданы env‑переменные: NEXT_PUBLIC_BASE_URL, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, JWT_SECRET, SPWORLDS_ID или SPWORLDS_TOKEN"
  );
}

// 2) Тримим их на всякий случай
const baseUrl = NEXT_PUBLIC_BASE_URL.trim();
const clientId = DISCORD_CLIENT_ID.trim();
const clientSecret = DISCORD_CLIENT_SECRET.trim();
const jwtSecret = JWT_SECRET.trim();
const spId = SPWORLDS_ID.trim();
const spToken = SPWORLDS_TOKEN.trim();

// 3) Ключ для SPWorlds: base64("ID:TOKEN")
const spKey = Buffer.from(`${spId}:${spToken}`, "utf8").toString("base64");

/** Ссылка для начала OAuth‑потока через Discord */
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
 * Обработка callback от Discord:
 * 1) code → access_token
 * 2) GET /users/@me
 * 3) GET SPWorlds public/users/{discordId}
 * 4) upsert в Supabase
 * 5) выдача JWT + Set-Cookie
 */
export async function handleDiscordCallback(code: string): Promise<string> {
  // === Обмен code → access_token ===
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
    console.error("Discord /token error:", tokenRes.status, tokenText);
    throw new Error(`OAuth token exchange failed (${tokenRes.status})`);
  }
  const { access_token } = JSON.parse(tokenText);

  // === Получаем профиль Discord ===
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const userText = await userRes.text();
  if (!userRes.ok) {
    console.error("Discord /users/@me error:", userRes.status, userText);
    throw new Error(`Discord user fetch failed (${userRes.status})`);
  }
  const { id: discordId, username } = JSON.parse(userText);

  // === Запрашиваем ник в SPWorlds ===
  const spUrl = `https://spworlds.ru/api/public/users/${discordId}`;
  console.error("SPWorlds GET:", spUrl);
  console.error("SPWorlds Auth:", `Bearer ${spKey}`);
  const spRes = await fetch(spUrl, {
    headers: {
      Authorization: `Bearer ${spKey}`,
      Accept: "application/json",
      "User-Agent": "SPmwork/1.0 (+https://spmwork.vercel.app)",
    },
  });
  const spText = await spRes.text();
  if (!spRes.ok) {
    console.error("SPWorlds /users error:", spRes.status, spText);
    throw new Error(`SPWorlds lookup failed (${spRes.status})`);
  }
  let spJson: { username?: string; uuid?: string };
  try {
    spJson = JSON.parse(spText);
  } catch {
    console.error("SPWorlds returned non-JSON:", spText.slice(0, 200));
    throw new Error("SPWorlds returned invalid JSON; проверьте токен/ID");
  }
  const { username: spUsername, uuid } = spJson;
  if (!spUsername || !uuid) {
    throw new Error("У пользователя нет карты SPWorlds или неверный ответ API");
  }

  // === Upsert в Supabase ===
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
    throw new Error("Не удалось сохранить пользователя в БД");
  }

  // === Генерация JWT и упаковка в куку ===
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
