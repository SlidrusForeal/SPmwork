// pages/orders/index.tsx
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import type { GetServerSideProps } from 'next';
import Layout from '../../../components/Layout';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

type Order = { id: string; title: string; budget: number; status: string };
export default function OrdersPage({ orders }: { orders: Order[] }) {
  return (
    <Layout>
      <h1 className="text-2xl mb-4">Заказы</h1>
      {/* … здесь список */}
      {orders.map(o => (
        <div key={o.id} className="p-4 border mb-4">
          <a href={`/orders/${o.id}`} className="text-xl font-semibold">
            {o.title}
          </a>
          <p>Бюджет: {o.budget} · Статус: {o.status}</p>
        </div>
      ))}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.token;
  try {
    const { id } = jwt.verify(token || '', process.env.JWT_SECRET!) as any;
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .or(`status.eq.open,buyer_id.eq.${id}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { props: { orders } };
  } catch {
    return {
      redirect: { destination: '/login', permanent: false }
    };
  }
};
