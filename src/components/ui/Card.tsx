interface CardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  accent?: "green" | "blue" | "none";
}

export function Card({ children, header, footer, className = "", accent = "none" }: CardProps) {
  const accentGradient =
    accent === "green"
      ? "bg-gradient-to-r from-green-500 to-emerald-500"
      : accent === "blue"
      ? "bg-gradient-to-r from-blue-500 to-indigo-500"
      : null;

  return (
    <div
      className={[
        "bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden",
        "transition-shadow duration-200 hover:shadow-md",
        className,
      ].join(" ")}
    >
      {accentGradient && <div className={`h-0.5 ${accentGradient}`} />}
      {header && (
        <div className="px-6 py-4 border-b border-slate-100">{header}</div>
      )}
      <div className="px-6 py-5">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60">{footer}</div>
      )}
    </div>
  );
}
