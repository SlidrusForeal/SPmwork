// pages/login.tsx
import Link from "next/link";
import Layout from "../components/Layout";

export default function Login() {
  return (
    <Layout>
      <h1 className="text-2xl mb-6">Вход через Discord</h1>
      <Link href="/api/auth/discord/login">
        <button className="btn-primary">Войти через Discord</button>
      </Link>
    </Layout>
  );
}
