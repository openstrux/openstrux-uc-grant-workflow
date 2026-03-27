interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  intro?: string;
}

export function DashboardHeader({ title, subtitle, intro }: DashboardHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="text-sm font-medium text-slate-500 mt-0.5">{subtitle}</p>}
      {intro && <p className="text-sm text-slate-600 mt-2 max-w-2xl">{intro}</p>}
    </div>
  );
}
