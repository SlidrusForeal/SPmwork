// pages/orders/create.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";

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
    const token = localStorage.getItem("token");
    await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });
    router.push("/orders");
  };

  return (
    <Layout>
      <h1 className="text-2xl mb-4">Создать заказ</h1>
      <form onSubmit={submit} className="flex flex-col max-w-lg">
        <input
          placeholder="Заголовок"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="form-input mb-2"
          required
        />
        <textarea
          placeholder="Описание"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="btn-primary"
        />
        <input
          placeholder="Категория"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="form-input mb-2"
        />
        <input
          type="number"
          placeholder="Бюджет"
          value={form.budget}
          onChange={(e) => setForm({ ...form, budget: +e.target.value })}
          className="form-input mb-2"
          required
        />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">
          Создать
        </button>
      </form>
    </Layout>
  );
}
