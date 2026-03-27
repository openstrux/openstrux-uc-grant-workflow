"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import type { AuditEvent } from "@/domain/schemas";

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
      render: (e: AuditEvent) => new Date(e.timestamp).toLocaleString(),
    },
    { key: "eventType", header: "Event type", render: (e: AuditEvent) => <code className="text-xs">{e.eventType}</code> },
    { key: "actorId", header: "Actor", render: (e: AuditEvent) => <code className="text-xs">{e.actorId.slice(0, 12)}</code> },
    { key: "targetType", header: "Target type", render: (e: AuditEvent) => e.targetType },
    { key: "targetId", header: "Target ID", render: (e: AuditEvent) => <code className="text-xs">{e.targetId.slice(0, 8)}</code> },
    {
      key: "payload",
      header: "Payload",
      render: (e: AuditEvent) => (
        <span className="text-slate-400 text-xs">{Object.keys(e.payload).slice(0, 2).join(", ")}</span>
      ),
    },
  ];

  return (
    <AppShell role="auditor" userId="dev-auditor-1" pageTitle="Audit Log">
      <DashboardHeader
        title="Audit log"
        subtitle="Read-only access to all system events"
      />

      {/* Filter bar */}
      <Card className="mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">Event type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {EVENT_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">From</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">To</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={filtered}
        getRowKey={(e) => e.id}
        emptyState={<p>No audit events found.</p>}
      />
    </AppShell>
  );
}
