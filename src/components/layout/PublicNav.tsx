import Link from "next/link";

export function PublicNav() {
  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <span className="text-indigo-600">●</span>
          Grant Workflow
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/submit"
            className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Submit
          </Link>
          <Link
            href="/login"
            className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
}
