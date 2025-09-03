import { InputHTMLAttributes, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name || "input";
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium mb-1 text-foreground">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={twMerge(
            // Minimal, smooth, modern
            "w-full rounded-lg border border-foreground/10 bg-background/70 backdrop-blur-sm px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/50",
            // Focus ring subtle but visible (no heavy lines)
            "focus:outline-none focus:ring-4 focus:ring-[rgba(var(--primary-rgb),0.15)] focus:ring-offset-0",
            error && "border-accent",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";


