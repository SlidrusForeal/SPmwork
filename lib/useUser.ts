import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import type { User } from "../types";

interface DiscordIdentity {
  id: string;
  provider: string;
}

async function fetchMinecraftProfile(discordId: string) {
  try {
    const response = await fetch(
      `https://api.discord.com/users/${discordId}/profile`
    );
    if (!response.ok) return null;

    const data = await response.json();
    // Проверяем связанные аккаунты на наличие Minecraft
    const minecraftAccount = data.connected_accounts?.find(
      (account: any) => account.type === "minecraft"
    );

    if (minecraftAccount) {
      return {
        minecraftUsername: minecraftAccount.name,
        minecraftUuid: minecraftAccount.id,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching Minecraft profile:", error);
    return null;
  }
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const session = supabase.auth.getSession();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        // Если это новый вход через Discord и у пользователя нет minecraft данных
        if (
          event === "SIGNED_IN" &&
          session.user.app_metadata.provider === "discord" &&
          (!profile.minecraftUsername || !profile.minecraftUuid)
        ) {
          const discordIdentity = session.user.identities?.find(
            (identity: DiscordIdentity) => identity.provider === "discord"
          );

          if (discordIdentity) {
            const minecraftProfile = await fetchMinecraftProfile(
              discordIdentity.id
            );

            if (minecraftProfile) {
              // Обновляем профиль с данными Minecraft
              const { error: updateError } = await supabase
                .from("profiles")
                .update({
                  minecraftUsername: minecraftProfile.minecraftUsername,
                  minecraftUuid: minecraftProfile.minecraftUuid,
                })
                .eq("id", session.user.id);

              if (!updateError) {
                profile.minecraftUsername = minecraftProfile.minecraftUsername;
                profile.minecraftUuid = minecraftProfile.minecraftUuid;
              }
            }
          }
        }

        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
