// pages/admin/index.tsx
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import AdminPanel from "../../components/AdminPanel";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { useUser } from "../../lib/useUser";

interface AdminPageProps {
  users: any[];
  orders: any[];
  reports: any[];
}

export default function AdminPage({ users, orders, reports }: AdminPageProps) {
  const router = useRouter();
  const { user, loading } = useUser();

  // Проверяем права доступа
  if (!loading && (!user || !user.is_admin)) {
    router.push("/");
    return null;
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <AdminPanel users={users} orders={orders} reports={reports} />
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  // Проверяем авторизацию на сервере
  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(req.cookies["sb-access-token"]);
  if (!user) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  // Проверяем права администратора
  const { data: userData } = await supabaseAdmin
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!userData?.is_admin) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  // Загружаем данные для админ панели
  const [{ data: users }, { data: orders }, { data: reports }] =
    await Promise.all([
      supabaseAdmin
        .from("users")
        .select("*")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("orders")
        .select(
          `
        *,
        buyer:users!orders_buyer_id_fkey (
          username,
          minecraft_username
        ),
        seller:offers!inner (
          user:users (
            username,
            minecraft_username
          )
        )
      `
        )
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("reports")
        .select(
          `
        *,
        reporter:users!reports_reporter_id_fkey (
          username,
          minecraft_username
        ),
        reported:users!reports_reported_id_fkey (
          username,
          minecraft_username
        )
      `
        )
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

  return {
    props: {
      users: users || [],
      orders: orders || [],
      reports: reports || [],
    },
  };
};
