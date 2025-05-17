// pages/admin/orders.tsx
import { GetServerSideProps } from "next";
import { useState } from "react";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
import Layout from "../../components/Layout";
import { OrderStatus } from "../../types";
import { canTransitionToStatus } from "../../lib/validation";

interface Order {
  id: string;
  title: string;
  status: OrderStatus;
  created_at: string;
}

export default function AdminOrders({
  initialOrders,
}: {
  initialOrders: Order[];
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [error, setError] = useState<string | null>(null);

  const changeStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const order = orders.find((o) => o.id === orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      if (!canTransitionToStatus(order.status, newStatus)) {
        throw new Error(
          `Cannot change status from ${order.status} to ${newStatus}`
        );
      }

      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update status");
      }

      setOrders(
        orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const getAvailableStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
    return ["open", "in_progress", "completed", "dispute"].filter((status) =>
      canTransitionToStatus(currentStatus, status as OrderStatus)
    ) as OrderStatus[];
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Споры по заказам</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
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
              <td>
                <span
                  className={`inline-block px-2 py-1 rounded ${
                    o.status === "dispute"
                      ? "bg-red-100 text-red-800"
                      : o.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : o.status === "in_progress"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {o.status}
                </span>
              </td>
              <td>{new Date(o.created_at).toLocaleString()}</td>
              <td>
                <select
                  value={o.status}
                  onChange={(e) =>
                    changeStatus(o.id, e.target.value as OrderStatus)
                  }
                  className="border p-1 rounded"
                  disabled={getAvailableStatuses(o.status).length === 0}
                >
                  <option value={o.status}>{o.status}</option>
                  {getAvailableStatuses(o.status).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
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
