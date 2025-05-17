// pages/profile.tsx
import React, { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import Skeleton from "react-loading-skeleton";
import Image from "next/image";
import Layout from "../components/Layout";
import { Card, Button } from "../components/ui";
import { fetcher } from "../lib/fetcher";

interface User {
  id: string;
  username: string;
  role: string;
  minecraftUsername?: string;
  minecraftUuid?: string;
}

export default function Profile() {
  const { data, error, mutate } = useSWR<{ user: User }>(
    "/api/auth/me",
    fetcher
  );
  const [loading, setLoading] = useState(false);
  const [autoLinked, setAutoLinked] = useState(false);

  const linkMinecraft = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile/minecraft", { method: "POST" });
      if (!res.ok) throw new Error("Не удалось привязать Minecraft аккаунт");
      await mutate();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setAutoLinked(true);
    }
  }, [mutate]);

  // Автопривязка через SPWorlds
  useEffect(() => {
    let mounted = true;

    async function autoLink() {
      if (!data?.user || autoLinked) return;
      if (!data.user.minecraftUsername && mounted) {
        await linkMinecraft();
      }
    }

    autoLink();

    return () => {
      mounted = false;
    };
  }, [data, autoLinked, linkMinecraft]);

  if (error) {
    return (
      <Layout>
        <Card className="max-w-md mx-auto p-6 text-red-600">
          Ошибка загрузки профиля
        </Card>
      </Layout>
    );
  }
  if (!data) {
    return (
      <Layout>
        <Card className="max-w-md mx-auto p-6 space-y-4">
          <Skeleton height={28} width={150} />
          <Skeleton height={20} count={2} />
          <Skeleton height={36} width={140} />
        </Card>
      </Layout>
    );
  }

  const { user } = data;

  return (
    <Layout>
      <Card className="max-w-md mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center">Профиль</h1>

        {/* Секция Discord и SPWorlds */}
        <div className="space-y-2 text-center">
          <p>
            <span className="font-semibold">Discord:</span> {user.username}
          </p>
          {!user.minecraftUsername ? (
            <Button
              onClick={linkMinecraft}
              disabled={loading}
              className="mt-2"
              aria-label="Привязать Minecraft аккаунт"
            >
              {loading ? "Привязываем..." : "Привязать через SPWorlds"}
            </Button>
          ) : (
            <p className="text-green-600">Minecraft аккаунт привязан</p>
          )}
        </div>

        {/* Скин игрока */}
        {user.minecraftUsername && user.minecraftUuid && (
          <div className="flex justify-center mt-4">
            <Image
              src={`https://crafatar.com/renders/body/${user.minecraftUuid}?size=200&overlay`}
              width={200}
              height={200}
              alt={`${user.minecraftUsername} skin`}
              className="rounded-lg"
            />
          </div>
        )}

        {/* Остальные данные */}
        <div className="space-y-2">
          <p>
            <span className="font-semibold">Роль:</span> {user.role}
          </p>
          {user.minecraftUsername && (
            <div className="flex items-center space-x-2">
              <code className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                UUID: {user.minecraftUuid}
              </code>
              <Button
                variant="ghost"
                className="px-2 py-1 text-sm"
                onClick={() =>
                  navigator.clipboard.writeText(user.minecraftUuid || "")
                }
                aria-label="Скопировать UUID"
              >
                Копировать
              </Button>
            </div>
          )}
        </div>
      </Card>
    </Layout>
  );
}
