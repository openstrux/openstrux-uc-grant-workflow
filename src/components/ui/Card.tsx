interface CardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Card({ children, header, footer, className = "" }: CardProps) {
  return (
    <div
      className={[
        "bg-white border border-slate-200 rounded-xl shadow-sm",
        className,
      ].join(" ")}
    >
      {header && (
        <div className="px-6 py-4 border-b border-slate-100">{header}</div>
      )}
      <div className="px-6 py-5">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">{footer}</div>
      )}
    </div>
  );
}
