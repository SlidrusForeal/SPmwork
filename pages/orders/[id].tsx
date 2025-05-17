// pages/orders/[id].tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { Card, Button, Input } from "../../components/ui";
import { supabase } from "../../lib/supabaseClient";
import ReviewForm from "../../components/ReviewForm";
import ReviewList from "../../components/ReviewList";
import ReviewFilters from "../../components/ReviewFilters";
import RatingSummary from "../../components/RatingSummary";
import useSWR from "swr";
import { fetcher } from "../../lib/fetcher";
import { useUser } from "../../lib/useUser";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_id: string;
  reviewer: {
    username: string;
    minecraftUsername?: string;
    minecraftUuid?: string;
  };
}

interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    hasMore: boolean;
  };
}

export default function OrderDetail() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const { user } = useUser();

  const [order, setOrder] = useState<any | null>(null);
  const [offers, setOffers] = useState<any[] | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSort, setReviewSort] = useState<
    "latest" | "oldest" | "highest" | "lowest"
  >("latest");
  const [reviewMinRating, setReviewMinRating] = useState<number | null>(null);
  const [hasCommentOnly, setHasCommentOnly] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);

  // Fetch reviews with filters
  const { data: reviewsData } = useSWR<ReviewsResponse>(
    id
      ? `/api/reviews?orderId=${id}&sort=${reviewSort}&page=${reviewPage}${
          reviewMinRating ? `&minRating=${reviewMinRating}` : ""
        }${hasCommentOnly ? "&hasComment=true" : ""}`
      : null,
    fetcher
  );

  // для чата
  const [messages, setMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState("");

  // 1) Загрузка заказа и проверка статуса
  useEffect(() => {
    if (!id) return;

    // Fetch order details first
    fetch(`/api/orders/${id}`, { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) throw new Error(`Ошибка ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setOrder(data.order);
        // Set accepted state based on order status
        setAccepted(
          data.order.status === "in_progress" ||
            data.order.status === "completed"
        );
      })
      .catch((e: any) => setError(e.message));

    // Then fetch offers
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
      // Refresh order status
      const orderRes = await fetch(`/api/orders/${id}`, {
        credentials: "same-origin",
      });
      if (orderRes.ok) {
        const data = await orderRes.json();
        setOrder(data.order);
      }
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

  // Add this section before the return statement
  const canReview =
    order?.status === "completed" &&
    !reviewsData?.reviews?.some(
      (review) =>
        review.reviewer_id === order.buyer_id ||
        review.reviewer_id === order.seller_id
    );

  const isOrderParticipant =
    user &&
    (order?.buyer_id === user.id ||
      offers?.some(
        (offer) => offer.seller_id === user.id && offer.status === "accepted"
      ));

  // 5) Рендер
  if (error) {
    return (
      <Layout>
        <p className="text-red-600">Ошибка: {error}</p>
      </Layout>
    );
  }
  if (offers === null || order === null) {
    return <Layout>Загрузка…</Layout>;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {!accepted ? (
          <>
            <h1 className="text-2xl font-bold mb-6">
              {order.title}
              <span className="text-gray-500 text-base ml-2">
                #{id?.slice(0, 8)}
              </span>
            </h1>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">{order.title}</h2>
              <p className="text-gray-600">{order.description}</p>
              <p className="mt-2">
                <strong>Бюджет:</strong> {order.budget}
              </p>
              {order.category && (
                <p>
                  <strong>Категория:</strong> {order.category}
                </p>
              )}
            </div>
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
                    {order.status === "open" && order.buyer_id === user?.id && (
                      <Button
                        className="mt-4"
                        onClick={() => acceptOffer(o.id)}
                        aria-label={`Принять оффер ${o.id}`}
                      >
                        Принять оффер
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-6">
              {order.title}
              <span className="text-gray-500 text-base ml-2">
                #{id?.slice(0, 8)}
              </span>
            </h1>
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

        {/* Reviews section */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Отзывы</h2>

          {canReview && isOrderParticipant && !showReviewForm && (
            <div className="mb-6">
              <Button onClick={() => setShowReviewForm(true)}>
                {order.buyer_id === user?.id
                  ? "Оставить отзыв об исполнителе"
                  : "Оставить отзыв о заказчике"}
              </Button>
            </div>
          )}

          {showReviewForm && (
            <div className="mb-6">
              <ReviewForm
                orderId={id!}
                targetUserId={
                  order.buyer_id === user?.id
                    ? offers.find((o) => o.status === "accepted")?.seller_id!
                    : order.buyer_id
                }
                onSubmit={() => {
                  setShowReviewForm(false);
                  router.reload();
                }}
                onCancel={() => setShowReviewForm(false)}
              />
            </div>
          )}

          {reviewsData?.reviews && reviewsData.reviews.length > 0 && (
            <>
              <RatingSummary reviews={reviewsData.reviews} className="mb-6" />

              <ReviewFilters
                sort={reviewSort}
                onSortChange={setReviewSort}
                minRating={reviewMinRating}
                onMinRatingChange={setReviewMinRating}
                hasCommentOnly={hasCommentOnly}
                onHasCommentChange={setHasCommentOnly}
                className="mb-6"
              />
            </>
          )}

          <ReviewList reviews={reviewsData?.reviews || []} className="mt-4" />

          {reviewsData?.pagination && reviewsData.pagination.hasMore && (
            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => setReviewPage((p) => p + 1)}
              >
                Загрузить ещё
              </Button>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
