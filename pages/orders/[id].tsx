// pages/orders/[id].tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { Card, Button, Input, Textarea } from "../../components/ui";
import { supabase } from "../../lib/supabaseClient";

export default function OrderDetail({ initialOrder }: { initialOrder: any }) {
  const router = useRouter();
  const { id } = router.query as { id?: string };

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        const [ofRes, msgRes] = await Promise.all([
          fetch(`/api/orders/${id}/offers`, { credentials: "same-origin" }),
          fetch(`/api/messages?orderId=${id}`, { credentials: "same-origin" }),
        ]);
        if (!ofRes.ok)
          throw new Error(`Ошибка ${ofRes.status} при загрузке офферов`);
        if (!msgRes.ok)
          throw new Error(`Ошибка ${msgRes.status} при загрузке сообщений`);
        const of = await ofRes.json();
        const m = await msgRes.json();
        setOffers(of.offers);
        setMessages(m.messages);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Ошибка при загрузке данных");
      }
    };
    loadData();

    const channel = supabase
      .channel(`public:messages`)
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

  const sendOffer = async () => {
    try {
      const res = await fetch(`/api/orders/${id}/offers`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOffer),
      });
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      setNewOffer({ price: 0, delivery_time: 1, message: "" });
      router.replace(router.asPath);
    } catch (e: any) {
      alert(e.message || "Не удалось отправить оффер");
    }
  };

  const sendMessage = async () => {
    if (!chatText.trim()) return;
    try {
      const res = await fetch(`/api/messages?orderId=${id}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: chatText }),
      });
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      setChatText("");
    } catch (e: any) {
      alert(e.message || "Не удалось отправить сообщение");
    }
  };

  const acceptOffer = async (offerId: string) => {
    try {
      const res = await fetch(`/api/orders/${id}/offers/${offerId}/accept`, {
        method: "POST",
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      router.replace(router.asPath);
    } catch (e: any) {
      alert(e.message || "Не удалось принять оффер");
    }
  };

  const submitReview = async () => {
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: id,
          rating: review.rating,
          comment: review.comment,
        }),
      });
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      router.replace(router.asPath);
    } catch (e: any) {
      alert(e.message || "Не удалось отправить отзыв");
    }
  };

  if (error)
    return (
      <Layout>
        <p className="text-red-600">{error}</p>
      </Layout>
    );
  if (!order) return <Layout>Загрузка…</Layout>;

  return (
    <Layout>
      {/* Заказ */}
      <Card className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{order.title}</h1>
        <p className="mb-4">{order.description}</p>
        <p>
          Бюджет: <strong>{order.budget}</strong> · Статус: {order.status}
        </p>
      </Card>

      {/* Офферы */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Офферы</h2>
        {offers.map((o) => (
          <Card key={o.id} className="flex justify-between items-center mb-3">
            <div>
              <p>
                Цена: <strong>{o.price}</strong> · Срок:{" "}
                <strong>{o.delivery_time} дн.</strong>
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {o.message}
              </p>
            </div>
            {order.buyer_id === o.order_id && order.status === "open" && (
              <Button onClick={() => acceptOffer(o.id)}>Принять</Button>
            )}
          </Card>
        ))}
        {order.status === "open" && (
          <Card className="mt-4">
            <h3 className="font-semibold mb-3">Ваш оффер</h3>
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
            <Button className="mt-2" onClick={sendOffer}>
              Отправить оффер
            </Button>
          </Card>
        )}
      </section>

      {/* Чат */}
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
          <Input
            placeholder="Сообщение"
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
          />
          <Button className="mt-2" onClick={sendMessage}>
            Отправить
          </Button>
        </Card>
      </section>

      {/* Отзыв */}
      {order.status === "completed" && (
        <Card>
          <h2 className="text-xl font-semibold mb-3">Оставить отзыв</h2>
          <select
            value={review.rating}
            onChange={(e) =>
              setReview((v) => ({ ...v, rating: +e.target.value }))
            }
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary mb-2"
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
          <Button className="mt-2" onClick={submitReview}>
            Отправить отзыв
          </Button>
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
