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
  !JWT_SECRET ||
  !SPWORLDS_ID ||
  !SPWORLDS_TOKEN
) {
  throw new Error("❌ Не заданы все необходимые env‑переменные");
}

/**
 * Формирует URL для редиректа на Discord OAuth2
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
 * 1) Меняет code → access_token
 * 2) Получает профиль Discord
 * 3) Находит карту пользователя в SPWorlds (через SDK)
 * 4) Сохраняет/обновляет запись в Supabase
 * 5) Генерирует JWT и упаковывает его в куку
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
  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error("Discord /token error:", errText);
    throw new Error(`Не удалось получить Discord token (${tokenRes.status})`);
  }
  const { access_token } = await tokenRes.json();

  // 2) Получаем профиль пользователя из Discord
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!userRes.ok) {
    const errText = await userRes.text();
    console.error("Discord /users/@me error:", errText);
    throw new Error(`Не удалось получить профиль Discord (${userRes.status})`);
  }
  const { id: discordId, username: discordUsername } = await userRes.json();

  // 3) Инициализируем SDK и ищем карту SPWorlds
  const sp = new SPWorlds({
    id: SPWORLDS_ID!,
    token: SPWORLDS_TOKEN!,
  });
  const userCard = await sp.findUser(discordId);
  if (!userCard) {
    console.error("SPWorlds.findUser вернул null для Discord ID:", discordId);
    throw new Error("Карта SPWorlds не найдена для этого Discord ID");
  }

  // 4) Upsert пользователя в Supabase
  //    Используем uuid из SPWorlds как первичный ключ
  const { uuid, username: spUsername } = userCard;
  const { data: userRecord, error } = await supabaseAdmin
    .from("users")
    .upsert(
      {
        id: uuid,
        username: spUsername || discordUsername,
        email: `${discordUsername}@discord`,
        role: "user",
        created_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .single();
  if (error) {
    console.error("Supabase upsert error:", error);
    throw new Error("Не удалось сохранить/обновить пользователя в базе");
  }

  // 5) Генерация JWT и упаковка в cookie
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
