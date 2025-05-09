// components/ui/Currency.tsx
"use client";
import React from "react";

/**
 * SSR‑совместимый компонент валюты с CSS-only переключением иконок.
 */
export function Currency({ amount }: { amount: number | string }) {
  return (
    <span
      className="inline-flex items-center"
      aria-label={`Сумма ${amount} AR`}
    >
      {amount}
      {/* Светлая тема */}
      <img
        src="/bleiyar.webp"
        alt="AR"
        className="w-6 h-6 inline dark:hidden ml-1"
        loading="lazy"
      />
      {/* Тёмная тема */}
      <img
        src="/chernyar.webp"
        alt="AR"
        className="w-6 h-6 hidden dark:inline ml-1"
        loading="lazy"
      />
    </span>
  );
}
