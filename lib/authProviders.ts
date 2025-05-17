// lib/authProviders.ts
import { serialize } from "cookie";
import { signToken } from "./auth";
import { supabaseAdmin } from "./supabaseAdmin";

const {
  NEXT_PUBLIC_BASE_URL,
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  NODE_ENV,
} = process.env;

if (!NEXT_PUBLIC_BASE_URL || !DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
  throw new Error("❌ Не заданы env-переменные для Discord OAuth2");
}

function getRedirectUri() {
  return `${NEXT_PUBLIC_BASE_URL}/api/auth/discord/callback`;
}

export function getDiscordAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID!,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: "identify",
  });

  if (state) {
    params.append("state", state);
  }

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

export async function handleDiscordCallback(code: string): Promise<string> {
  // 1) Получаем OAuth-токен Discord
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID!,
      client_secret: DISCORD_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
    }).toString(),
  });
  if (!tokenRes.ok) {
    const txt = await tokenRes.text();
    throw new Error(`Discord token error ${tokenRes.status}: ${txt}`);
  }
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  // 2) Получаем профиль Discord
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!userRes.ok) {
    const txt = await userRes.text();
    throw new Error(`Discord user error ${userRes.status}: ${txt}`);
  }
  const {
    id: discordId,
    username: discordUsername,
    avatar,
  } = (await userRes.json()) as {
    id: string;
    username: string;
    avatar: string | null;
  };

  // 3) Upsert пользователя в Supabase (без SPWorlds)
  const { data: userRecord, error } = await supabaseAdmin
    .from("users")
    .upsert(
      {
        id: discordId,
        discord_username: discordUsername,
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

  // 4) Генерация JWT и установка cookie
  const token = signToken({
    id: userRecord.id,
    username: userRecord.discord_username,
    role: userRecord.role, // <— новая строка
  });
  const isProd = NODE_ENV === "production";
  return serialize("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "none",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}
