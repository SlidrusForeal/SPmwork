import { DefaultSeoProps } from "next-seo";

const config: DefaultSeoProps = {
  defaultTitle: "SPmwork — Freelance-платформа Minecraft",
  titleTemplate: "%s | SPmwork",
  description:
    "Заказывай ресурсы, постройки и арты у проверенных мастеров с гарантией эскроу-платежа.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://spmwork.vercel.app",
    siteName: "SPmwork",
    title: "SPmwork — Freelance-платформа Minecraft",
    description:
      "Заказывай ресурсы, постройки и арты у проверенных мастеров с гарантией эскроу-платежа.",
    images: [
      {
        url: "https://spmwork.vercel.app/icon-512.png",
        width: 512,
        height: 512,
        alt: "SPmwork Logo",
        type: "image/png",
      },
    ],
  },
  twitter: {
    handle: "@SPmwork",
    site: "@SPmwork",
    cardType: "summary_large_image",
  },
  additionalLinkTags: [
    {
      rel: "icon",
      href: "/favicon.ico",
    },
    {
      rel: "apple-touch-icon",
      href: "/icon-192.png",
      sizes: "192x192",
    },
    {
      rel: "manifest",
      href: "/manifest.json",
    },
  ],
};

export default config;
