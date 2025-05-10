// pages/profile.tsx
import React, { useState, useEffect } from "react";
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

  // Автоматическая привязка при первом и последующих заходах
  useEffect(() => {
    if (!data) return;
    const user = data.user;
    if (!user.minecraftUsername && !loading && !autoLinked) {
      // автоматический handleLink
      linkMinecraft();
    }
  }, [data, loading, autoLinked]);

  const linkMinecraft = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile/minecraft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ошибка привязки");
      await mutate();
    } catch (e: any) {
      console.error("Auto link error:", e.message);
    } finally {
      setLoading(false);
      setAutoLinked(true);
    }
  };

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

        {user.minecraftUsername && user.minecraftUuid ? (
          <div className="flex justify-center">
            <Image
              src={`https://crafatar.com/renders/body/${user.minecraftUuid}?size=200&overlay`}
              width={200}
              height={200}
              alt={`${user.minecraftUsername} skin`}
              className="rounded-lg bg-white"
            />
          </div>
        ) : (
          <div className="text-center text-neutral-500">
            {loading
              ? "Привязываем Minecraft аккаунт..."
              : "Minecraft аккаунт не привязан"}
          </div>
        )}

        <div className="space-y-2">
          <p>
            <span className="font-semibold">Discord:</span> {user.username}
          </p>
          <p>
            <span className="font-semibold">Роль:</span> {user.role}
          </p>
        </div>

        {user.minecraftUsername ? (
          <div className="space-y-2">
            <p>
              <span className="font-semibold">Minecraft Ник:</span>{" "}
              {user.minecraftUsername}
            </p>
            <div className="flex items-center space-x-2">
              <span className="font-semibold">UUID:</span>
              <code className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {user.minecraftUuid}
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
          </div>
        ) : null}
      </Card>
    </Layout>
  );
}
