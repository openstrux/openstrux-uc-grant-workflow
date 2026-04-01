"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import type { AuditEvent } from "@/domain/schemas";
import { Filter } from "lucide-react";

const EVENT_TYPE_OPTIONS = [
  "All",
  "submission.created",
  "eligibility.checked",
  "review.submitted",
  "validation.decided",
];

export default function AuditorDashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [filterType, setFilterType] = useState("All");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  useEffect(() => {
    fetch("/api/audit")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json() as Promise<AuditEvent[]>;
      })
      .then((data) => { if (data) setEvents(data); });
  }, [router]);

  const filtered = events.filter((e) => {
    if (filterType !== "All" && e.eventType !== filterType) return false;
    if (filterDateFrom && e.timestamp < filterDateFrom) return false;
    if (filterDateTo && e.timestamp > filterDateTo + "T23:59:59Z") return false;
    return true;
  });

  const columns = [
    {
      key: "timestamp",
      header: "Timestamp",
      render: (e: AuditEvent) => (
        <span className="text-xs text-slate-500 font-mono">
          {new Date(e.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      key: "eventType",
      header: "Event type",
      render: (e: AuditEvent) => (
        <code className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">
          {e.eventType}
        </code>
      ),
    },
    {
      key: "actorId",
      header: "Actor",
      render: (e: AuditEvent) => (
        <code className="text-xs font-mono text-slate-500">{e.actorId.slice(0, 12)}</code>
      ),
    },
    {
      key: "targetType",
      header: "Target type",
      render: (e: AuditEvent) => (
        <span className="text-xs text-slate-600">{e.targetType}</span>
      ),
    },
    {
      key: "targetId",
      header: "Target ID",
      render: (e: AuditEvent) => (
        <code className="text-xs font-mono text-slate-400">{e.targetId.slice(0, 8)}</code>
      ),
    },
    {
      key: "payload",
      header: "Payload",
      render: (e: AuditEvent) => (
        <span className="text-slate-400 text-xs">
          {Object.keys(e.payload).slice(0, 2).join(", ")}
        </span>
      ),
    },
  ];

  return (
    <AppShell role="auditor" userId="dev-auditor-1" pageTitle="Audit Log">
      <DashboardHeader
        title="Audit log"
        subtitle="Read-only access to all system events"
        accentColor="slate"
      />

      {/* Filter bar */}
      <Card className="mb-6" header={
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <Filter size={14} className="text-slate-400" />
          Filters
        </div>
      }>
        <div className="flex flex-wrap gap-5 items-end">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Event type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow"
            >
              {EVENT_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
              From
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
              To
            </label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow"
            />
          </div>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={filtered}
        getRowKey={(e) => e.id}
        emptyState={
          <div className="text-center py-12">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Filter size={18} className="text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No audit events found.</p>
          </div>
        }
      />
    </AppShell>
  );
}
