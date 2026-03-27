export type BadgeVariant =
  | "default"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "draft"
  | "submitted"
  | "eligible"
  | "ineligible"
  | "under_review"
  | "selected"
  | "rejected"
  | "pending";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  pulse?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-emerald-50 text-emerald-700",
  danger: "bg-red-50 text-red-700",
  warning: "bg-amber-50 text-amber-700",
  info: "bg-sky-50 text-sky-700",
  draft: "bg-slate-100 text-slate-600",
  submitted: "bg-blue-50 text-blue-700",
  eligible: "bg-emerald-50 text-emerald-700",
  ineligible: "bg-red-50 text-red-700",
  under_review: "bg-indigo-50 text-indigo-700",
  selected: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  pending: "bg-amber-50 text-amber-700",
};

export function Badge({ variant = "default", children, pulse = false }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide",
        variantClasses[variant],
      ].join(" ")}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
        </span>
      )}
      {children}
    </span>
  );
}
