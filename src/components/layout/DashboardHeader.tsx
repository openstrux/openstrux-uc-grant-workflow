interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  intro?: string;
  accentColor?: "green" | "blue" | "slate";
}

const accentStyles = {
  green: "border-l-4 border-green-500 bg-gradient-to-r from-green-50/70 to-transparent pl-5",
  blue:  "border-l-4 border-blue-500 bg-gradient-to-r from-blue-50/70 to-transparent pl-5",
  slate: "border-l-4 border-slate-400 bg-gradient-to-r from-slate-50/70 to-transparent pl-5",
};

const subtitleColors = {
  green: "text-green-600",
  blue:  "text-blue-600",
  slate: "text-slate-500",
};

export function DashboardHeader({ title, subtitle, intro, accentColor = "blue" }: DashboardHeaderProps) {
  return (
    <div className={`mb-8 py-4 rounded-xl ${accentStyles[accentColor]}`}>
      <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
      {subtitle && (
        <p className={`text-xs font-semibold uppercase tracking-wide mt-0.5 ${subtitleColors[accentColor]}`}>
          {subtitle}
        </p>
      )}
      {intro && (
        <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">{intro}</p>
      )}
    </div>
  );
}
