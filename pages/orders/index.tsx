import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Link from 'next/link';

export default function OrdersList() {
    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch('/api/orders', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => setOrders(data.orders));
    }, []);

    return (
        <Layout>
            <h1 className="text-2xl mb-4">Заказы</h1>
            <Link href="/orders/create">
                <a className="inline-block mb-6 bg-green-600 text-white px-4 py-2 rounded">
                    Новый заказ
                </a>
            </Link>
            {orders.map(o => (
                <div key={o.id} className="p-4 border mb-4">
                    <Link href={`/orders/${o.id}`}>
                        <a className="text-xl font-semibold">{o.title}</a>
                    </Link>
                    <p>Бюджет: {o.budget} · Статус: {o.status}</p>
                </div>
            ))}
        </Layout>
    );
}
