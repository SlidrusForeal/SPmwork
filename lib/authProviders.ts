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
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID!,
    redirect_uri: `${NEXT_PUBLIC_BASE_URL}/api/auth/discord/callback`,
    response_type: "code",
    scope: "identify",
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

export async function handleDiscordCallback(code: string): Promise<string> {
  // 1) обмен code → access_token
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
  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    console.error("Discord /token error:", text);
    throw new Error(`Token exchange failed: ${tokenRes.status}`);
  }
  const { access_token } = await tokenRes.json();

  // 2) получение профиля из Discord
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!userRes.ok) {
    const text = await userRes.text();
    console.error("Discord /users/@me error:", text);
    throw new Error(`User fetch failed: ${userRes.status}`);
  }
  const { id: discordId, username: discordUsername } = await userRes.json();

  // 3) получение данных пользователя из SPWorlds
  const spData = await sp.findUser(discordId);
  if (!spData) {
    throw new Error("SPWorlds user not found");
  }
  const { uuid, username: spUsername } = spData;
  if (!uuid || !spUsername) {
    throw new Error("У пользователя нет действительной карты SPWorlds");
  }

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
    console.error("Supabase upsert error:", error);
    throw new Error("Не удалось сохранить пользователя в базе");
  }

  // 5) генерация JWT + Set-Cookie
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
