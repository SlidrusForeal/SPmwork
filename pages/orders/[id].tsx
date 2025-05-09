// pages/orders/[id].tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { Card, Button } from "../../components/ui";

export default function OrderOffersPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };

  const [offers, setOffers] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Загрузка офферов по API
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

  // Принятие оффера
  const acceptOffer = async (offerId: string) => {
    try {
      const res = await fetch(`/api/orders/${id}/offers/${offerId}/accept`, {
        method: "POST",
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      // После принятия удаляем оффер из списка
      setOffers((prev) => prev?.filter((o) => o.id !== offerId) ?? null);
    } catch (e: any) {
      alert(e.message || "Не удалось принять оффер");
    }
  };

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
                <strong>Срок:</strong> {o.delivery_time} дн.
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
    </Layout>
  );
}
