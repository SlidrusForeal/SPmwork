// pages/admin/index.tsx
import { GetServerSideProps } from "next";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
import Layout from "../../components/Layout";
import Link from "next/link";

export default function AdminHome() {
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Админ-панель</h1>
      <ul className="list-disc ml-6 space-y-2">
        <li>
          <Link href="/admin/users">Управление пользователями</Link>
        </li>
        <li>
          <Link href="/admin/orders">Споры по заказам</Link>
        </li>
      </ul>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookies = parse(req.headers.cookie || "");
  try {
    const user = jwt.verify(
      cookies.token || "",
      process.env.JWT_SECRET!
    ) as any;
    if (!["moderator", "admin"].includes(user.role)) throw new Error();
    return { props: {} };
  } catch {
    return {
      redirect: {
        destination: `/login?returnTo=${encodeURIComponent("/admin")}`,
        permanent: false,
      },
    };
  }
};
