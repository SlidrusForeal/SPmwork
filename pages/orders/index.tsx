// pages/orders/index.tsx
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import Layout from "../../components/Layout";
import { Card, Button } from "../../components/ui";
import { motion } from "framer-motion";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

type Order = {
  id: string;
  title: string;
  budget: number;
  status: string;
};

export default function OrdersPage({ orders }: { orders: Order[] }) {
  return (
    <Layout>
      {/* Заголовок и кнопка создания заказа */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Заказы</h1>
        <Link href="/orders/create">
          <Button>Создать заказ</Button>
        </Link>
      </div>

      {/* Сетка карточек заказов */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {orders.map((o) => (
          <motion.div key={o.id} whileHover={{ scale: 1.02 }}>
            <Card className="h-full flex flex-col justify-between">
              <Link
                href={`/orders/${o.id}`}
                className="text-xl font-semibold mb-2"
              >
                {o.title}
              </Link>
              <p className="mb-4">
                Бюджет: <strong>{o.budget}</strong>
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                Статус: {o.status}
              </p>
              <Link href={`/orders/${o.id}`}>
                <button className="btn-primary w-full">Подробнее</button>
              </Link>
            </Card>
          </motion.div>
        ))}
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.token || "";

  try {
    // Проверяем JWT из cookie
    const { id } = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Загружаем заказы: открытые или созданные текущим пользователем
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .or(`status.eq.open,buyer_id.eq.${id}`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { props: { orders } };
  } catch {
    // При отсутствии или истечении токена — редирект на страницу входа
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
};
