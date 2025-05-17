// pages/profile.tsx
import React, { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import Skeleton from "react-loading-skeleton";
import Image from "next/image";
import Layout from "../components/Layout";
import { Card, Button } from "../components/ui";
import { fetcher } from "../lib/fetcher";
import { Clock, Star, MessageSquare, Package, RefreshCw } from "lucide-react";
import ReviewList from "../components/ReviewList";

interface User {
  id: string;
  username: string;
  role: string;
  minecraftUsername?: string;
  minecraftUuid?: string;
  created_at?: string;
}

interface Stats {
  totalOrders: number;
  completedOrders: number;
  averageRating: number;
  totalMessages: number;
}

export default function Profile() {
  const { data, error, mutate } = useSWR<{ user: User }>(
    "/api/auth/me",
    fetcher
  );
  const { data: statsData } = useSWR<{ stats: Stats }>(
    "/api/profile/stats",
    fetcher
  );
  const { data: reviewsData } = useSWR<{ reviews: any[] }>(
    data?.user ? `/api/reviews?userId=${data.user.id}` : null,
    fetcher
  );

  const [isLinking, setIsLinking] = useState(false);
  const [skinView, setSkinView] = useState<"front" | "back" | "full">("front");
  const [copied, setCopied] = useState(false);

  const linkMinecraft = useCallback(async () => {
    if (isLinking) return;
    setIsLinking(true);
    try {
      const res = await fetch("/api/profile/minecraft", { method: "POST" });
      if (!res.ok) throw new Error("Не удалось привязать Minecraft аккаунт");
      await mutate();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLinking(false);
    }
  }, [mutate, isLinking]);

  // Автоматическая привязка при загрузке профиля
  useEffect(() => {
    if (data?.user && !data.user.minecraftUsername && !isLinking) {
      linkMinecraft();
    }
  }, [data, linkMinecraft, isLinking]);

  const copyUUID = async () => {
    if (data?.user.minecraftUuid) {
      await navigator.clipboard.writeText(data.user.minecraftUuid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getSkinUrl = () => {
    if (!data?.user.minecraftUuid)
      return "https://crafatar.com/renders/body/steve?size=300&overlay";
    switch (skinView) {
      case "front":
        return `https://crafatar.com/renders/body/${data.user.minecraftUuid}?size=300&overlay&default=MHF_Steve`;
      case "back":
        return `https://crafatar.com/renders/body/${data.user.minecraftUuid}?size=300&overlay&default=MHF_Steve&rotation=180`;
      case "full":
        return `https://crafatar.com/skins/${data.user.minecraftUuid}?default=MHF_Steve`;
      default:
        return `https://crafatar.com/renders/body/${data.user.minecraftUuid}?size=300&overlay&default=MHF_Steve`;
    }
  };

  if (error) {
    return (
      <Layout>
        <Card className="max-w-4xl mx-auto p-6 text-red-600">
          Ошибка загрузки профиля
        </Card>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <Card className="max-w-4xl mx-auto p-6 space-y-4">
          <Skeleton height={28} width={150} />
          <Skeleton height={20} count={2} />
          <Skeleton height={36} width={140} />
        </Card>
      </Layout>
    );
  }

  const { user } = data;
  const stats = statsData?.stats;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Основная информация */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-8">
            {/* Левая колонка со скином */}
            <div className="flex-shrink-0 w-full md:w-auto">
              <div className="relative aspect-[3/4] w-full md:w-[300px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                {user.minecraftUsername && user.minecraftUuid ? (
                  <>
                    <Image
                      src={getSkinUrl()}
                      alt={`${user.minecraftUsername} skin`}
                      fill
                      className="object-contain"
                      onError={(e) => {
                        // If the skin fails to load, try using Minotar as fallback
                        const username = user.minecraftUsername || "steve";
                        if (skinView === "full") {
                          e.currentTarget.src = `https://minotar.net/skin/${username}`;
                        } else {
                          e.currentTarget.src = `https://minotar.net/body/${username}/300`;
                        }
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center p-2 bg-black/50">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => setSkinView("front")}
                          className="text-white"
                        >
                          Спереди
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setSkinView("back")}
                          className="text-white"
                        >
                          Сзади
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setSkinView("full")}
                          className="text-white"
                        >
                          Развертка
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>Скин недоступен</p>
                  </div>
                )}
              </div>
            </div>

            {/* Правая колонка с информацией */}
            <div className="flex-grow space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-4">{user.username}</h1>
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="font-semibold">Роль:</span>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded text-sm">
                      {user.role}
                    </span>
                  </p>
                  {user.created_at && (
                    <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Clock size={16} />
                      На сайте с{" "}
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Minecraft информация */}
              <div className="space-y-2">
                <h2 className="text-xl font-semibold mb-2">
                  Minecraft аккаунт
                </h2>
                {!user.minecraftUsername ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    {isLinking ? (
                      <>
                        <RefreshCw className="animate-spin" size={16} />
                        <span>Привязываем аккаунт...</span>
                      </>
                    ) : (
                      <span>Подождите, идёт привязка аккаунта...</span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="flex items-center gap-2">
                      <span className="font-semibold">Никнейм:</span>
                      <span className="font-mono">
                        {user.minecraftUsername}
                      </span>
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        UUID: {user.minecraftUuid}
                      </code>
                      <Button
                        variant="ghost"
                        onClick={copyUUID}
                        className="text-sm"
                      >
                        {copied ? "Скопировано!" : "Копировать"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Статистика */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Package className="text-blue-500" size={24} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Всего заказов
                  </p>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Star className="text-yellow-500" size={24} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Выполнено
                  </p>
                  <p className="text-2xl font-bold">{stats.completedOrders}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Star className="text-yellow-500" size={24} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Рейтинг
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.averageRating.toFixed(1)} ★
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="text-green-500" size={24} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Сообщений
                  </p>
                  <p className="text-2xl font-bold">{stats.totalMessages}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Reviews section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Отзывы о работе</h2>
          <ReviewList reviews={reviewsData?.reviews || []} className="mt-4" />
        </Card>
      </div>
    </Layout>
  );
}
