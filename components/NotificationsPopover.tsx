import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Popover } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { supabase } from "../lib/supabaseClient";
import { useUser } from "../lib/useUser";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export default function NotificationsPopover() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Загрузка уведомлений
  const { data, mutate } = useSWR<{ notifications: Notification[] }>(
    user ? "/api/notifications?unreadOnly=false&limit=10" : null
  );

  // Подписка на новые уведомления
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Обновляем список уведомлений
          mutate();

          // Показываем браузерное уведомление
          if (Notification.permission === "granted") {
            new Notification(payload.new.title, {
              body: payload.new.message,
              icon: "/favicon.ico",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, mutate]);

  // Подсчет непрочитанных уведомлений
  useEffect(() => {
    if (data?.notifications) {
      const count = data.notifications.filter((n) => !n.read_at).length;
      setUnreadCount(count);
    }
  }, [data]);

  // Отметить уведомления как прочитанные
  const markAsRead = async (ids: string[]) => {
    if (ids.length === 0) return;

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      mutate();
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // Отметить все как прочитанные при открытии
  useEffect(() => {
    if (isOpen && data?.notifications) {
      const unreadIds = data.notifications
        .filter((n) => !n.read_at)
        .map((n) => n.id);
      markAsRead(unreadIds);
    }
  }, [isOpen, data]);

  if (!user) return null;

  return (
    <Popover className="relative">
      <Popover.Button
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </Popover.Button>

      <AnimatePresence>
        {isOpen && (
          <Popover.Panel
            as={motion.div}
            static
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          >
            <div className="p-4">
              <h3 className="text-lg font-medium mb-4">Уведомления</h3>
              {data?.notifications && data.notifications.length > 0 ? (
                <div className="space-y-4">
                  {data.notifications.map((notification) => (
                    <a
                      key={notification.id}
                      href={notification.link || "#"}
                      className={`block p-3 rounded-lg transition-colors ${
                        notification.read_at
                          ? "bg-gray-50 dark:bg-gray-700"
                          : "bg-blue-50 dark:bg-blue-900"
                      }`}
                    >
                      <div className="font-medium">{notification.title}</div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </p>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {formatDistanceToNow(
                          new Date(notification.created_at),
                          {
                            addSuffix: true,
                            locale: ru,
                          }
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Нет уведомлений
                </p>
              )}
            </div>
          </Popover.Panel>
        )}
      </AnimatePresence>
    </Popover>
  );
}
