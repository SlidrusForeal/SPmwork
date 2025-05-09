// pages/orders/[id].tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { Card, Button, Input, Textarea } from "../../components/ui";
import { supabase } from "../../lib/supabaseClient";

export default function OrderDetail({ initialOrder }: { initialOrder: any }) {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const token = typeof window !== "undefined" && localStorage.getItem("token");

  // 1) Используем предзагруженный initialOrder
  const [order, setOrder] = useState<any>(initialOrder);
  const [offers, setOffers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newOffer, setNewOffer] = useState({
    price: 0,
    delivery_time: 1,
    message: "",
  });
  const [chatText, setChatText] = useState("");
  const [review, setReview] = useState({ rating: 5, comment: "" });

  useEffect(() => {
    if (!id) return;
    Promise.all([
      // order уже есть, можно убрать второй fetch
      fetch(`/api/orders/${id}/offers`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`/api/messages?orderId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ]).then(([of, m]) => {
      setOffers(of.offers);
      setMessages(m.messages);
    });

    const channel = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `order_id=eq.${id}`,
        },
        (payload) => setMessages((prev) => [...prev, payload.new])
      )
      .subscribe();

    return () => void supabase.removeChannel(channel);
  }, [id]);

  if (!order) return <Layout>Загрузка…</Layout>;

  return (
    <Layout>
      <Card className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{order.title}</h1>
        <p className="mb-4">{order.description}</p>
        <p>
          Бюджет: <strong>{order.budget}</strong> · Статус: {order.status}
        </p>
      </Card>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Офферы</h2>
        <div className="space-y-4">
          {offers.map((o) => (
            <Card key={o.id} className="flex justify-between items-center">
              <div>
                <p className="mb-1">
                  Цена: <strong>{o.price}</strong> · Срок:{" "}
                  <strong>{o.delivery_time} д.</strong>
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {o.message}
                </p>
              </div>
              {order.buyer_id === o.order_id && order.status === "open" && (
                <Button
                  onClick={async () => {
                    await fetch(`/api/orders/${id}/offers/${o.id}/accept`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    router.replace(router.asPath);
                  }}
                >
                  Принять
                </Button>
              )}
            </Card>
          ))}
        </div>

        {order.status === "open" && (
          <Card className="mt-6">
            <h3 className="font-semibold mb-3">Ваш оффер</h3>
            <div className="space-y-3">
              <Input
                type="number"
                placeholder="Цена"
                value={newOffer.price}
                onChange={(e) =>
                  setNewOffer((v) => ({ ...v, price: +e.target.value }))
                }
              />
              <Input
                type="number"
                placeholder="Срок (дни)"
                value={newOffer.delivery_time}
                onChange={(e) =>
                  setNewOffer((v) => ({ ...v, delivery_time: +e.target.value }))
                }
              />
              <Textarea
                placeholder="Сообщение"
                value={newOffer.message}
                onChange={(e) =>
                  setNewOffer((v) => ({ ...v, message: e.target.value }))
                }
              />
              <Button
                onClick={async () => {
                  await fetch(`/api/orders/${id}/offers`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(newOffer),
                  });
                  router.replace(router.asPath);
                }}
              >
                Отправить оффер
              </Button>
            </div>
          </Card>
        )}
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Чат</h2>
        <Card className="mb-4">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {messages.map((m) => (
              <div key={m.id} className="text-sm">
                <strong className="text-neutral-700 dark:text-neutral-300">
                  {m.sender_id}
                </strong>
                : {m.content}
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            <Input
              placeholder="Сообщение"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
            />
            <Button
              onClick={async () => {
                if (!chatText.trim()) return;
                await fetch(`/api/messages?orderId=${id}`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ content: chatText }),
                });
                setChatText("");
              }}
            >
              Отправить
            </Button>
          </div>
        </Card>
      </section>

      {order.status === "completed" && (
        <Card>
          <h2 className="text-xl font-semibold mb-3">Оставить отзыв</h2>
          <div className="space-y-3">
            <select
              value={review.rating}
              onChange={(e) =>
                setReview((v) => ({ ...v, rating: +e.target.value }))
              }
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} звёзд
                </option>
              ))}
            </select>
            <Textarea
              placeholder="Комментарий"
              value={review.comment}
              onChange={(e) =>
                setReview((v) => ({ ...v, comment: e.target.value }))
              }
            />
            <Button
              onClick={async () => {
                await fetch("/api/reviews", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ orderId: id, ...review }),
                });
                router.replace(router.asPath);
              }}
            >
              Отправить отзыв
            </Button>
          </div>
        </Card>
      )}
    </Layout>
  );
}

// SSR-защита и предзагрузка initialOrder
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import type { GetServerSideProps } from "next";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

export const getServerSideProps: GetServerSideProps = async ({
  req,
  params,
}) => {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.token || "";
  const orderId = params?.id as string;

  try {
    jwt.verify(token, process.env.JWT_SECRET!);

    const { data: initialOrder, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !initialOrder) throw error || new Error("Order not found");
    return { props: { initialOrder } };
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }
};
