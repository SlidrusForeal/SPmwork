// pages/_app.tsx
import type { AppProps } from 'next/app';
import '../styles/globals.css'; // если у вас есть собственные стили

export default function App({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />;
}
