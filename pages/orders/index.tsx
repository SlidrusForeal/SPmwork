// pages/orders/index.tsx
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import type { GetServerSideProps } from "next";
import Layout from "../../components/Layout";
import { Card } from "../../components/ui";
import { motion } from "framer-motion";
import Link from "next/link";
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
      <h1 className="text-2xl mb-4">Заказы</h1>
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
    // 1) Валидация JWT
    const { id } = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // 2) Загрузка списка заказов
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .or(`status.eq.open,buyer_id.eq.${id}`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { props: { orders } };
  } catch {
    // При отсутствии или истечении токена — редирект на логин
    return { redirect: { destination: "/login", permanent: false } };
  }
};
