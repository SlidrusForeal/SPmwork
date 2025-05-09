// components/ui/Button.tsx
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  "aria-label"?: string;
}

export default function Button({
  variant = "primary",
  className = "",
  "aria-label": ariaLabel,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-none px-4 py-2 font-medium transition-all " +
    "focus:outline-none focus:ring-4 focus:ring-primary/50 focus:ring-offset-2";
  const variants = {
    primary: "bg-primary hover:bg-primary-dark text-white",
    secondary: "bg-secondary hover:bg-secondary-dark text-white",
    ghost:
      "bg-transparent hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200",
  };

  return (
    <button
      aria-label={ariaLabel}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
