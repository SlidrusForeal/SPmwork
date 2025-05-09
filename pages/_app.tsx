// pages/_app.tsx
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // Регистрируем sw.js только если он доступен
    if ("serviceWorker" in navigator) {
      fetch("/sw.js", { method: "HEAD" })
        .then((res) => {
          if (res.ok) {
            navigator.serviceWorker
              .register("/sw.js")
              .catch(() => console.warn("SW registration failed"));
          }
        })
        .catch(() => {});
    }
    // Запрос уведомлений, только если ранее не запрашивали
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((perm) => {
        console.log("Notification permission:", perm);
      });
    }
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={router.asPath}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <Component {...pageProps} />
      </motion.div>
    </AnimatePresence>
  );
}
