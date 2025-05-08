// pages/orders/index.tsx
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';

export default function OrdersList() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setOrders(data.orders))
        .catch(console.error);
    }
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl mb-4">Заказы</h1>
      <Link
        href="/orders/create"
        className="inline-block mb-6 bg-green-600 text-white px-4 py-2 rounded"
      >
        Новый заказ
      </Link>
      {orders.map(o => (
        <div key={o.id} className="p-4 border mb-4">
          <Link href={`/orders/${o.id}`} className="text-xl font-semibold">
            {o.title}
          </Link>
          <p>Бюджет: {o.budget} · Статус: {o.status}</p>
        </div>
      ))}
    </Layout>
  );
}
