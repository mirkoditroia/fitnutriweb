import { ButtonHTMLAttributes, forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", fullWidth, ...props }, ref) => {
    const base = "btn";
    const variants = {
      primary: "btn-primary",
      secondary: "btn-outline",
      ghost: "hover:bg-[color:var(--muted-bg)]",
    } as const;

    return (
      <button
        ref={ref}
        className={twMerge(
          clsx(base, variants[variant], fullWidth && "w-full"),
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";


