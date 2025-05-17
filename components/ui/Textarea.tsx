// components/ui/Textarea.tsx
import React from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export default function Textarea(props: TextareaProps) {
  return (
    <textarea
      aria-invalid={props["aria-invalid"]}
      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      {...props}
    />
  );
}
