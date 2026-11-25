import type { UserRole, WorkflowStatus } from "@/types/content";

export interface StatusMeta {
  value: WorkflowStatus;
  label: string;
  shortLabel: string;
  description: string;
  stage: "gate1" | "production" | "gate2" | "publishing";
  badgeClass: string;
}

export const STATUS_META: Record<WorkflowStatus, StatusMeta> = {
  idea_pending: {
    value: "idea_pending",
    label: "Idea Pending Approval",
    shortLabel: "Gate 1 Review",
    description: "Waiting for Marketing Manager to approve this reference idea.",
    stage: "gate1",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  idea_rejected: {
    value: "idea_rejected",
    label: "Idea Declined / Parked",
    shortLabel: "Parked",
    description: "Declined at Gate 1. Team can revise notes and re-submit.",
    stage: "gate1",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
  },
  approved_for_production: {
    value: "approved_for_production",
    label: "Approved to Recreate",
    shortLabel: "To Recreate",
    description: "Manager approved the idea. Ready for script & production.",
    stage: "production",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
  },
  in_production: {
    value: "in_production",
    label: "In Production",
    shortLabel: "Creating",
    description: "Team is shooting, animating, or editing the recreated reel.",
    stage: "production",
    badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  draft_review: {
    value: "draft_review",
    label: "Final Video Review",
    shortLabel: "Gate 2 Review",
    description: "Draft video link submitted. Waiting for Manager approval before posting.",
    stage: "gate2",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
  },
  changes_requested: {
    value: "changes_requested",
    label: "Changes Requested",
    shortLabel: "Rework",
    description: "Manager left suggestions on the draft. Upload a revised link.",
    stage: "gate2",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
  },
  approved_to_post: {
    value: "approved_to_post",
    label: "Approved to Post",
    shortLabel: "Ready to Post",
    description: "Manager approved the final cut. Ready to publish on Instagram.",
    stage: "publishing",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  posted: {
    value: "posted",
    label: "Posted",
    shortLabel: "Posted",
    description: "Published live on social media.",
    stage: "publishing",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-200",
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
