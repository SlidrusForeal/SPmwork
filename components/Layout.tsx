// components/Layout.tsx
import Link from "next/link";
import { useEffect, useState } from "react";
import { Sun, Moon, Menu, X } from "lucide-react";

interface User {
  id: string;
  username: string;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Получаем профиль пользователя из cookie
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Нет токена");
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));

    // Инициализируем тему из localStorage
    setDark(localStorage.getItem("theme") === "dark");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const logout = () => {
    // Удаляем cookie и редиректим
    window.location.assign("/api/auth/logout");
  };

  const handleLogin = () => {
    window.location.assign("/api/auth/discord/login");
  };

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
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
          <nav className="hidden md:flex items-center space-x-4">
            <Link href="/">Главная</Link>
            <Link href="/orders">Заказы</Link>
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
              <button
                onClick={handleLogin}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Войти через Discord
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              aria-label="Переключить тему"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </nav>
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Меню"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800">
            <nav className="flex flex-col p-4 space-y-2">
              <Link href="/">Главная</Link>
              <Link href="/orders">Заказы</Link>
              {user ? (
                <button onClick={logout}>Выйти</button>
              ) : (
                <button onClick={handleLogin}>Войти через Discord</button>
              )}
              <button onClick={toggleTheme} className="mt-2">
                {dark ? "Светлая тема" : "Тёмная тема"}
              </button>
            </nav>
          </div>
        )}
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
