// components/ui/Currency.tsx
// Упрощённый компонент без хуков для SSR-совместимости
export function Currency({ amount }: { amount: number | string }) {
  return (
    <span
      className="inline-flex items-center"
      aria-label={`Сумма ${amount} AR`}
    >
      {amount}
      {/* для светлой темы */}
      <img
        src="/bleiyar.webp"
        alt="AR"
        className="w-6 h-6 inline dark:hidden ml-1"
        loading="lazy"
      />
      {/* для тёмной темы */}
      <img
        src="/chernyar.webp"
        alt="AR"
        className="w-6 h-6 hidden dark:inline ml-1"
        loading="lazy"
      />
    </span>
  );
}
