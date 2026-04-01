import Link from "next/link";

export function PublicNav() {
  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 text-sm font-bold text-slate-900 hover:opacity-80 transition-opacity">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            G
          </span>
          <span>Grant Workflow</span>
          <span className="hidden sm:inline text-xs font-normal text-slate-400 ml-0.5">EU Open Source Fund</span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-sm hover:shadow-md transition-all duration-150 active:scale-[0.98]"
          >
            Submit proposal
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all duration-150"
          >
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
}
