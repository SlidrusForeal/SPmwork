// pages/orders/index.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "../../components/Layout";
import { Card, Button } from "../../components/ui";

type Order = { id: string; title: string; budget: number; status: string };

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/orders", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((data) => setOrders(data.orders))
        .catch(console.error);
    }
  }, []);

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Заказы</h1>
      <Link href="/orders/create">
        <Button variant="secondary">Новый заказ</Button>
      </Link>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {orders.map((o) => (
          <Card key={o.id}>
            <h2 className="text-xl font-semibold mb-2">{o.title}</h2>
            <p className="mb-4">
              Бюджет: <strong>{o.budget}</strong>
            </p>
            <Link href={`/orders/${o.id}`}>
              <Button>Подробнее</Button>
            </Link>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
