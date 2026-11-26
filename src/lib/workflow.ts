import type { UserRole, WorkflowStatus } from "@/types/content";

export interface StatusMeta {
  value: WorkflowStatus;
  label: string;
  shortLabel: string;
  description: string;
  stage: "gate1" | "production" | "gate2" | "publishing";
  dotClass: string;
  badgeClass: string;
}

export const STATUS_META: Record<WorkflowStatus, StatusMeta> = {
  idea_pending: {
    value: "idea_pending",
    label: "Idea pending approval",
    shortLabel: "Gate 1 review",
    description: "Waiting for Marketing Manager to approve this reference idea.",
    stage: "gate1",
    dotClass: "bg-amber-500",
    badgeClass: "status-pill-amber",
  },
  idea_rejected: {
    value: "idea_rejected",
    label: "Idea parked",
    shortLabel: "Parked",
    description: "Declined at Gate 1. Team can revise notes and re-submit.",
    stage: "gate1",
    dotClass: "bg-rose-500",
    badgeClass: "status-pill-rose",
  },
  approved_for_production: {
    value: "approved_for_production",
    label: "Approved to recreate",
    shortLabel: "To recreate",
    description: "Manager approved the idea. Ready for script and production.",
    stage: "production",
    dotClass: "bg-emerald-500",
    badgeClass: "status-pill-emerald",
  },
  in_production: {
    value: "in_production",
    label: "In production",
    shortLabel: "Creating",
    description: "Team is shooting, animating, or editing the recreated post.",
    stage: "production",
    dotClass: "bg-sky-500",
    badgeClass: "status-pill-sky",
  },
  draft_review: {
    value: "draft_review",
    label: "Final video review",
    shortLabel: "Gate 2 review",
    description: "Draft submitted. Waiting for Manager approval before posting.",
    stage: "gate2",
    dotClass: "bg-rose-400",
    badgeClass: "status-pill-rose",
  },
  changes_requested: {
    value: "changes_requested",
    label: "Changes requested",
    shortLabel: "Rework",
    description: "Manager left suggestions on the draft. Submit a revised version.",
    stage: "gate2",
    dotClass: "bg-orange-500",
    badgeClass: "status-pill-orange",
  },
  approved_to_post: {
    value: "approved_to_post",
    label: "Approved to post",
    shortLabel: "Ready to post",
    description: "Manager approved the final cut. Ready to publish.",
    stage: "publishing",
    dotClass: "bg-emerald-600",
    badgeClass: "status-pill-emerald",
  },
  posted: {
    value: "posted",
    label: "Posted",
    shortLabel: "Posted",
    description: "Published live on social media.",
    stage: "publishing",
    dotClass: "bg-emerald-600",
    badgeClass: "status-pill-emerald",
  },
};

export const WORKFLOW_ORDER: WorkflowStatus[] = [
  "idea_pending",
  "approved_for_production",
  "in_production",
  "draft_review",
  "changes_requested",
  "approved_to_post",
  "posted",
  "idea_rejected",
];

/**
 * Transitions any authenticated team member is permitted to execute.
 * Must stay strictly aligned with firestore.rules.
 */
export const MEMBER_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  idea_pending: [],
  idea_rejected: ["idea_pending"],
  approved_for_production: ["in_production", "draft_review"],
  in_production: ["draft_review"],
  draft_review: [],
  changes_requested: ["draft_review"],
  approved_to_post: ["posted"],
  posted: [],
};

/**
 * Transitions permitted exclusively to Marketing Managers (Gate 1 & Gate 2 + overrides).
 */
export const MANAGER_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  idea_pending: ["approved_for_production", "idea_rejected"],
  idea_rejected: ["idea_pending", "approved_for_production"],
  approved_for_production: ["in_production", "draft_review", "idea_rejected"],
  in_production: ["draft_review", "approved_for_production"],
  draft_review: ["approved_to_post", "changes_requested"],
  changes_requested: ["draft_review", "approved_to_post"],
  approved_to_post: ["posted", "changes_requested"],
  posted: ["approved_to_post"],
};

export const MANAGER_ONLY_TARGET_STATUSES: ReadonlySet<WorkflowStatus> = new Set([
  "approved_for_production",
  "idea_rejected",
  "approved_to_post",
  "changes_requested",
]);

/**
 * Returns whether a user with the given role can move an item from `from` to `to`.
 */
export function canUserPerformTransition(
  role: UserRole | null | undefined,
  from: WorkflowStatus,
  to: WorkflowStatus
): boolean {
  if (!role || from === to) return false;
  if (role === "manager") {
    return MANAGER_TRANSITIONS[from]?.includes(to) ?? false;
  }
  return MEMBER_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isGate1Pending(status: WorkflowStatus): boolean {
  return status === "idea_pending";
}

export function isGate2Pending(status: WorkflowStatus): boolean {
  return status === "draft_review";
}
