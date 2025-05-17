import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "./ui/Button";

interface StatsData {
  date: string;
  orders: number;
  users: number;
  messages: number;
}

const CACHE_KEY = "admin_stats";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  data: StatsData[];
  timestamp: number;
}

export default function Stats() {
  const [data, setData] = useState<StatsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async (ignoreCache = false) => {
    try {
      // Check cache first
      if (!ignoreCache) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data: cachedData, timestamp }: CachedData =
            JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setData(cachedData);
            setLastUpdated(new Date(timestamp));
            setLoading(false);
            return;
          }
        }
      }

      // Получаем статистику за последние 30 дней
      const endDate = new Date();
      const startDate = subDays(endDate, 30);

      // Запрашиваем данные из базы
      const [ordersData, usersData, messagesData] = await Promise.all([
        supabase
          .from("orders")
          .select("created_at")
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),
        supabase
          .from("users")
          .select("created_at")
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),
        supabase
          .from("messages")
          .select("created_at")
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),
      ]);

      if (ordersData.error) throw new Error(ordersData.error.message);
      if (usersData.error) throw new Error(usersData.error.message);
      if (messagesData.error) throw new Error(messagesData.error.message);

      // Группируем данные по дням
      const stats: Record<string, StatsData> = {};
      for (let i = 0; i <= 30; i++) {
        const date = format(subDays(endDate, i), "yyyy-MM-dd");
        stats[date] = {
          date,
          orders: 0,
          users: 0,
          messages: 0,
        };
      }

      // Подсчитываем количество заказов по дням
      ordersData.data?.forEach((order) => {
        const date = format(new Date(order.created_at), "yyyy-MM-dd");
        if (stats[date]) {
          stats[date].orders++;
        }
      });

      // Подсчитываем количество новых пользователей по дням
      usersData.data?.forEach((user) => {
        const date = format(new Date(user.created_at), "yyyy-MM-dd");
        if (stats[date]) {
          stats[date].users++;
        }
      });

      // Подсчитываем количество сообщений по дням
      messagesData.data?.forEach((message) => {
        const date = format(new Date(message.created_at), "yyyy-MM-dd");
        if (stats[date]) {
          stats[date].messages++;
        }
      });

      // Преобразуем объект в массив и сортируем по дате
      const sortedData = Object.values(stats).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Cache the data
      const now = Date.now();
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: sortedData,
          timestamp: now,
        })
      );

      setData(sortedData);
      setLastUpdated(new Date(now));
      setError(null);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Не удалось загрузить статистику");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRefresh = () => {
    setLoading(true);
    fetchStats(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-center text-red-500 p-4">{error}</div>
        <div className="text-center">
          <Button onClick={handleRefresh}>Попробовать снова</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Статистика за 30 дней</h2>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Обновлено: {format(lastUpdated, "HH:mm", { locale: ru })}
            </span>
          )}
          <Button onClick={handleRefresh} disabled={loading}>
            Обновить
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Всего заказов
          </div>
          <div className="text-2xl font-bold">
            {data.reduce((sum, day) => sum + day.orders, 0)}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Новых пользователей
          </div>
          <div className="text-2xl font-bold">
            {data.reduce((sum, day) => sum + day.users, 0)}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Сообщений
          </div>
          <div className="text-2xl font-bold">
            {data.reduce((sum, day) => sum + day.messages, 0)}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">График активности</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date: string) =>
                  format(new Date(date), "d MMM", { locale: ru })
                }
              />
              <YAxis />
              <Tooltip
                labelFormatter={(date: string) =>
                  format(new Date(date), "d MMMM yyyy", { locale: ru })
                }
              />
              <Line
                type="monotone"
                dataKey="orders"
                name="Заказы"
                stroke="#3b82f6"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="users"
                name="Пользователи"
                stroke="#10b981"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="messages"
                name="Сообщения"
                stroke="#f59e0b"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
