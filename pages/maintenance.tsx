// pages/maintenance.tsx
import Link from "next/link";
import Layout from "../components/Layout";

export default function Maintenance() {
  return (
    <Layout>
      <div className="h-screen flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Технические работы</h1>
        <p className="mb-6 text-center">
          Извините за неудобства — мы сейчас проводим техническое обслуживание.
          Скоро всё заработает!
        </p>
        <Link href="/" className="btn-primary">
          Вернуться на главную
        </Link>
      </div>
    </Layout>
  );
}
