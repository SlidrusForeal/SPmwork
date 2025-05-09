// pages/orders/index.tsx
import { useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import Filters, { FiltersType } from "../../components/Filters";
import { Card, Button } from "../../components/ui";
import { fetcher } from "../../lib/fetcher";

interface Order {
  id: string;
  title: string;
  budget: number;
  status: string;
  created_at: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<FiltersType>({});

  const swrKey = ["/api/orders", filters] as [string, FiltersType];
  const { data, error, isValidating } = useSWR(
    () => swrKey,
    ([url, f]: [string, FiltersType]) => {
      const params = new URLSearchParams();
      Object.entries(f).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, String(value));
        }
      });
      return fetcher(`${url}?${params.toString()}`);
    }
  );

  const orders: Order[] = data?.orders ?? [];

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Заказы</h1>
        <Button onClick={() => router.push("/orders/create")}>
          Создать заказ
        </Button>
      </div>

      <Filters onChange={setFilters} />

      {isValidating ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-40">
              <div className="animate-pulse h-full bg-gray-200 dark:bg-gray-700" />
            </Card>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <p>Ничего не найдено</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {orders.map((o) => (
            <Card key={o.id} className="h-full flex flex-col justify-between">
              <h2
                className="text-xl font-semibold mb-2 cursor-pointer"
                onClick={() => router.push(`/orders/${o.id}`)}
              >
                {o.title}
              </h2>
              <p className="mb-4">
                Бюджет: <strong>{o.budget}</strong>
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                Статус: {o.status}
              </p>
              <Button onClick={() => router.push(`/orders/${o.id}`)}>
                Подробнее
              </Button>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
