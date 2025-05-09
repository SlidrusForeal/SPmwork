// pages/_error.tsx
import NextErrorComponent from "next/error";
import Link from "next/link";
import Layout from "../components/Layout";

interface ErrorProps {
  statusCode: number;
}

export default function ErrorPage({ statusCode }: ErrorProps) {
  return (
    <Layout>
      <div className="h-screen flex flex-col items-center justify-center">
        <h1 className="text-6xl font-bold text-red-600">{statusCode}</h1>
        <p className="text-2xl mt-4">
          {statusCode === 404 ? "Страница не найдена" : "Ошибка сервера"}
        </p>
        <Link href="/">
          <a className="mt-6 btn-primary">На главную</a>
        </Link>
      </div>
    </Layout>
  );
}

ErrorPage.getInitialProps = async (context: any) => {
  const errorInitialProps = await NextErrorComponent.getInitialProps(context);
  return { statusCode: errorInitialProps.statusCode };
};
