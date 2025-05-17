"use client";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";
import { useEffect } from "react";
import ErrorBoundary from "../components/ErrorBoundary";
import { DefaultSeo } from "next-seo";
import SEO from "../next-seo.config";

// Новые импорты для сбора метрик
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
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
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((perm) => {
        console.log("Notification permission:", perm);
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <DefaultSeo {...SEO} />
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

      {/* Vercel Analytics и Speed Insights */}
      <Analytics />
      <SpeedInsights />
    </ErrorBoundary>
  );
}
