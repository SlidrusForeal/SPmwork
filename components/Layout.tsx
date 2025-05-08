// components/Layout.tsx
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; username: string } | null>(
    null
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setUser(data.user))
        .catch(() => localStorage.removeItem("token"));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    supabase.auth.signOut();
  };

  return (
    <div>
      <nav className="bg-gray-800 p-4 text-white">
        <Link href="/" className="mr-4">
          Главная
        </Link>
        <Link href="/orders" className="mr-4">
          Заказы
        </Link>
        {user ? (
          <>
            <span className="mr-4">Привет, {user.username}</span>
            <button onClick={logout}>Выйти</button>
          </>
        ) : (
          <Link href="/login" className="btn-primary">
            Войти
          </Link>
        )}
      </nav>
      <main className="container mx-auto p-4">{children}</main>
    </div>
  );
}
