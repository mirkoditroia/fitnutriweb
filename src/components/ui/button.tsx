import { ButtonHTMLAttributes, forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", fullWidth, ...props }, ref) => {
    const base = "btn";
    const variants = {
      primary: "btn-primary",
      secondary: "btn-outline",
      ghost: "hover:bg-[color:var(--muted-bg)]",
      outline: "btn-outline",
    } as const;
    
    const sizes = {
      sm: "px-3 py-1 text-sm",
      md: "px-4 py-2",
      lg: "px-6 py-3 text-lg",
    } as const;

    return (
      <button
        ref={ref}
        className={twMerge(
          clsx(base, variants[variant], sizes[size], fullWidth && "w-full"),
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";


