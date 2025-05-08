// pages/login.tsx
import Layout from "../components/Layout";

export default function Login() {
  return (
    <Layout>
      <h1 className="text-2xl mb-4">Вход через Discord</h1>
      <a href="/api/auth/discord/login" className="btn-primary">
        Войти через Discord
      </a>
    </Layout>
  );
}
