import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import type { User } from "../types";

interface DiscordIdentity {
  id: string;
  provider: string;
}

interface MinecraftProfile {
  minecraftUsername: string;
  minecraftUuid: string;
}

interface UserError {
  message: string;
  code?: string;
}

async function fetchMinecraftProfile(
  discordId: string
): Promise<MinecraftProfile | null> {
  try {
    const response = await fetch(
      `https://api.discord.com/users/${discordId}/profile`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
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
  const [error, setError] = useState<UserError | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initializeUser() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          setUser(null);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", sessionData.session.user.id)
          .single();

        if (profileError) {
          throw new Error(profileError.message);
        }

        if (!mounted) return;

        // Если это новый вход через Discord и у пользователя нет minecraft данных
        if (
          sessionData.session.user.app_metadata.provider === "discord" &&
          (!profile.minecraftUsername || !profile.minecraftUuid)
        ) {
          const discordIdentity = sessionData.session.user.identities?.find(
            (identity: DiscordIdentity) => identity.provider === "discord"
          );

          if (discordIdentity) {
            const minecraftProfile = await fetchMinecraftProfile(
              discordIdentity.id
            );

            if (minecraftProfile && mounted) {
              // Обновляем профиль с данными Minecraft
              const { error: updateError } = await supabase
                .from("profiles")
                .update({
                  minecraftUsername: minecraftProfile.minecraftUsername,
                  minecraftUuid: minecraftProfile.minecraftUuid,
                })
                .eq("id", sessionData.session.user.id);

              if (!updateError && mounted) {
                profile.minecraftUsername = minecraftProfile.minecraftUsername;
                profile.minecraftUuid = minecraftProfile.minecraftUuid;
              }
            }
          }
        }

        if (mounted) {
          setUser(profile);
          setError(null);
        }
      } catch (err) {
        console.error("Error initializing user:", err);
        if (mounted) {
          setError({
            message: "Не удалось загрузить данные пользователя",
            code: err instanceof Error ? err.message : undefined,
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await initializeUser();
      } else if (event === "SIGNED_OUT") {
        if (mounted) {
          setUser(null);
          setError(null);
          setLoading(false);
        }
      }
    });

    initializeUser();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading, error };
}
