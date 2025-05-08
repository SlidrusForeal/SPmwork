// pages/login.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";

export default function Login() {
  const [cardId, setCardId] = useState("");
  const [cardToken, setCardToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, cardToken }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Не удалось войти");
      } else {
        const { token } = await res.json();
        localStorage.setItem("token", token);
        router.push("/orders");
      }
    } catch (err) {
      console.error(err);
      setError("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h1 className="text-2xl mb-4">Вход через SPWorlds</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={submit} className="flex flex-col max-w-sm space-y-3">
        <input
          type="text"
          placeholder="SPWorlds Card ID"
          value={cardId}
          onChange={(e) => setCardId(e.target.value)}
          className="form-input"
          required
        />
        <input
          type="text"
          placeholder="SPWorlds Token"
          value={cardToken}
          onChange={(e) => setCardToken(e.target.value)}
          className="form-input"
          required
        />

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Загрузка…" : "Войти"}
        </button>
      </form>
    </Layout>
  );
}
