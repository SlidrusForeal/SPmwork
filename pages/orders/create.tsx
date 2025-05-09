// pages/orders/create.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { Input, Textarea, Button } from "../../components/ui";

export default function CreateOrder() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    budget: 0,
  });
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Отправляем запрос с аутентификацией через cookie (same-origin)
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error("Ошибка создания заказа:", error);
      // Здесь можно отобразить сообщение об ошибке пользователю
      return;
    }

    router.push("/orders");
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Создать заказ</h1>
      <form onSubmit={submit} className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium mb-1">Заголовок</label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Описание</label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Категория</label>
          <Input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Бюджет</label>
          <Input
            type="number"
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: +e.target.value })}
            required
          />
        </div>

        <Button type="submit">Создать</Button>
      </form>
    </Layout>
  );
}
