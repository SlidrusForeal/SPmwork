import { useEffect, useState } from "react";
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

interface StatsData {
  date: string;
  orders: number;
  users: number;
  messages: number;
}

export default function Stats() {
  const [data, setData] = useState<StatsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
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
        setData(
          Object.values(stats).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          )
        );
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("Не удалось загрузить статистику");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Статистика за 30 дней</h2>
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
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">График активности</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) =>
                  format(new Date(date), "d MMM", { locale: ru })
                }
              />
              <YAxis />
              <Tooltip
                labelFormatter={(date) =>
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
