import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

export default function OrderDetail() {
    const router = useRouter();
    const { id } = router.query;
    const token = typeof window !== 'undefined' && localStorage.getItem('token');

    const [order, setOrder] = useState<any>(null);
    const [offers, setOffers] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [newOffer, setNewOffer] = useState({ price: 0, delivery_time: 1, message: '' });
    const [chatText, setChatText] = useState('');
    const [review, setReview] = useState({ rating: 5, comment: '' });

    useEffect(() => {
        if (!id) return;
        fetch(`/api/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => setOrder(d.order));
        fetch(`/api/orders/${id}/offers`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => setOffers(d.offers));
        fetch(`/api/messages?orderId=${id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => setMessages(d.messages));
    }, [id]);

    const postOffer = async () => {
        await fetch(`/api/orders/${id}/offers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(newOffer)
        });
        router.replace(router.asPath);
    };
    const sendMessage = async () => {
        await fetch(`/api/messages?orderId=${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ content: chatText })
        });
        setChatText('');
        const res = await fetch(`/api/messages?orderId=${id}`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await res.json();
        setMessages(d.messages);
    };
    const acceptOffer = async (offerId: string) => {
        await fetch(`/api/offers/${offerId}/accept`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });
        router.replace(router.asPath);
    };
    const submitReview = async () => {
        await fetch('/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ orderId: id, ...review })
        });
        router.replace(router.asPath);
    };

    if (!order) return <Layout>Загрузка...</Layout>;

    return (
        <Layout>
        <h1 className= "text-2xl font-bold mb-2" > { order.title } </h1>
        < p className = "mb-4" > { order.description } </p>
            < p className = "mb-6" > Бюджет: { order.budget } · Статус: { order.status } </p>

    {/* Офферы */ }
    <section className="mb-6" >
        <h2 className="text-xl mb-2" > Офферы </h2>
    {
        offers.map(o => (
            <div key= { o.id } className = "border p-4 mb-2" >
            <p>Цена: { o.price } · Срок: { o.delivery_time } д.</p>
        < p className = "mb-2" > { o.message } </p>
            {
                order.buyer_id === o.order_id && order.status === 'open' && (
                    <button
                onClick={() => acceptOffer(o.id)}
    className = "bg-green-600 text-white px-3 py-1 rounded"
        >
        Принять
        </button>
            )
}
</div>
        ))}
{
    order.status === 'open' && (
        <div className="mt-4 p-4 border" >
            <h3 className="mb-2" > Отправить свой оффер </h3>
                < input
    type = "number"
    placeholder = "Цена"
    value = { newOffer.price }
    onChange = { e => setNewOffer(v => ({ ...v, price: +e.target.value }))
}
className = "mb-2 p-2 border w-full"
    />
    <input
              type="number"
placeholder = "Срок (дни)"
value = { newOffer.delivery_time }
onChange = { e => setNewOffer(v => ({ ...v, delivery_time: +e.target.value }))}
className = "mb-2 p-2 border w-full"
    />
    <textarea
              placeholder="Сообщение"
value = { newOffer.message }
onChange = { e => setNewOffer(v => ({ ...v, message: e.target.value }))}
className = "mb-2 p-2 border w-full"
    />
    <button
              onClick={ postOffer }
className = "bg-blue-600 text-white px-4 py-2 rounded"
    >
    Отправить оффер
        </button>
        </div>
        )}
</section>

{/* Чат */ }
<section className="mb-6" >
    <h2 className="text-xl mb-2" > Чат </h2>
        < div className = "h-48 p-3 border overflow-y-auto mb-2" >
        {
            messages.map(m => (
                <div key= { m.id } >
                <strong>{ m.sender_id } </strong>: {m.content}
                </div>
            ))
        }
            </div>
            < div className = "flex" >
                <input
            value={ chatText }
onChange = { e => setChatText(e.target.value) }
className = "flex-1 p-2 border"
placeholder = "Сообщение"
    />
    <button
            onClick={ sendMessage }
className = "ml-2 bg-blue-600 text-white px-4 py-2 rounded"
    >
    Отправить
    </button>
    </div>
    </section>

{/* Отзыв */ }
{
    order.status === 'completed' && (
        <section>
        <h2 className="text-xl mb-2" > Оставить отзыв </h2>
            < select
    value = { review.rating }
    onChange = { e => setReview(v => ({ ...v, rating: +e.target.value }))
}
className = "mb-2 p-2 border"
    >
{
    [1, 2, 3, 4, 5].map(n => (
        <option key= { n } value = { n } >
        { n } звёзд
    </option>
    ))
}
    </select>
    < textarea
value = { review.comment }
onChange = { e => setReview(v => ({ ...v, comment: e.target.value }))}
className = "mb-2 p-2 border w-full"
placeholder = "Комментарий"
    />
    <button
            onClick={ submitReview }
className = "bg-green-600 text-white px-4 py-2 rounded"
    >
    Отправить отзыв
        </button>
        </section>
      )}
</Layout>
);
}
