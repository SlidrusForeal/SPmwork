// pages/_document.tsx
import Document, { Html, Head, Main, NextScript } from "next/document";

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="ru">
        <Head>
          {/* Favicon для вкладки браузера */}
          <link rel="icon" href="/favicon.ico" />
          <link rel="shortcut icon" href="/favicon.ico" />
          {/* Поддержка Apple */}
          <link rel="apple-touch-icon" sizes="180x180" href="/favicon.ico" />
          {/* Метаданные */}
          <meta name="theme-color" content="#1e6edc" />
          {/* Скрипт до загрузки React, чтобы избежать «мигания» темы */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    const isDark = localStorage.getItem('theme') === 'dark';
                    document.documentElement.classList.toggle('dark', isDark);
                  } catch(e) {}
                })();
              `,
            }}
          />
          {/* Остальные теги, например шрифты */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin=""
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap"
            rel="stylesheet"
          />
        </Head>
        <body className="font-sans">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
