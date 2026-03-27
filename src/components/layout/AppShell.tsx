"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  CheckSquare,
  Shield,
  LogOut,
  ChevronRight,
} from "lucide-react";
import type { Role } from "@/lib/session";

interface NavLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_LINKS: Record<Role, NavLink[]> = {
  applicant: [{ label: "My Proposal", href: "/dashboard/applicant", icon: <FileText size={16} /> }],
  admin: [{ label: "Proposals", href: "/dashboard/admin", icon: <LayoutDashboard size={16} /> }],
  reviewer: [{ label: "Review Queue", href: "/dashboard/reviewer", icon: <Users size={16} /> }],
  validator: [{ label: "Validation", href: "/dashboard/validator", icon: <CheckSquare size={16} /> }],
  auditor: [{ label: "Audit Log", href: "/dashboard/auditor", icon: <Shield size={16} /> }],
};

interface AppShellProps {
  children: React.ReactNode;
  role: Role;
  userId: string;
  pageTitle: string;
}

export function AppShell({ children, role, userId, pageTitle }: AppShellProps) {
  const pathname = usePathname();
  const links = NAV_LINKS[role] ?? [];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100">
          <span className="text-sm font-semibold text-indigo-600">Grant Workflow</span>
          <p className="text-xs text-slate-400 mt-0.5">EU Open Source Fund</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                ].join(" ")}
              >
                {link.icon}
                {link.label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-slate-100">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-sm font-semibold text-slate-800">{pageTitle}</h1>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="px-2 py-0.5 bg-slate-100 rounded-full font-medium capitalize">{role}</span>
            <span className="text-slate-300">·</span>
            <span>{userId.slice(0, 12)}</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
