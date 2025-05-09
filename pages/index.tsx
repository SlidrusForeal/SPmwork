// pages/index.tsx
import type { NextPage, GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "../components/Layout";
import { Card, Button } from "../components/ui";
import { ShieldCheck, MessageSquare, DollarSign } from "lucide-react";
import { supabaseAdmin } from "../lib/supabaseAdmin";

interface Order {
  id: string;
  title: string;
  budget: number;
  category: string;
}

interface HomeProps {
  orders: Order[];
}

const Home: NextPage<HomeProps> = ({ orders }) => {
  return (
    <Layout>
      <Head>
        <title>SPmwork — Freelance‑платформа Minecraft</title>
        <meta
          name="description"
          content="SPmwork — заказывай карты, плагины и скины у проверенных мастеров!"
        />
      </Head>

      {/* Hero */}
      <section className="bg-primary text-white py-20 px-6 text-center rounded-lg mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Найди рабочего для своих нужд на #СПм!
        </h1>
        <p className="text-lg mb-8">
          Ресурсы, постройки, скины, арты, мапарты и многое другое — всё в одном
          месте с гарантией эскроу‑платежа.
        </p>
        <Link href="/orders/create">
          <a className="inline-block bg-secondary hover:bg-secondary-dark text-white text-lg px-8 py-4 rounded">
            Создать заказ
          </a>
        </Link>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16">
        <div className="flex flex-col items-center text-center">
          <ShieldCheck size={48} className="mb-4 text-primary" />
          <h3 className="text-xl font-semibold mb-2">Безопасный эскроу</h3>
          <p className="text-sm text-neutral-600">
            Деньги хранятся до полного завершения работ — вы платите только за
            результат.
          </p>
        </div>
        <div className="flex flex-col items-center text-center">
          <MessageSquare size={48} className="mb-4 text-primary" />
          <h3 className="text-xl font-semibold mb-2">Встроенный чат</h3>
          <p className="text-sm text-neutral-600">
            Общайтесь с исполнителем напрямую, уточняйте детали и сроки.
          </p>
        </div>
        <div className="flex flex-col items-center text-center">
          <DollarSign size={48} className="mb-4 text-primary" />
          <h3 className="text-xl font-semibold mb-2">Мгновенные выплаты</h3>
          <p className="text-sm text-neutral-600">
            После приёма работы средства сразу перечисляются исполнителю.
          </p>
        </div>
      </section>

      {/* Latest orders */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Свежие заказы</h2>
          <Link href="/orders">
            <a className="text-primary hover:underline">Смотреть все</a>
          </Link>
        </div>

        {orders.length === 0 ? (
          <p>Пока нет открытых заказов.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {orders.map((o) => (
              <Card key={o.id} className="flex flex-col justify-between p-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{o.title}</h3>
                  <p className="text-sm text-neutral-500 mb-4">
                    Категория: <strong>{o.category}</strong>
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <span>
                    Бюджет: <strong>{o.budget} AR</strong>
                  </span>
                  <Link href={`/orders/${o.id}`}>
                    <a>
                      <Button variant="ghost" className="px-2 py-1 text-sm">
                        Подробнее
                      </Button>
                    </a>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("id, title, budget, category")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    console.error("Ошибка при загрузке заказов:", error.message);
  }

  return {
    props: {
      orders: data ?? [],
    },
  };
};

export default Home;
