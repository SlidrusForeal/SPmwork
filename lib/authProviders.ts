// lib/authProviders.ts
import { SPWorlds } from "spworlds";
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
  !JWT_SECRET
) {
  throw new Error("❌ Не заданы env‑переменные для OAuth или JWT_SECRET");
}

// 1) Сформировать URL для редиректа на Discord
export function getDiscordAuthUrl() {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/discord/callback`,
    response_type: "code",
    scope: "identify",
  });
  return `https://discord.com/api/oauth2/authorize?${params}`;
}

// 2) Отработать callback: code → access_token → профиль → карта SPWorlds → JWT+кука
export async function handleDiscordCallback(code: string) {
  // 1) обмен code → токен
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

  // Читаем текст вместо .json()
  const tokenText = await tokenRes.text();
  console.error(">>> Discord /token response status:", tokenRes.status);
  console.error(">>> Discord /token response body:\n", tokenText);

  if (!tokenRes.ok) {
    // сразу выбрасываем с подробностями
    throw new Error(`Token exchange failed: ${tokenRes.status}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(tokenText);
  } catch (e) {
    console.error("JSON.parse error on tokenText:", e);
    throw new Error("Failed to parse Discord token JSON");
  }
  const { access_token } = parsed;

  // 2) получение профиля
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const userText = await userRes.text();
  console.error(">>> Discord /users/@me response status:", userRes.status);
  console.error(">>> Discord /users/@me response body:\n", userText);

  if (!userRes.ok) {
    throw new Error(`User fetch failed: ${userRes.status}`);
  }
  let userJson;
  try {
    userJson = JSON.parse(userText);
  } catch (e) {
    console.error("JSON.parse error on userText:", e);
    throw new Error("Failed to parse Discord user JSON");
  }
  const { id: discordId, username } = userJson;

  // найти карту SPWorlds по Discord ID
  const sp = new SPWorlds({
    id: process.env.SPWORLDS_ID!,
    token: process.env.SPWORLDS_TOKEN!,
  });
  const userCard = await sp.findUser(discordId);
  if (!userCard) {
    throw new Error("Карта SPWorlds не найдена для этого Discord ID");
  }

  // upsert юзера в БД
  await supabaseAdmin.from("users").upsert(
    {
      id: userCard.uuid,
      username,
      email: `${username}@spworlds`,
      role: "user",
      created_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  // сгенерировать JWT
  const token = jwt.sign({ id: userCard.uuid, username }, JWT_SECRET!, {
    expiresIn: "7d",
  });

  // упаковать куку
  const cookie = serialize("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return cookie;
}
