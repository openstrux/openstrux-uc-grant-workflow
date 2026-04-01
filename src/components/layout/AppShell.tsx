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

/* Applicant → green theme; all internal roles → blue theme */
const ROLE_THEME: Record<Role, { gradient: string; activeLink: string; activeDot: string; badge: string }> = {
  applicant: {
    gradient: "from-green-600 to-emerald-600",
    activeLink: "bg-green-50 text-green-700",
    activeDot: "bg-green-500",
    badge: "bg-green-100 text-green-700",
  },
  admin: {
    gradient: "from-blue-600 to-indigo-600",
    activeLink: "bg-blue-50 text-blue-700",
    activeDot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
  },
  reviewer: {
    gradient: "from-blue-600 to-indigo-600",
    activeLink: "bg-blue-50 text-blue-700",
    activeDot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
  },
  validator: {
    gradient: "from-blue-600 to-indigo-600",
    activeLink: "bg-blue-50 text-blue-700",
    activeDot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
  },
  auditor: {
    gradient: "from-slate-600 to-slate-800",
    activeLink: "bg-slate-100 text-slate-800",
    activeDot: "bg-slate-500",
    badge: "bg-slate-200 text-slate-700",
  },
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
  const theme = ROLE_THEME[role];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        {/* Brand header with gradient */}
        <div className={`px-5 py-5 bg-gradient-to-br ${theme.gradient} text-white`}>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-xs font-bold">
              G
            </span>
            <span className="text-sm font-bold tracking-tight">Grant Workflow</span>
          </div>
          <p className="text-xs text-white/60 pl-8">EU Open Source Fund</p>
        </div>

        {/* Role badge */}
        <div className="px-4 py-3 border-b border-slate-100">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${theme.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${theme.activeDot}`} />
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  active
                    ? theme.activeLink
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                ].join(" ")}
              >
                {link.icon}
                {link.label}
                {active && <ChevronRight size={13} className="ml-auto opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-slate-100">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-700 transition-all duration-150"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm">
          <h1 className="text-sm font-semibold text-slate-800">{pageTitle}</h1>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className={`px-2.5 py-1 rounded-full font-semibold text-xs ${theme.badge}`}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
            <span className="text-slate-300">·</span>
            <span className="font-mono text-slate-400">{userId.slice(0, 12)}</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}
