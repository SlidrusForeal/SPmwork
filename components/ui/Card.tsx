// components/ui/Card.tsx
import React from "react";

export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        bg-white dark:bg-gray-800
        rounded-lg
        shadow-md
        p-6
        transition-transform duration-200
        hover:scale-105 hover:shadow-xl
        ${className}
      `}
    >
      {children}
    </div>
  );
}
