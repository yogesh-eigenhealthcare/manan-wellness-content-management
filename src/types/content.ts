export type UserRole = "manager" | "member";

export type ContentFormat = "reel" | "long_form" | "carousel";

export type EffortLevel = "low" | "high" | "general";

export type WorkflowStatus =
  | "idea_pending"
  | "idea_rejected"
  | "approved_for_production"
  | "in_production"
  | "draft_review"
  | "changes_requested"
  | "approved_to_post"
  | "posted";

export type CommentActionType =
  | "comment"
  | "gate1_approve"
  | "gate1_reject"
  | "draft_submit"
  | "gate2_approve"
  | "gate2_request_changes"
  | "posted";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  teamTag: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface RolePreassignment {
  email: string;
  role: UserRole;
  teamTag: string;
  updatedAt?: unknown;
}

export interface ContentItem {
  id: string;
  serialNo: number;
  format: ContentFormat;
  title: string;
  topicType: string;
  effortLevel: EffortLevel;
  status: WorkflowStatus;
  referenceUrl: string;
  referenceBackupUrl: string;
  referenceNotes: string;
  adaptationIdea: string;
  callToAction: string;
  scriptUrl: string;
  scriptText: string;
  hashtags: string[];
  assignedTo: string[];
  targetPostDate: string | null;
  latestDraftUrl: string | null;
  latestDraftVersion: number;
  publishedUrl: string | null;
  gate1ReviewedBy: string | null;
  gate1ReviewedAt: unknown | null;
  gate1Feedback: string | null;
  gate2ReviewedBy: string | null;
  gate2ReviewedAt: unknown | null;
  gate2Feedback: string | null;
  createdByUid: string;
  createdByName: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface DraftSubmission {
  id: string;
  version: number;
  videoUrl: string;
  notes: string;
  submittedByUid: string;
  submittedByName: string;
  submittedAt: unknown;
}

export interface ContentComment {
  id: string;
  authorUid: string;
  authorName: string;
  authorRole: UserRole;
  actionType: CommentActionType;
  draftVersion: number | null;
  timestampLabel: string | null;
  body: string;
  createdAt: unknown;
}

export interface HashtagPreset {
  id: string;
  category: string;
  tags: string[];
  updatedAt?: unknown;
}

export const FORMAT_OPTIONS: { value: ContentFormat; label: string }[] = [
  { value: "reel", label: "Reels / Shorts" },
  { value: "long_form", label: "Long form" },
  { value: "carousel", label: "Carousel / Post" },
];

export function formatLabel(format: ContentFormat | string): string {
  if (format === "reel") return "Reels / Shorts";
  if (format === "long_form") return "Long form";
  if (format === "carousel") return "Carousel / Post";
  return format;
}

export const TOPIC_OPTIONS = [
  "Anxiety",
  "Depression",
  "Overthink",
  "Panic attack",
  "Relationship",
  "Stress",
  "General",
  "funny meme",
] as const;

export const TEAM_ASSIGNEE_OPTIONS = [
  "animation team",
  "pragati mam",
  "avantika",
  "content team",
] as const;
