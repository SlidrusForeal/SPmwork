// pages/cancel.tsx
import { useRouter } from "next/router";
import Layout from "../components/Layout";

export default function Cancel() {
  const router = useRouter();
  const { order } = router.query as { order?: string };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4 text-red-600">Платёж отменён</h1>
      <p>
        Вы отменили оплату заказа <strong>{order}</strong>.
      </p>
      <button
        className="btn-primary"
        onClick={() => router.push(`/orders/${order}`)}
      >
        Вернуться к заказу
      </button>
    </Layout>
  );
}
