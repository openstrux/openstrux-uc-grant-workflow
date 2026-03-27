interface SectionSeparatorProps {
  label?: string;
}

export function SectionSeparator({ label }: SectionSeparatorProps) {
  if (!label) {
    return (
      <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent my-16" />
    );
  }

  return (
    <div className="flex items-center gap-4 my-16">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-200" />
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-2">
        {label}
      </span>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-200" />
    </div>
  );
}
