interface FormFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  as?: "input" | "textarea" | "select";
  children?: React.ReactNode;
  className?: string;
  // For native input/textarea/select
  inputProps?: React.InputHTMLAttributes<HTMLInputElement> &
    React.TextareaHTMLAttributes<HTMLTextAreaElement> &
    React.SelectHTMLAttributes<HTMLSelectElement>;
}

export function FormField({
  id,
  label,
  hint,
  error,
  required,
  as: Element = "input",
  children,
  inputProps = {},
}: FormFieldProps) {
  const baseInputClass = [
    "w-full px-3 py-2 text-sm text-slate-700 bg-white border rounded-lg transition-colors outline-none",
    "placeholder:text-slate-400",
    error
      ? "border-red-400 focus:ring-2 focus:ring-red-400 focus:ring-offset-0"
      : "border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0",
  ].join(" ");

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children ? (
        children
      ) : Element === "textarea" ? (
        <textarea id={id} className={baseInputClass} {...inputProps} />
      ) : Element === "select" ? (
        <select id={id} className={baseInputClass} {...inputProps}>
          {inputProps.children as React.ReactNode}
        </select>
      ) : (
        <input id={id} className={baseInputClass} {...inputProps} />
      )}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
