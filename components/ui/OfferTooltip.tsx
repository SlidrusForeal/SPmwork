// components/ui/OfferTooltip.tsx
import React, { ReactNode, useState } from "react";
import { useFloating, offset, shift, Placement } from "@floating-ui/react";

interface Offer {
  price: number;
  delivery_time: number;
  message: string;
}

interface OfferTooltipProps {
  offer: Offer;
  children: ReactNode;
}

export default function OfferTooltip({ offer, children }: OfferTooltipProps) {
  const [open, setOpen] = useState(false);
  const { x, y, strategy, refs, floatingStyles } = useFloating({
    placement: "top" as Placement,
    middleware: [offset(8), shift()],
  });

  return (
    <>
      <div
        ref={refs.setReference}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {children}
      </div>
      {open && (
        <div
          ref={refs.setFloating}
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
            ...floatingStyles,
          }}
          className="bg-white dark:bg-gray-800 p-3 rounded shadow-lg text-sm max-w-xs"
        >
          <p>
            Цена: <strong>{offer.price}</strong>
          </p>
          <p>
            Срок: <strong>{offer.delivery_time} дн.</strong>
          </p>
          <p>Сообщение: {offer.message.slice(0, 50)}…</p>
        </div>
      )}
    </>
  );
}
