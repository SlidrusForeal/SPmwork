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
@endsection
