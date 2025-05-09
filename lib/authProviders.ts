// lib/authProviders.ts
import { serialize } from "cookie";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "./supabaseAdmin";
import { sp } from "./spworlds";

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
  throw new Error("❌ Не заданы все необходимые env‑переменные");
}

export function getDiscordAuthUrl(): string {
  const redirectUri = `${NEXT_PUBLIC_BASE_URL}/api/auth/discord/callback`;
  console.log("[Discord] Redirect URI =", redirectUri);

  const params = new URLSearchParams();
  params.set("client_id", DISCORD_CLIENT_ID!);
  params.set("redirect_uri", redirectUri);
  params.set("response_type", "code");
  params.set("scope", "identify");

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

export async function handleDiscordCallback(code: string): Promise<string> {
  const redirectUri = `${NEXT_PUBLIC_BASE_URL}/api/auth/discord/callback`;

  // 1) Обмен code → access_token
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
    console.error("[Discord /token] status=", tokenRes.status, "body=", body);
    throw new Error(`Token exchange failed: ${tokenRes.status}`);
  }

  const { access_token } = await tokenRes.json();

  // 2) Получение профиля из Discord
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!userRes.ok) {
    const body = await userRes.text();
    console.error(
      "[Discord /users/@me] status=",
      userRes.status,
      "body=",
      body
    );
    throw new Error(`User fetch failed: ${userRes.status}`);
  }

  const { id: discordId, username: discordUsername } = await userRes.json();

  // 3) Получение данных пользователя из SPWorlds
  let spData;
  try {
    spData = await sp.findUser(discordId);
  } catch (e) {
    console.error("[SPWorlds findUser] error:", e);
    throw new Error("Не удалось получить данные пользователя SPWorlds");
  }

  if (!spData || !spData.uuid || !spData.username) {
    console.error("[SPWorlds findUser] неверный ответ:", spData);
    throw new Error("У пользователя нет действующей карты SPWorlds");
  }

  const { uuid, username: spUsername } = spData;

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
    console.error("[Supabase upsert] error:", error);
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
