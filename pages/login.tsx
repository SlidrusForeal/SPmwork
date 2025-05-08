import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

export default function Login() {
    const [cardId, setCardId] = useState('');
    const [cardToken, setCardToken] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardId, cardToken })
        });
        if (res.ok) {
            const { token } = await res.json();
            localStorage.setItem('token', token);
            router.push('/orders');
        } else {
            const { error: msg } = await res.json();
            setError(msg);
        }
    };

    return (
        <Layout>
            <h1 className="text-2xl mb-4">Вход через SPWorlds</h1>
            {error && <p className="text-red-500">{error}</p>}
            <form onSubmit={submit} className="flex flex-col max-w-sm">
                <input
                    placeholder="SPWorlds Card ID"
                    value={cardId}
                    onChange={e => setCardId(e.target.value)}
                    className="mb-2 p-2 border"
                    required
                />
                <input
                    placeholder="SPWorlds Token"
                    value={cardToken}
                    onChange={e => setCardToken(e.target.value)}
                    className="mb-2 p-2 border"
                    required
                />
                <button type="submit" className="bg-blue-600 text-white p-2">
                    Войти
                </button>
            </form>
        </Layout>
    );
}
