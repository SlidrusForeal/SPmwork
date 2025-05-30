// pages/orders/index.tsx
import React, { useRef, useCallback, useState, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import { useRouter } from "next/router";
import Skeleton from "react-loading-skeleton";
import Layout from "../../components/Layout";
import Filters, { FiltersType } from "../../components/Filters";
import { Card, Button } from "../../components/ui";
import { fetcher } from "../../lib/fetcher";
import { Currency } from "../../components/ui/Currency";
import Head from "next/head";

const PAGE_SIZE = 10;
const getKey = (pageIndex: number, prev: any, filters: FiltersType) => {
  if (prev && prev.orders && prev.orders.length === 0) return null;
  if (
    prev &&
    prev.total !== undefined &&
    pageIndex * PAGE_SIZE >= prev.total &&
    pageIndex > 0
  )
    return null;

  const params = new URLSearchParams();
  params.append("page", (pageIndex + 1).toString());
  params.append("limit", PAGE_SIZE.toString());
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      params.append(k, String(v));
    }
  });
  return `/api/orders?${params.toString()}`;
};

export default function OrdersPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<FiltersType>({});

  // 1) Основной хук SWR
  const { data, size, setSize, isValidating } = useSWRInfinite(
    (i, prev) => getKey(i, prev, filters),
    fetcher
  );

  // 2) Производные состояния
  const orders = data ? data.flatMap((page) => page.orders) : [];
  const isLoadingInitialData = !data && isValidating;
  const isLoadingMore = isLoadingInitialData ? false : isValidating;

  const totalOrders = data?.[0]?.total ?? 0;
  const isReachingEnd = useMemo(() => {
    if (!data || data.length === 0) return false;
    const lastPage = data[data.length - 1];
    if (!lastPage || !lastPage.orders) return false;
    const loadedCount = data.reduce(
      (acc, page) => acc + (page.orders?.length || 0),
      0
    );
    return loadedCount >= totalOrders;
  }, [data, totalOrders]);

  // 3) Инфинит‑скролл
  const observer = useRef<IntersectionObserver>();
  const lastRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isValidating) return;
      observer.current?.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isReachingEnd) {
          setSize(size + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [isValidating, isReachingEnd, size, setSize]
  );

  // 4) Skeleton‑заглушка
  if (isLoadingInitialData) {
    return (
      <Layout>
        <Head>
          <title>Заказы — SPmwork</title>
          <meta
            name="description"
            content="Просмотр всех активных заказов на SPmwork"
          />
        </Head>
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton height={24} width="60%" style={{ marginBottom: 12 }} />
              <Skeleton height={18} width="40%" style={{ marginBottom: 16 }} />
              <Skeleton height={36} />
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Заказы — SPmwork</title>
        <meta
          name="description"
          content="Просмотр всех активных заказов на SPmwork"
        />
      </Head>
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Заказы</h1>
        <Button
          onClick={() => router.push("/orders/create")}
          aria-label="Создать заказ"
        >
          Создать заказ
        </Button>
      </header>

      <Filters onChange={setFilters} />

      {orders.length === 0 ? (
        <p>Ничего не найдено</p>
      ) : (
        <section
          className="grid gap-6"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          {orders.map((order, idx) => {
            const card = (
              <Card className="p-6">
                <h2
                  className="text-xl font-semibold mb-2 cursor-pointer"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  {order.title}
                </h2>
                <p className="mb-4">
                  Бюджет: <Currency amount={order.budget} />
                </p>
                <Button
                  onClick={() => router.push(`/orders/${order.id}`)}
                  aria-label={`Подробнее по заказу ${order.id}`}
                >
                  Подробнее
                </Button>
              </Card>
            );
            return idx === orders.length - 1 ? (
              <div key={order.id} ref={lastRef}>
                {card}
              </div>
            ) : (
              <div key={order.id}>{card}</div>
            );
          })}
        </section>
      )}

      {isLoadingMore && (
        <p className="text-center mt-6">Загрузка дополнительных заказов...</p>
      )}

      {!isLoadingMore &&
        !isLoadingInitialData &&
        orders.length > 0 &&
        isReachingEnd && (
          <p className="text-center mt-6 text-gray-500">
            Все заказы загружены.
          </p>
        )}

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary-dark transition-colors"
        aria-label="Наверх"
      >
        ↑
      </button>
    </Layout>
  );
}
