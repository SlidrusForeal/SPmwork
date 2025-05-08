// pages/success.tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";

export default function Success() {
  const router = useRouter();
  const { order } = router.query as { order?: string };
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [order]);

  if (loading) return <Layout>Загрузка…</Layout>;

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Платёж успешно проведён</h1>
      <p>
        Заказ <strong>{order}</strong> помечен как «в процессе выполнения».
      </p>
      <button
        className="btn-primary"
        onClick={() => router.push(`/orders/${order}`)}
      >
        Перейти к заказу
      </button>
    </Layout>
  );
}
