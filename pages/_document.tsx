// pages/_document.tsx
import Document, { Html, Head, Main, NextScript } from "next/document";

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="ru">
        <Head>
          {/* Favicon */}
          <link rel="icon" href="/favicon.ico" />

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
