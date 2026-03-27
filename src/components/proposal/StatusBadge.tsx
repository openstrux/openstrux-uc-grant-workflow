import { Badge } from "@/components/ui/Badge";
import type { BadgeVariant } from "@/components/ui/Badge";

type ProposalStatus =
  | "draft"
  | "submitted"
  | "eligibility_failed"
  | "eligible"
  | "under_review"
  | "clarification_requested"
  | "revised"
  | "validation_pending"
  | "selected"
  | "rejected";

const STATUS_MAP: Record<ProposalStatus, { variant: BadgeVariant; label: string; pulse?: boolean }> = {
  draft: { variant: "draft", label: "Draft" },
  submitted: { variant: "submitted", label: "Submitted" },
  eligibility_failed: { variant: "ineligible", label: "Ineligible" },
  eligible: { variant: "eligible", label: "Eligible" },
  under_review: { variant: "under_review", label: "Under Review", pulse: true },
  clarification_requested: { variant: "warning", label: "Clarification Requested" },
  revised: { variant: "info", label: "Revised" },
  validation_pending: { variant: "pending", label: "Validation Pending" },
  selected: { variant: "selected", label: "Selected" },
  rejected: { variant: "rejected", label: "Rejected" },
};

interface StatusBadgeProps {
  status: ProposalStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { variant, label, pulse } = STATUS_MAP[status] ?? {
    variant: "default" as BadgeVariant,
    label: status,
  };
  return (
    <Badge variant={variant} pulse={pulse}>
      {label}
    </Badge>
  );
}
