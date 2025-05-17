"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Sun, Moon, Menu, X } from "lucide-react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import type { User } from "../types";
import NotificationsPopover from "./NotificationsPopover";
import PwaPrompt from "./PwaPrompt";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Нет токена");
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));

    setDark(localStorage.getItem("theme") === "dark");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.backgroundColor = dark
      ? "#111827"
      : "#ffffff";
    document.body.style.backgroundColor = dark ? "#111827" : "#ffffff";
  }, [dark]);

  const logout = () => {
    window.location.assign("/api/auth/logout");
    setMobileOpen(false);
  };
  const handleLogin = () => {
    window.location.assign("/api/auth/discord/login");
    setMobileOpen(false);
  };
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setMobileOpen(false);
  };

  const handleNavClick = () => setMobileOpen(false);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <Link
            href="/"
            className="flex items-center space-x-3 hover:text-primary transition-colors"
            onClick={handleNavClick}
          >
            {/* Увеличенный favicon */}
            <Image src="/favicon.ico" alt="SPmwork" width={64} height={64} />
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              SPmwork
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="hover:text-primary transition-colors"
              onClick={handleNavClick}
            >
              Главная
            </Link>
            <Link
              href="/orders"
              className="hover:text-primary transition-colors"
              onClick={handleNavClick}
            >
              Заказы
            </Link>

            {user ? (
              <div className="flex items-center space-x-3">
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                >
                  {user.minecraftUsername && (
                    <Image
                      src={`https://minotar.net/avatar/${user.minecraftUsername}/32`}
                      width={32}
                      height={32}
                      alt="Голова игрока Minecraft"
                      className="rounded-full"
                      onError={(e) => {
                        // Fallback to default Steve head if image fails to load
                        e.currentTarget.src =
                          "https://minotar.net/avatar/steve/32";
                      }}
                    />
                  )}
                  <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                    Привет, <strong>{user.username}</strong>
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Войти через Discord
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              aria-label="Переключить тему"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </nav>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Меню"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800">
            <nav className="flex flex-col p-4 space-y-2">
              <Link
                href="/"
                className="hover:text-primary transition-colors"
                onClick={handleNavClick}
              >
                Главная
              </Link>
              <Link
                href="/orders"
                className="hover:text-primary transition-colors"
                onClick={handleNavClick}
              >
                Заказы
              </Link>

              {user ? (
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-4">
                    <NotificationsPopover />
                    <Link
                      href="/profile"
                      className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                      onClick={handleNavClick}
                    >
                      {user.minecraftUsername && (
                        <Image
                          src={`https://minotar.net/avatar/${user.minecraftUsername}/32`}
                          width={32}
                          height={32}
                          alt="Голова игрока Minecraft"
                          className="rounded-full"
                          onError={(e) => {
                            // Fallback to default Steve head if image fails to load
                            e.currentTarget.src =
                              "https://minotar.net/avatar/steve/32";
                          }}
                        />
                      )}
                      <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        Привет, <strong>{user.username}</strong>
                      </span>
                    </Link>
                  </div>
                  <button
                    onClick={logout}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    Выйти
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Войти через Discord
                </button>
              )}

              <button
                onClick={toggleTheme}
                className="mt-2 px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
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

      <PwaPrompt />
    </div>
  );
}
