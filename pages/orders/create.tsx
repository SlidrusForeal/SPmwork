// pages/orders/create.tsx
import Head from "next/head";
import Layout from "../../components/Layout";
import { OrderForm } from "../../components/OrderForm";

export default function CreateOrderPage() {
  return (
    <Layout>
      <Head>
        <title>Создать заказ — SPmwork</title>
        <meta name="description" content="Создайте новый заказ на SPmwork" />
      </Head>

      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Создать заказ</h1>
        <OrderForm />
      </div>
    </Layout>
  );
}
