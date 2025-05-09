// pages/admin/orders.tsx
import { GetServerSideProps } from "next";
import { useState } from "react";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
import Layout from "../../../components/Layout";

interface Order {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

export default function AdminOrders({
  initialOrders,
}: {
  initialOrders: Order[];
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  const changeStatus = async (orderId: string, status: string) => {
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Споры по заказам</h1>
      <table className="w-full table-auto">
        <thead>
          <tr>
            <th>Заголовок</th>
            <th>Статус</th>
            <th>Дата</th>
            <th>Действие</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.title}</td>
              <td>{o.status}</td>
              <td>{new Date(o.created_at).toLocaleString()}</td>
              <td>
                <select
                  value={o.status}
                  onChange={(e) => changeStatus(o.id, e.target.value)}
                  className="border p-1"
                >
                  <option value="open">open</option>
                  <option value="in_progress">in_progress</option>
                  <option value="completed">completed</option>
                  <option value="dispute">dispute</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookies = parse(req.headers.cookie || "");
  try {
    const user = jwt.verify(
      cookies.token || "",
      process.env.JWT_SECRET!
    ) as any;
    if (!["moderator", "admin"].includes(user.role)) throw new Error();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/orders`,
      {
        headers: { Cookie: `token=${cookies.token}` },
      }
    );
    const { orders } = await res.json();
    return { props: { initialOrders: orders } };
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }
};
