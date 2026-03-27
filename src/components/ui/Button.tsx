"use client";

import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-indigo-600 text-white border-transparent hover:bg-indigo-700 focus-visible:ring-indigo-500",
  secondary: "bg-white text-indigo-600 border-slate-200 hover:bg-slate-50 focus-visible:ring-indigo-500",
  ghost: "bg-transparent text-slate-600 border-transparent hover:bg-slate-100 focus-visible:ring-slate-400",
  danger: "bg-red-600 text-white border-transparent hover:bg-red-700 focus-visible:ring-red-500",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-base gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled ?? isLoading}
      className={[
        "inline-flex items-center justify-center font-medium rounded-lg border",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
      {...props}
    >
      {isLoading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
