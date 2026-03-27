"use client";

import { DataTable } from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import { StatusBadge } from "./StatusBadge";
import type { Role } from "@/lib/session";

export interface SubmissionRow {
  id: string;
  alias: string;
  title: string;
  status: string;
  submittedAt: string;
  callId: string;
  reviewerName?: string;
  recommendation?: string;
}

interface ProposalTableProps {
  rows: SubmissionRow[];
  role: Role;
  onSelect?: (row: SubmissionRow) => void;
}

const ADMIN_COLUMNS: Column<SubmissionRow>[] = [
  { key: "id", header: "ID", render: (r) => <code className="text-xs">{r.id.slice(0, 8)}</code> },
  { key: "alias", header: "Alias", render: (r) => r.alias },
  { key: "title", header: "Title", render: (r) => <span className="font-medium">{r.title}</span> },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status as Parameters<typeof StatusBadge>[0]["status"]} /> },
  { key: "submitted", header: "Submitted", render: (r) => new Date(r.submittedAt).toLocaleDateString() },
  { key: "call", header: "Call", render: (r) => r.callId },
];

const BLINDED_COLUMNS: Column<SubmissionRow>[] = [
  { key: "id", header: "ID", render: (r) => <code className="text-xs">{r.id.slice(0, 8)}</code> },
  { key: "title", header: "Title", render: (r) => <span className="font-medium">{r.title}</span> },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status as Parameters<typeof StatusBadge>[0]["status"]} /> },
  { key: "submitted", header: "Submitted", render: (r) => new Date(r.submittedAt).toLocaleDateString() },
];

const REVIEWER_COLUMNS: Column<SubmissionRow>[] = [
  ...BLINDED_COLUMNS,
  { key: "recommendation", header: "Recommendation", render: (r) => r.recommendation ?? "—" },
];

function getColumns(role: Role): Column<SubmissionRow>[] {
  if (role === "admin") return ADMIN_COLUMNS;
  if (role === "reviewer") return BLINDED_COLUMNS;
  if (role === "validator") return REVIEWER_COLUMNS;
  return BLINDED_COLUMNS;
}

export function ProposalTable({ rows, role, onSelect }: ProposalTableProps) {
  return (
    <DataTable
      columns={getColumns(role)}
      rows={rows}
      getRowKey={(r) => r.id}
      onRowAction={onSelect}
      emptyState={<p>No proposals found.</p>}
    />
  );
}
