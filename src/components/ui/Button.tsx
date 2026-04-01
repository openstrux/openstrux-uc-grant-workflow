"use client";

import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "submit" | "admin";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-transparent hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow-blue-200 hover:shadow-md focus-visible:ring-blue-500",
  submit:
    "bg-gradient-to-br from-green-600 to-emerald-600 text-white border-transparent hover:from-green-700 hover:to-emerald-700 shadow-sm hover:shadow-green-200 hover:shadow-md focus-visible:ring-green-500",
  admin:
    "bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-transparent hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow-blue-200 hover:shadow-md focus-visible:ring-blue-500",
  secondary:
    "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-blue-500 shadow-sm",
  ghost:
    "bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-slate-400",
  danger:
    "bg-red-600 text-white border-transparent hover:bg-red-700 shadow-sm hover:shadow-red-200 hover:shadow-md focus-visible:ring-red-500",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5 rounded-lg",
  md: "px-4 py-2 text-sm gap-2 rounded-xl",
  lg: "px-6 py-3 text-sm gap-2 rounded-xl font-semibold",
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
        "inline-flex items-center justify-center font-medium border",
        "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:opacity-55 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none",
        "active:scale-[0.98]",
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
