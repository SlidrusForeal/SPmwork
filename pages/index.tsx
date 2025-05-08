// pages/index.tsx
import type { NextPage } from 'next';
import Head from 'next/head';
import Layout from '../components/Layout';
import PayButton from '../components/PayButton';

const Home: NextPage = () => (
    <Layout>
        <Head>
            <title>SPmwork</title>
            <meta name="description" content="Freelance-платформа для сервера #СПм." />
        </Head>
        <h1 className="text-3xl font-bold mb-4">Добро пожаловать на SPmwork</h1>
        <p className="mb-6">Платформа фриланс-заказов для сервера #СПм.</p>
        <PayButton orderId="sample123" amount={100} />
    </Layout>
);

export default Home;
