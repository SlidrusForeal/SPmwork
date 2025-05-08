// components/PayButton.tsx
import { useState } from 'react';

export default function PayButton({
    orderId,
    amount
}: {
    orderId: string;
    amount: number;
}) {
    const [loading, setLoading] = useState(false);

    const handlePay = async () => {
        setLoading(true);
        const res = await fetch('/api/init-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, amount })
        });
        const { url } = await res.json();
        window.location.href = url;
    };

    return (
        <button
            onClick={handlePay}
            disabled={loading}
            className="btn-primary"
        >
            {loading ? 'Загрузка…' : `Оплатить ${amount} AR`}
        </button>
    );
}
