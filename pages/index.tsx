// pages/index.tsx
import type { NextPage } from 'next';
import Head from 'next/head';
import PayButton from '../components/PayButton';

const Home: NextPage = () => (
    <div className="min-h-screen bg-gray-50">
        <Head>
            <title>SPmwork</title>
            <meta name="description" content="Freelance-платформа для Minecraft-заказов" />
        </Head>

        <header className="bg-white shadow">
            <div className="container mx-auto px-4 py-6">
                <h1 className="text-3xl font-bold">Добро пожаловать на SPmwork</h1>
            </div>
        </header>

        <main className="container mx-auto px-4 py-6">
            <p className="mb-4">Платформа фриланс-заказов по типу Kwork для Minecraft.</p>
            {/* Пример кнопки оплаты */}
            <PayButton orderId="sample123" amount={100} />
        </main>
    </div>
);

export default Home;
