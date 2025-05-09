// pages/profile.tsx
import { useState } from "react";
import useSWR, { type SWRResponse } from "swr";
import Layout from "../components/Layout";
import { Input, Button } from "../components/ui";
import { fetcher } from "../lib/fetcher";

interface User {
  id: string;
  username: string;
  role: string;
  minecraftUsername?: string;
  minecraftUuid?: string;
}

export default function Profile() {
  // Используем приведение типа вместо generic-параметра
  // Используем приведение к упрощённому типу вместо generic
  const swr = useSWR("/api/auth/me", fetcher) as {
    data?: { user: User };
    error?: any;
    mutate: () => Promise<any>;
  };
  const { data, error, mutate } = swr;

  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  if (error) return <Layout>Ошибка загрузки профиля</Layout>;
  if (!data) return <Layout>Загрузка...</Layout>;
  const user = data.user;

  const handleLink = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile/minecraft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // no body needed since we fetch from SPWorlds
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ошибка");
      mutate();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Профиль</h1>
      <p>
        <strong>Discord:</strong> {user.username}
      </p>
      <p>
        <strong>Роль:</strong> {user.role}
      </p>

      {user.minecraftUsername ? (
        <div className="mt-4 space-y-2">
          <p>
            <strong>Minecraft Ник:</strong> {user.minecraftUsername}
          </p>
          <p>
            <strong>UUID:</strong> {user.minecraftUuid}
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <p>У вас ещё не привязан Minecraft аккаунт.</p>
          <Button onClick={handleLink} disabled={loading}>
            {loading ? "Привязываем..." : "Привязать через SPWorlds"}
          </Button>
        </div>
      )}
    </Layout>
  );
}
