// components/ui/Textarea.tsx
import { forwardRef } from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <div>
        <textarea
          className={`
            mt-1 block w-full rounded-md border-gray-300 shadow-sm \
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 \
            focus:border-primary focus:ring-primary sm:text-sm \
            ${error ? "border-red-300" : ""} \
            ${className}
          `}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
