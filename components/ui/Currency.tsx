// components/ui/Currency.tsx
import Image from "next/image";
import { useState, useEffect } from "react";

export function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const update = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

export function Currency({ amount }: { amount: number | string }) {
  const isDark = useIsDark();
  const src = isDark ? "/chernyar.webp" : "/bleiyar.webp";
  return (
    <span
      className="inline-flex items-center"
      aria-label={`Сумма ${amount} AR`}
    >
      {amount}&nbsp;
      <Image
        src={src}
        alt="AR"
        width={20}
        height={20}
        loading="lazy"
        priority={false}
      />
    </span>
  );
}
