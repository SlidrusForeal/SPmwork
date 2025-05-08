import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Layout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(r => r.json())
                .then(data => setUser(data.user))
                .catch(() => localStorage.removeItem('token'));
        }
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        supabase.auth.signOut();
    };

    return (
        <div>
            <nav className="bg-gray-800 p-4 text-white">
                <Link href="/"><a className="mr-4">Главная</a></Link>
                <Link href="/orders"><a className="mr-4">Заказы</a></Link>
                {user ? (
                    <>
                        <span className="mr-4">Привет, {user.username}</span>
                        <button onClick={logout}>Выйти</button>
                    </>
                ) : (
                    <Link href="/login"><a>Войти</a></Link>
                )}
            </nav>
            <main className="container mx-auto p-4">{children}</main>
        </div>
    );
}
