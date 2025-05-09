// pages/orders/[id].tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { Card, Button, Input } from "../../components/ui";
import { supabase } from "../../lib/supabaseClient";

export default function OrderDetail() {
  const router = useRouter();
  const { id } = router.query as { id?: string };

  const [offers, setOffers] = useState<any[] | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // для чата
  const [messages, setMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState("");

  // 1) Загрузка офферов
  useEffect(() => {
    if (!id) return;
    fetch(`/api/orders/${id}/offers`, { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) throw new Error(`Ошибка ${res.status}`);
        return res.json();
      })
      .then((data) => setOffers(data.offers))
      .catch((e: any) => setError(e.message));
  }, [id]);

  // 2) Принятие оффера
  const acceptOffer = async (offerId: string) => {
    try {
      const res = await fetch(`/api/orders/${id}/offers/${offerId}/accept`, {
        method: "POST",
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      setAccepted(true);
    } catch (e: any) {
      alert(e.message || "Не удалось принять оффер");
    }
  };

  // 3) Загрузка и подписка на чат после принятия
  useEffect(() => {
    if (!accepted || !id) return;

    // загрузить историю сообщений
    fetch(`/api/messages?orderId=${id}`, { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) throw new Error(`Ошибка ${res.status}`);
        return res.json();
      })
      .then((data) => setMessages(data.messages))
      .catch(console.error);

    // подписка на новые сообщения
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
  }, [accepted, id]);

  // 4) Отправка сообщения
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

  // 5) Рендер
  if (error) {
    return (
      <Layout>
        <p className="text-red-600">Ошибка: {error}</p>
      </Layout>
    );
  }
  if (offers === null) {
    return <Layout>Загрузка…</Layout>;
  }

  return (
    <Layout>
      {!accepted ? (
        <>
          <h1 className="text-2xl font-bold mb-6">Офферы по заказу {id}</h1>
          {offers.length === 0 ? (
            <p>Пока нет офферов.</p>
          ) : (
            <div className="space-y-4">
              {offers.map((o) => (
                <Card key={o.id} className="p-6">
                  <p>
                    <strong>Цена:</strong> {o.price}
                  </p>
                  <p>
                    <strong>Срок:</strong> {o.delivery_time} дн.
                  </p>
                  <p className="mt-2">{o.message}</p>
                  <Button
                    className="mt-4"
                    onClick={() => acceptOffer(o.id)}
                    aria-label={`Принять оффер ${o.id}`}
                  >
                    Принять оффер
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-6">Чат по заказу {id}</h1>
          <Card className="mb-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {messages.map((m) => (
                <div key={m.id} className="text-sm">
                  <strong className="text-neutral-700 dark:text-neutral-300">
                    {m.sender_id}
                  </strong>
                  : {m.content}
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                className="flex-grow"
                placeholder="Сообщение"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
              />
              <Button onClick={sendMessage}>Отправить</Button>
            </div>
          </Card>
        </>
      )}
    </Layout>
  );
}
