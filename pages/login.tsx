// pages/login.tsx
import Layout from "../components/Layout";
import Link from "next/link";
import { Button } from "../components/ui";
import { LogIn } from "lucide-react";
import { useRouter } from "next/router";

export default function Login() {
  const router = useRouter();
  const returnTo = (router.query.returnTo as string) || "/orders";
  const loginUrl = `/api/auth/discord/login?returnTo=${encodeURIComponent(
    returnTo
  )}`;

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center">
          <LogIn size={48} className="mx-auto text-blue-600" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
            Вход через Discord
          </h1>
          <p className="mt-2 mb-6 text-gray-600 dark:text-gray-400">
            Используйте свою учётную запись Discord для доступа к админ‑панели и
            заказам
          </p>
          <Link href={loginUrl} className="w-full inline-block">
            <Button
              variant="primary"
              className="flex items-center justify-center w-full space-x-2"
              aria-label="Войти через Discord"
            >
              <LogIn size={20} />
              <span>Войти через Discord</span>
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
