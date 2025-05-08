// components/Layout.tsx
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Sun, Moon } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; username: string } | null>(
    null
  );
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((data) => setUser(data.user))
        .catch(() => localStorage.removeItem("token"));
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <Link
            href="/"
            className="text-2xl font-bold text-blue-600 dark:text-blue-400"
          >
            SPmwork
          </Link>
          <nav className="flex items-center space-x-4">
            <Link
              href="/"
              className="hover:text-blue-600 dark:hover:text-blue-400"
            >
              Главная
            </Link>
            <Link
              href="/orders"
              className="hover:text-blue-600 dark:hover:text-blue-400"
            >
              Заказы
            </Link>
            {user ? (
              <>
                <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                  Привет, <strong>{user.username}</strong>
                </span>
                <button
                  onClick={logout}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Выйти
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Войти
              </Link>
            )}
            <button
              onClick={() => setDark((d) => !d)}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-6">{children}</main>
      <footer className="bg-gray-100 dark:bg-gray-800 py-4">
        <div className="container mx-auto text-center text-sm text-gray-600 dark:text-gray-400">
          © {new Date().getFullYear()} SPmwork. Все права защищены.
        </div>
      </footer>
    </div>
  );
}
