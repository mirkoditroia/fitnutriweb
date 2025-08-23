import { PropsWithChildren } from "react";
import { twMerge } from "tailwind-merge";

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={twMerge("card", className)}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={twMerge("p-4 sm:p-6 border-b border-[color:var(--border)]", className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <div className={twMerge("p-4 sm:p-6", className)}>{children}</div>;
}


