"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  FileText,
  Film,
  History,
  Link2,
  MessageSquare,
  Play,
  RotateCcw,
  Send,
  ShieldAlert,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { DraftPreviewCard } from "@/components/video/DraftPreviewCard";
import { VideoPlayerCard } from "@/components/video/VideoPlayerCard";
import { WorkflowProgressBar } from "@/components/review/WorkflowProgressBar";
import { useAuth } from "@/contexts/AuthContext";
import { useItemSubcollections } from "@/hooks/useContentItems";
import {
  prepareDraftUploadFile,
  validateDraftMutualExclusion,
  type PreparedDraftFile,
} from "@/lib/fileUpload";
import { STATUS_META } from "@/lib/workflow";
import {
  FORMAT_OPTIONS,
  TEAM_ASSIGNEE_OPTIONS,
  TOPIC_OPTIONS,
  formatLabel,
  type ContentFormat,
  type ContentItem,
  type DraftSubmission,
  type EffortLevel,
  type HashtagPreset,
} from "@/types/content";

interface ContentDetailViewProps {
  item: ContentItem;
  backLabel: string;
  hashtagPresets: HashtagPreset[];
  onBack: () => void;
  actions: {
    reviewGate1: (
      itemId: string,
      decision: "approved_for_production" | "idea_rejected",
      feedback: string,
      overrides?: { assignedTo?: string[]; effortLevel?: EffortLevel }
    ) => Promise<void>;
    resubmitIdea: (itemId: string, notes?: string) => Promise<void>;
    startProduction: (itemId: string) => Promise<void>;
    submitDraftLink: (
      itemId: string,
      currentVersion: number,
      videoUrl: string,
      notes: string
    ) => Promise<void>;
    submitDraftFile: (
      itemId: string,
      currentVersion: number,
      file: PreparedDraftFile,
      notes: string
    ) => Promise<void>;
    reviewGate2: (
      itemId: string,
      draftVersion: number,
      decision: "approved_to_post" | "changes_requested",
      feedback: string
    ) => Promise<void>;
    markPosted: (itemId: string, publishedUrl: string) => Promise<void>;
    updateItemDetails: (
      itemId: string,
      updates: Partial<
        Pick<
          ContentItem,
          | "title"
          | "format"
          | "topicType"
          | "effortLevel"
          | "referenceUrl"
          | "referenceBackupUrl"
          | "referenceNotes"
          | "adaptationIdea"
          | "callToAction"
          | "scriptUrl"
          | "scriptText"
          | "hashtags"
          | "assignedTo"
          | "targetPostDate"
        >
      >
    ) => Promise<void>;
    deleteContentItem: (itemId: string) => Promise<void>;
    addAuditComment: (
      itemId: string,
      actionType: "comment",
      body: string,
      draftVersion?: number | null,
      timestampLabel?: string | null
    ) => Promise<void>;
  };
}

type DetailTab = "reference" | "recreated" | "changes";

export function ContentDetailView({
  item,
  backLabel,
  hashtagPresets,
  onBack,
  actions,
}: ContentDetailViewProps) {
  const { isManager } = useAuth();
  const { drafts, comments } = useItemSubcollections(item.id);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<DetailTab>(
    item.status === "changes_requested"
      ? "changes"
      : item.status === "draft_review" ||
          item.status === "approved_to_post" ||
          item.status === "posted" ||
          item.latestDraftVersion > 0
        ? "recreated"
        : "reference"
  );

  const [selectedVersion, setSelectedVersion] = useState<number | null>(
    item.latestDraftVersion || null
  );
  const [draftUrl, setDraftUrl] = useState("");
  const [preparedFile, setPreparedFile] = useState<PreparedDraftFile | null>(null);
  const [fileBusy, setFileBusy] = useState(false);
  const [draftNotes, setDraftNotes] = useState("");
  const [reuploadOpen, setReuploadOpen] = useState(false);

  const [gateFeedback, setGateFeedback] = useState("");
  const [publishedUrl, setPublishedUrl] = useState(item.publishedUrl ?? "");
  const [commentText, setCommentText] = useState("");
  const [timestampLabel, setTimestampLabel] = useState("");

  const [title, setTitle] = useState(item.title);
  const [format, setFormat] = useState<ContentFormat>(item.format);
  const [topicType, setTopicType] = useState(item.topicType);
  const [effortLevel, setEffortLevel] = useState<EffortLevel>(item.effortLevel);
  const [referenceUrl, setReferenceUrl] = useState(item.referenceUrl ?? "");
  const [referenceBackupUrl, setReferenceBackupUrl] = useState(
    item.referenceBackupUrl ?? ""
  );
  const [referenceNotes, setReferenceNotes] = useState(item.referenceNotes ?? "");
  const [adaptationIdea, setAdaptationIdea] = useState(item.adaptationIdea ?? "");
  const [callToAction, setCallToAction] = useState(item.callToAction ?? "");
  const [scriptUrl, setScriptUrl] = useState(item.scriptUrl ?? "");
  const [scriptText, setScriptText] = useState(item.scriptText ?? "");
  const [hashtagsText, setHashtagsText] = useState((item.hashtags ?? []).join(" "));
  const [assignedTo, setAssignedTo] = useState<string[]>(item.assignedTo ?? []);
  const [targetPostDate, setTargetPostDate] = useState(item.targetPostDate ?? "");

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setNotice(null);
    setErrorMsg(null);
  }, [item.id]);

  useEffect(() => {
    setSelectedVersion(item.latestDraftVersion || null);
    setDraftUrl("");
    setPreparedFile(null);
    setDraftNotes("");
    setReuploadOpen(false);
    setGateFeedback("");
    setPublishedUrl(item.publishedUrl ?? "");
    setCommentText("");
    setTimestampLabel("");
    setTitle(item.title);
    setFormat(item.format);
    setTopicType(item.topicType);
    setEffortLevel(item.effortLevel);
    setReferenceUrl(item.referenceUrl ?? "");
    setReferenceBackupUrl(item.referenceBackupUrl ?? "");
    setReferenceNotes(item.referenceNotes ?? "");
    setAdaptationIdea(item.adaptationIdea ?? "");
    setCallToAction(item.callToAction ?? "");
    setScriptUrl(item.scriptUrl ?? "");
    setScriptText(item.scriptText ?? "");
    setHashtagsText((item.hashtags ?? []).join(" "));
    setAssignedTo(item.assignedTo ?? []);
    setTargetPostDate(item.targetPostDate ?? "");
  }, [item]);

  const statusMeta = STATUS_META[item.status];
  const activeDraft =
    drafts.find((d) => d.version === selectedVersion) ?? drafts[0] ?? null;

  const revisionComments = comments.filter(
    (c) =>
      c.actionType === "gate2_request_changes" ||
      c.actionType === "gate1_reject" ||
      c.actionType === "comment"
  );
  const changesBadgeCount =
    revisionComments.length +
    (item.status === "changes_requested" && item.gate2Feedback && revisionComments.length === 0
      ? 1
      : 0);

  const hasVideoLink = Boolean(draftUrl.trim());
  const hasUploadedFile = Boolean(preparedFile);

  const stagedPreviewDraft: DraftSubmission | null = preparedFile
    ? {
        id: "staged-preview",
        version: item.latestDraftVersion + 1,
        draftKind: preparedFile.draftKind,
        videoUrl: "",
        fileDataUrl: preparedFile.fileDataUrl,
        fileName: preparedFile.fileName,
        mimeType: preparedFile.mimeType,
        notes: draftNotes,
        submittedByUid: "",
        submittedByName: "",
        submittedAt: null,
      }
    : hasVideoLink
      ? {
          id: "staged-preview",
          version: item.latestDraftVersion + 1,
          draftKind: "video",
          videoUrl: draftUrl.trim(),
          notes: draftNotes,
          submittedByUid: "",
          submittedByName: "",
          submittedAt: null,
        }
      : null;

  const parseHashtags = (raw: string): string[] =>
    Array.from(
      new Set(
        raw
          .split(/[\s,]+/)
          .map((t) => t.trim())
          .filter(Boolean)
          .map((t) => (t.startsWith("#") ? t : `#${t}`))
      )
    );

  const toggleAssignee = (name: string) => {
    setAssignedTo((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const applyPreset = (tags: string[]) => {
    const merged = Array.from(new Set([...parseHashtags(hashtagsText), ...tags]));
    setHashtagsText(merged.join(" "));
  };

  const runAction = async (fn: () => Promise<void>, successMessage?: string) => {
    setBusy(true);
    setErrorMsg(null);
    setNotice(null);
    try {
      await fn();
      if (successMessage) setNotice(successMessage);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    await runAction(
      () =>
        actions.updateItemDetails(item.id, {
          title,
          format,
          topicType,
          effortLevel,
          referenceUrl,
          referenceBackupUrl,
          referenceNotes,
          adaptationIdea,
          callToAction,
          scriptUrl,
          scriptText,
          hashtags: parseHashtags(hashtagsText),
          assignedTo,
          targetPostDate: targetPostDate || null,
        }),
      "Project details saved"
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setFileBusy(true);
    try {
      const prepared = await prepareDraftUploadFile(file);
      setPreparedFile(prepared);
      setDraftUrl("");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Could not load file");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setFileBusy(false);
    }
  };

  const handleClearFile = () => {
    setPreparedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmitDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateDraftMutualExclusion(draftUrl, preparedFile);
    if (!check.ok) {
      setErrorMsg(check.error);
      return;
    }

    await runAction(async () => {
      if (check.mode === "video") {
        await actions.submitDraftLink(
          item.id,
          item.latestDraftVersion,
          draftUrl,
          draftNotes
        );
      } else if (preparedFile) {
        await actions.submitDraftFile(
          item.id,
          item.latestDraftVersion,
          preparedFile,
          draftNotes
        );
      }
      setDraftUrl("");
      handleClearFile();
      setDraftNotes("");
      setReuploadOpen(false);
      setSelectedVersion(item.latestDraftVersion + 1);
    }, `Submitted draft v${item.latestDraftVersion + 1} for manager review`);
  };

  const handleGate1 = async (decision: "approved_for_production" | "idea_rejected") => {
    if (decision === "idea_rejected" && !gateFeedback.trim()) {
      setErrorMsg("Enter a short reason before parking an idea");
      return;
    }
    await runAction(async () => {
      await actions.reviewGate1(item.id, decision, gateFeedback, {
        assignedTo,
        effortLevel,
      });
      setGateFeedback("");
    }, decision === "approved_for_production" ? "Approved for production" : "Idea parked");
  };

  const handleGate2 = async (decision: "approved_to_post" | "changes_requested") => {
    if (decision === "changes_requested" && !gateFeedback.trim()) {
      setErrorMsg("Add feedback for the team before requesting changes");
      return;
    }
    await runAction(async () => {
      await actions.reviewGate2(
        item.id,
        item.latestDraftVersion || 1,
        decision,
        gateFeedback
      );
      setGateFeedback("");
    }, decision === "approved_to_post" ? "Approved to post" : "Sent back for revisions");
  };

  const handleCopyCaptionAndTags = async () => {
    const caption = [
      title,
      callToAction ? `\n${callToAction}` : "",
      hashtagsText ? `\n\n${hashtagsText}` : "",
    ]
      .join("")
      .trim();
    await navigator.clipboard.writeText(caption);
    setNotice("Copied caption and hashtags");
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await runAction(async () => {
      await actions.addAuditComment(
        item.id,
        "comment",
        commentText,
        activeDraft?.version ?? (item.latestDraftVersion || null),
        timestampLabel.trim() || null
      );
      setCommentText("");
      setTimestampLabel("");
    });
  };

  return (
    <div className="space-y-5">
      {/* Studio Project Header */}
      <div className="studio-surface rounded-2xl border p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
              <span>Back to {backLabel}</span>
            </button>

            <h1 className="font-display text-xl font-semibold tracking-tight text-[var(--text-primary)]">
              <span className="font-mono-meta mr-2 text-base font-normal text-[var(--text-muted)]">
                #{item.serialNo}
              </span>
              {item.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium ${statusMeta.badgeClass}`}
              >
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
                {statusMeta.label}
              </span>
              <span className="studio-raised rounded-full border px-2.5 py-0.5">
                {formatLabel(item.format)}
              </span>
              <span className="studio-raised rounded-full border px-2.5 py-0.5">
                {item.topicType}
              </span>
              <span className="studio-raised rounded-full border px-2.5 py-0.5 capitalize">
                {item.effortLevel} effort
              </span>
              {item.latestDraftVersion > 0 ? (
                <span className="font-mono-meta studio-raised rounded-full border px-2.5 py-0.5 text-[var(--text-primary)]">
                  v{item.latestDraftVersion}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCaptionAndTags}
              className="studio-btn-secondary inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-xs font-medium"
            >
              <Copy className="h-4 w-4" strokeWidth={1.5} />
              <span>Copy caption</span>
            </button>
            {isManager ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (window.confirm("Delete this content item permanently?")) {
                    void runAction(async () => {
                      await actions.deleteContentItem(item.id);
                      onBack();
                    });
                  }
                }}
                className="studio-raised inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium text-[var(--danger)] transition-colors hover:bg-[var(--bg-hover)]"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                <span>Delete</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Approved Idea -> Posted Progress Bar */}
        <WorkflowProgressBar status={item.status} />

        {/* Reference / Recreated Underline Tabs */}
        <div
          role="tablist"
          aria-label="Content workspace tabs"
          className="mt-5 flex gap-4 border-t border-[var(--border-subtle)] pt-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "reference"}
            onClick={() => setActiveTab("reference")}
            className={`inline-flex items-center gap-2 border-b-2 px-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "reference"
                ? "border-[var(--accent-text)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Link2 className="h-4 w-4" strokeWidth={1.5} />
            <span>Reference post</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "recreated"}
            onClick={() => setActiveTab("recreated")}
            className={`inline-flex items-center gap-2 border-b-2 px-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "recreated"
                ? "border-[var(--accent-text)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Film className="h-4 w-4" strokeWidth={1.5} />
            <span>Recreated post</span>
            {item.latestDraftVersion > 0 ? (
              <span className="font-mono-meta studio-raised rounded-full px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                v{item.latestDraftVersion}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "changes"}
            onClick={() => setActiveTab("changes")}
            className={`inline-flex items-center gap-2 border-b-2 px-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "changes"
                ? "border-[var(--accent-text)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
            <span>Changes requested</span>
            {item.status === "changes_requested" ? (
              <span className="rounded-full bg-[var(--pastel-rose)] px-2 py-0.5 text-[11px] font-medium text-[#dc2626]">
                Rework
              </span>
            ) : changesBadgeCount > 0 ? (
              <span className="font-mono-meta studio-raised rounded-full px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                {changesBadgeCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {notice ? (
        <div
          role="status"
          aria-live="polite"
          className="studio-surface rounded-lg border border-l-4 px-4 py-2.5 text-xs font-medium text-[var(--text-primary)]"
          style={{ borderLeftColor: "var(--positive)" }}
        >
          {notice}
        </div>
      ) : null}
      {errorMsg ? (
        <div
          role="alert"
          aria-live="polite"
          className="studio-surface rounded-lg border border-l-4 px-4 py-2.5 text-xs font-medium text-[var(--danger)]"
          style={{ borderLeftColor: "var(--danger)" }}
        >
          {errorMsg}
        </div>
      ) : null}

      {/* TAB 1: REFERENCE POST */}
      {activeTab === "reference" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-6">
            {item.status === "idea_pending" ? (
              <section
                className="studio-surface rounded-xl border border-l-4 p-5"
                style={{ borderLeftColor: "var(--warning)" }}
              >
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                  <span>Gate 1 · Idea approval</span>
                </div>
                {isManager ? (
                  <div className="space-y-3">
                    <p className="text-xs text-[var(--text-secondary)]">
                      Review the reference post on the right, then approve for production or park with feedback.
                    </p>
                    <div>
                      <label
                        htmlFor="gate1-feedback"
                        className="mb-1 block text-xs text-[var(--text-muted)]"
                      >
                        Manager note
                      </label>
                      <textarea
                        id="gate1-feedback"
                        rows={2}
                        value={gateFeedback}
                        onChange={(e) => setGateFeedback(e.target.value)}
                        placeholder="Optional direction for the team"
                        className="studio-input w-full rounded-lg border px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleGate1("approved_for_production")}
                        className="studio-btn-secondary inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-medium disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" strokeWidth={1.75} />
                        <span>Approve to recreate</span>
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleGate1("idea_rejected")}
                        className="studio-raised inline-flex h-9 items-center justify-center gap-1.5 rounded-full border px-4 text-xs font-medium text-[var(--danger)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
                      >
                        <X className="h-4 w-4" strokeWidth={1.5} />
                        <span>Park idea</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)]" strokeWidth={1.5} />
                    <span>
                      Waiting for the Marketing Manager to approve this idea before production begins.
                    </span>
                  </div>
                )}
              </section>
            ) : null}

            {item.status === "idea_rejected" ? (
              <section
                className="studio-surface rounded-xl border border-l-4 p-5 text-xs"
                style={{ borderLeftColor: "var(--danger)" }}
              >
                <p className="font-medium text-[var(--text-primary)]">
                  Idea parked by manager
                </p>
                {item.gate1Feedback ? (
                  <p className="mt-1 text-[var(--text-secondary)]">
                    {item.gate1Feedback}
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    runAction(
                      () => actions.resubmitIdea(item.id, "Updated and re-submitted"),
                      "Re-submitted for manager approval"
                    )
                  }
                  className="studio-btn-primary mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium"
                >
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span>Re-submit for Gate 1</span>
                </button>
              </section>
            ) : null}

            <form
              onSubmit={handleSaveDetails}
              className="studio-surface space-y-4 rounded-2xl border p-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Reference details and brief
                </h2>
                <button
                  type="submit"
                  disabled={busy}
                  className="studio-btn-accent h-8 rounded-full px-4 text-xs font-medium disabled:opacity-50"
                >
                  Save changes
                </button>
              </div>

              <div>
                <label
                  htmlFor="ref-title"
                  className="mb-1 block text-xs text-[var(--text-muted)]"
                >
                  Title / Hook
                </label>
                <input
                  id="ref-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="studio-input h-9 w-full rounded-lg border px-3 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="ref-format"
                    className="mb-1 block text-xs text-[var(--text-muted)]"
                  >
                    Format
                  </label>
                  <select
                    id="ref-format"
                    value={format}
                    onChange={(e) => setFormat(e.target.value as ContentFormat)}
                    className="studio-input h-9 w-full rounded-lg border px-2.5 text-sm"
                  >
                    {FORMAT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="ref-topic"
                    className="mb-1 block text-xs text-[var(--text-muted)]"
                  >
                    Topic
                  </label>
                  <select
                    id="ref-topic"
                    value={topicType}
                    onChange={(e) => setTopicType(e.target.value)}
                    className="studio-input h-9 w-full rounded-lg border px-2.5 text-sm"
                  >
                    {TOPIC_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="ref-effort"
                    className="mb-1 block text-xs text-[var(--text-muted)]"
                  >
                    Effort
                  </label>
                  <select
                    id="ref-effort"
                    value={effortLevel}
                    onChange={(e) => setEffortLevel(e.target.value as EffortLevel)}
                    className="studio-input h-9 w-full rounded-lg border px-2.5 text-sm"
                  >
                    <option value="low">Low effort</option>
                    <option value="high">High effort</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="ref-date"
                    className="mb-1 block text-xs text-[var(--text-muted)]"
                  >
                    Target post date
                  </label>
                  <input
                    id="ref-date"
                    type="date"
                    value={targetPostDate}
                    onChange={(e) => setTargetPostDate(e.target.value)}
                    className="studio-input h-9 w-full rounded-lg border px-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <span className="mb-1.5 block text-xs text-[var(--text-muted)]">
                  Assigned team
                </span>
                <div className="flex flex-wrap gap-2">
                  {TEAM_ASSIGNEE_OPTIONS.map((person) => {
                    const active = assignedTo.includes(person);
                    return (
                      <button
                        key={person}
                        type="button"
                        onClick={() => toggleAssignee(person)}
                        className={`h-8 rounded-full border px-3 text-xs capitalize transition-colors ${
                          active
                            ? "border-[var(--accent-border)] bg-[var(--accent)] font-medium text-[var(--accent-ink)]"
                            : "studio-surface text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                        }`}
                      >
                        {person}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="ref-url"
                  className="mb-1 block text-xs text-[var(--text-muted)]"
                >
                  Reference URL
                </label>
                <input
                  id="ref-url"
                  type="url"
                  spellCheck={false}
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  placeholder="https://www.instagram.com/reel/..."
                  className="studio-input h-9 w-full rounded-lg border px-3 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="ref-backup-url"
                  className="mb-1 block text-xs text-[var(--text-muted)]"
                >
                  Backup reference link (Drive or MP4)
                </label>
                <input
                  id="ref-backup-url"
                  type="url"
                  spellCheck={false}
                  value={referenceBackupUrl}
                  onChange={(e) => setReferenceBackupUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="studio-input h-9 w-full rounded-lg border px-3 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="ref-adaptation"
                  className="mb-1 block text-xs text-[var(--text-muted)]"
                >
                  Manan Wellness adaptation idea
                </label>
                <textarea
                  id="ref-adaptation"
                  rows={2}
                  value={adaptationIdea}
                  onChange={(e) => setAdaptationIdea(e.target.value)}
                  className="studio-input w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="ref-notes"
                  className="mb-1 block text-xs text-[var(--text-muted)]"
                >
                  Reference editing and audio notes
                </label>
                <textarea
                  id="ref-notes"
                  rows={2}
                  value={referenceNotes}
                  onChange={(e) => setReferenceNotes(e.target.value)}
                  className="studio-input w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="ref-cta"
                  className="mb-1 block text-xs text-[var(--text-muted)]"
                >
                  Call to action
                </label>
                <input
                  id="ref-cta"
                  type="text"
                  value={callToAction}
                  onChange={(e) => setCallToAction(e.target.value)}
                  className="studio-input h-9 w-full rounded-lg border px-3 text-sm"
                />
              </div>
            </form>
          </div>

          <div className="lg:col-span-6">
            <div className="lg:sticky lg:top-20">
              <VideoPlayerCard
                label="Reference post preview"
                url={referenceUrl}
                backupUrl={referenceBackupUrl}
                emptyHint="Paste an Instagram, YouTube, or Google Drive link on the left to preview it here."
                tall
              />
            </div>
          </div>
        </div>
      ) : activeTab === "recreated" ? (
        /* TAB 2: RECREATED POST */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-6">
            {item.status === "idea_pending" ? (
              <div
                className="studio-surface rounded-xl border border-l-4 p-4 text-xs text-[var(--text-secondary)]"
                style={{ borderLeftColor: "var(--warning)" }}
              >
                <strong className="font-medium text-[var(--text-primary)]">
                  Waiting on Gate 1:
                </strong>{" "}
                Once the Marketing Manager approves the Reference post, you can submit your recreated draft here.
              </div>
            ) : null}

            {item.status === "approved_for_production" ? (
              <div className="studio-surface flex flex-wrap items-center justify-between gap-2 rounded-xl border p-4">
                <div className="text-xs text-[var(--text-secondary)]">
                  <strong className="font-medium text-[var(--text-primary)]">
                    Approved for production
                  </strong>{" "}
                  — mark active while creating or submit a draft below.
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    runAction(
                      () => actions.startProduction(item.id),
                      "Moved to In production"
                    )
                  }
                  className="studio-btn-primary inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium"
                >
                  <Play className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span>Start production</span>
                </button>
              </div>
            ) : null}

            {/* Gate 2: Manager Final Video Review */}
            {item.status === "draft_review" ? (
              <section
                className="studio-surface rounded-2xl border border-l-4 p-5"
                style={{ borderLeftColor: "var(--accent-border)" }}
              >
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                  <span className="inline-block h-2 w-2 rounded-full bg-rose-400" />
                  <span>Gate 2 · Final review (v{item.latestDraftVersion})</span>
                </div>
                {isManager ? (
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="gate2-feedback"
                        className="mb-1 block text-xs text-[var(--text-muted)]"
                      >
                        Approval note or requested changes
                      </label>
                      <textarea
                        id="gate2-feedback"
                        rows={2}
                        value={gateFeedback}
                        onChange={(e) => setGateFeedback(e.target.value)}
                        placeholder="e.g. 0:08 adjust subtitle timing"
                        className="studio-input w-full rounded-xl border px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleGate2("approved_to_post")}
                        className="studio-btn-secondary inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-medium disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" strokeWidth={1.75} />
                        <span>Approve to post</span>
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleGate2("changes_requested")}
                        className="studio-raised inline-flex h-9 items-center justify-center gap-1.5 rounded-full border px-4 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
                        <span>Request changes</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)]" strokeWidth={1.5} />
                    <span>
                      Waiting for the Marketing Manager to review draft v{item.latestDraftVersion} before posting.
                    </span>
                  </div>
                )}
              </section>
            ) : null}

            {/* Ready to Post -> Posted */}
            {item.status === "approved_to_post" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!publishedUrl.trim()) return;
                  void runAction(
                    () => actions.markPosted(item.id, publishedUrl),
                    "Marked as posted"
                  );
                }}
                className="studio-surface space-y-2.5 rounded-xl border border-l-4 p-5"
                style={{ borderLeftColor: "var(--positive)" }}
              >
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  Approved to post
                </div>
                <label
                  htmlFor="published-ig-url"
                  className="block text-xs text-[var(--text-muted)]"
                >
                  Paste live social post URL after publishing
                </label>
                <div className="flex gap-2">
                  <input
                    id="published-ig-url"
                    type="url"
                    required
                    spellCheck={false}
                    value={publishedUrl}
                    onChange={(e) => setPublishedUrl(e.target.value)}
                    placeholder="https://www.instagram.com/reel/..."
                    className="studio-input h-9 min-w-0 flex-1 rounded-lg border px-3 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="studio-btn-secondary h-9 rounded-full px-4 text-xs font-medium disabled:opacity-50"
                  >
                    Mark posted
                  </button>
                </div>
              </form>
            ) : null}

            {item.status === "posted" && item.publishedUrl ? (
              <div
                className="studio-surface flex items-center justify-between gap-3 rounded-2xl border border-l-4 px-4 py-3 text-xs"
                style={{ borderLeftColor: "var(--positive)" }}
              >
                <span className="font-medium text-[var(--text-primary)]">
                  Published live
                </span>
                <a
                  href={item.publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-[var(--accent-text)] hover:underline"
                >
                  <span>View live post</span>
                  <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                </a>
              </div>
            ) : null}

            {/* Current Submitted Draft Card (shown after upload / submission) */}
            {item.latestDraftVersion > 0 ? (
              <section className="studio-surface space-y-3 rounded-2xl border p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={1.5} />
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                      Submitted draft (v{activeDraft?.version ?? item.latestDraftVersion})
                    </h2>
                    <span className="font-mono-meta studio-raised rounded-full border px-2 py-0.5 text-[10px] uppercase text-[var(--text-secondary)]">
                      {activeDraft?.draftKind ?? item.latestDraftKind ?? "video"}
                    </span>
                  </div>
                  {item.status === "draft_review" ||
                  (isManager && item.status === "approved_to_post") ? (
                    <button
                      type="button"
                      onClick={() => setReuploadOpen((prev) => !prev)}
                      className="studio-btn-secondary inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium"
                    >
                      <Upload className="h-3.5 w-3.5" strokeWidth={1.75} />
                      <span>
                        {reuploadOpen ? "Hide re-upload" : "Re-upload & submit"}
                      </span>
                    </button>
                  ) : null}
                </div>

                <div className="studio-raised rounded-xl border px-3.5 py-2.5 text-xs">
                  {activeDraft?.fileName || item.latestDraftName ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-[var(--text-primary)]">
                        {activeDraft?.fileName ?? item.latestDraftName}
                      </span>
                      <span className="text-[11px] text-[var(--positive)] font-medium">
                        Uploaded for review
                      </span>
                    </div>
                  ) : activeDraft?.videoUrl || item.latestDraftUrl ? (
                    <a
                      href={activeDraft?.videoUrl || item.latestDraftUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-[var(--accent-text)] hover:underline"
                    >
                      <span className="truncate">
                        {activeDraft?.videoUrl || item.latestDraftUrl}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                    </a>
                  ) : (
                    <span className="text-[var(--text-muted)]">
                      Loading submitted draft details...
                    </span>
                  )}
                  {activeDraft?.notes ? (
                    <p className="mt-1.5 text-[var(--text-secondary)]">
                      Notes: {activeDraft.notes}
                    </p>
                  ) : null}
                </div>
              </section>
            ) : null}

            {/* Submit / Re-upload Recreated Draft (Mutually Exclusive Video Link OR PDF/Image) */}
            {item.status === "approved_for_production" ||
            item.status === "in_production" ||
            item.status === "changes_requested" ||
            reuploadOpen ? (
              <form
                onSubmit={handleSubmitDraft}
                className="studio-surface space-y-4 rounded-2xl border p-5"
              >
                <div>
                  <h2 className="text-sm font-medium text-[var(--text-primary)]">
                    {reuploadOpen
                      ? `Re-upload & submit cut (v${item.latestDraftVersion + 1})`
                      : item.status === "changes_requested"
                        ? `Submit revised draft (v${item.latestDraftVersion + 1})`
                        : `Submit recreated post (v${item.latestDraftVersion + 1})`}
                  </h2>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    Provide either a video link or upload a PDF/image file. Adding one disables the other.
                  </p>
                </div>

                {item.status === "changes_requested" && item.gate2Feedback ? (
                  <div
                    className="studio-raised rounded-lg border border-l-4 px-3 py-2 text-xs text-[var(--text-secondary)]"
                    style={{ borderLeftColor: "var(--warning)" }}
                  >
                    <strong className="font-medium text-[var(--text-primary)]">
                      Manager suggestions:
                    </strong>{" "}
                    {item.gate2Feedback}
                  </div>
                ) : null}

                {/* Option 1: Video Link */}
                <div
                  className={`studio-raised space-y-2 rounded-lg border p-3.5 transition-opacity ${
                    hasUploadedFile ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="draft-video-url"
                      className="flex items-center gap-2 text-xs font-medium text-[var(--text-primary)]"
                    >
                      <Link2 className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={1.5} />
                      <span>Video link</span>
                    </label>
                    {hasVideoLink ? (
                      <button
                        type="button"
                        onClick={() => setDraftUrl("")}
                        className="inline-flex items-center gap-1 text-xs text-[var(--danger)] hover:underline"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <span>Clear</span>
                      </button>
                    ) : null}
                  </div>

                  <input
                    id="draft-video-url"
                    type="url"
                    spellCheck={false}
                    disabled={hasUploadedFile}
                    value={draftUrl}
                    onChange={(e) => setDraftUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="studio-input h-9 w-full rounded-lg border px-3 text-sm disabled:cursor-not-allowed"
                  />
                  {hasUploadedFile ? (
                    <p className="text-xs text-[var(--text-muted)]">
                      Disabled while a PDF/image is selected. Remove the file to paste a link.
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                  <span>OR</span>
                  <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                </div>

                {/* Option 2: Upload PDF or Image */}
                <div
                  className={`studio-raised space-y-2 rounded-lg border p-3.5 transition-opacity ${
                    hasVideoLink ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="draft-file-upload"
                      className="flex items-center gap-2 text-xs font-medium text-[var(--text-primary)]"
                    >
                      <Upload className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={1.5} />
                      <span>Upload PDF or image</span>
                    </label>
                    {hasUploadedFile ? (
                      <button
                        type="button"
                        onClick={handleClearFile}
                        className="inline-flex items-center gap-1 text-xs text-[var(--danger)] hover:underline"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <span>Remove</span>
                      </button>
                    ) : null}
                  </div>

                  <input
                    ref={fileInputRef}
                    id="draft-file-upload"
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp,image/gif,.pdf,.png,.jpg,.jpeg,.webp"
                    disabled={hasVideoLink || fileBusy}
                    onChange={handleFileChange}
                    className="studio-input block w-full cursor-pointer rounded-lg border px-3 py-2 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-[var(--bg-raised)] file:px-3 file:py-1 file:text-xs file:font-medium file:text-[var(--text-primary)] disabled:cursor-not-allowed"
                  />

                  {fileBusy ? (
                    <p className="text-xs text-[var(--text-muted)]">
                      Preparing file preview
                    </p>
                  ) : preparedFile ? (
                    <div className="studio-surface flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
                      <FileText className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={1.5} />
                      <span className="truncate font-medium text-[var(--text-primary)]">
                        {preparedFile.fileName}
                      </span>
                      <span className="font-mono-meta studio-raised rounded px-1.5 py-0.5 text-[10px] uppercase text-[var(--text-secondary)]">
                        {preparedFile.draftKind}
                      </span>
                    </div>
                  ) : hasVideoLink ? (
                    <p className="text-xs text-[var(--text-muted)]">
                      Disabled while a video link is entered. Clear the link to upload a file.
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)]">
                      Supports PNG, JPG, WEBP, and PDF up to 650 KB
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="draft-notes"
                    className="mb-1 block text-xs text-[var(--text-muted)]"
                  >
                    Notes for manager (optional)
                  </label>
                  <input
                    id="draft-notes"
                    type="text"
                    value={draftNotes}
                    onChange={(e) => setDraftNotes(e.target.value)}
                    placeholder="Changes made in this cut"
                    className="studio-input h-9 w-full rounded-lg border px-3 text-sm"
                  />
                </div>

                {errorMsg ? (
                  <div
                    role="alert"
                    className="studio-raised rounded-lg border border-l-4 px-3 py-2 text-xs font-medium text-[var(--danger)]"
                    style={{ borderLeftColor: "var(--danger)" }}
                  >
                    {errorMsg}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={busy || fileBusy || (!hasVideoLink && !hasUploadedFile)}
                  className="studio-btn-accent inline-flex h-9 w-full items-center justify-center gap-2 rounded-full px-4 text-xs font-medium disabled:opacity-50"
                >
                  <Send className="h-4 w-4" strokeWidth={1.5} />
                  <span>
                    {reuploadOpen
                      ? `Re-upload & submit v${item.latestDraftVersion + 1} for review`
                      : "Submit for final review (Gate 2)"}
                  </span>
                </button>
              </form>
            ) : null}

            {/* Script & Hashtags */}
            <form
              onSubmit={handleSaveDetails}
              className="studio-surface space-y-3 rounded-2xl border p-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Recreated script and hashtags
                </h2>
                <button
                  type="submit"
                  disabled={busy}
                  className="studio-btn-accent h-8 rounded-full px-4 text-xs font-medium disabled:opacity-50"
                >
                  Save script
                </button>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor="rec-script-url"
                    className="text-xs text-[var(--text-muted)]"
                  >
                    Google Doc script link
                  </label>
                  {scriptUrl ? (
                    <a
                      href={scriptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-text)] hover:underline"
                    >
                      <span>Open doc</span>
                      <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </a>
                  ) : null}
                </div>
                <input
                  id="rec-script-url"
                  type="url"
                  spellCheck={false}
                  value={scriptUrl}
                  onChange={(e) => setScriptUrl(e.target.value)}
                  placeholder="https://docs.google.com/document/d/..."
                  className="studio-input h-9 w-full rounded-lg border px-3 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="rec-script-text"
                  className="mb-1 block text-xs text-[var(--text-muted)]"
                >
                  Inline script / talking points
                </label>
                <textarea
                  id="rec-script-text"
                  rows={3}
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="Hook, lines, or scene breakdown"
                  className="studio-input w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="rec-hashtags"
                  className="mb-1 block text-xs text-[var(--text-muted)]"
                >
                  Hashtags
                </label>
                <textarea
                  id="rec-hashtags"
                  rows={2}
                  value={hashtagsText}
                  onChange={(e) => setHashtagsText(e.target.value)}
                  className="studio-input w-full rounded-lg border px-3 py-2 text-xs"
                />
                {hashtagPresets.length > 0 ? (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-[var(--text-muted)]">Presets:</span>
                    {hashtagPresets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset.tags)}
                        className="studio-raised rounded-md border px-2 py-0.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                      >
                        + {preset.category}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </form>

            {/* Feedback & Comments */}
            <section className="studio-surface rounded-2xl border p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <MessageSquare className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={1.5} />
                <span>Feedback and approval timeline</span>
              </div>

              <div className="mb-3 max-h-60 space-y-2 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">
                    No comments or approval events yet
                  </p>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className="studio-raised rounded-xl border px-3 py-2.5 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                          <span>{c.authorName}</span>
                          <span className="studio-surface rounded-full border px-2 py-0.5 text-[10px] capitalize text-[var(--text-muted)]">
                            {c.authorRole}
                          </span>
                          {c.draftVersion ? (
                            <span className="font-mono-meta text-[11px] text-[var(--text-secondary)]">
                              v{c.draftVersion}
                            </span>
                          ) : null}
                          {c.timestampLabel ? (
                            <span className="font-mono-meta text-[11px] text-[var(--accent-text)]">
                              @{c.timestampLabel}
                            </span>
                          ) : null}
                        </div>
                        <span className="text-[11px] capitalize text-[var(--text-muted)]">
                          {c.actionType.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-[var(--text-secondary)]">
                        {c.body}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex flex-wrap gap-2">
                <input
                  type="text"
                  aria-label="Video timestamp"
                  value={timestampLabel}
                  onChange={(e) => setTimestampLabel(e.target.value)}
                  placeholder="0:12"
                  className="studio-input font-mono-meta h-9 w-20 rounded-lg border px-2.5 text-xs"
                />
                <input
                  type="text"
                  aria-label="Comment message"
                  required
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add note or feedback"
                  className="studio-input h-9 min-w-0 flex-1 rounded-lg border px-3 text-xs"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="studio-btn-primary h-9 rounded-lg px-3.5 text-xs font-medium disabled:opacity-50"
                >
                  Post
                </button>
              </form>
            </section>
          </div>

          <div className="space-y-3 lg:col-span-6">
            <div className="space-y-3 lg:sticky lg:top-20">
              {drafts.length > 0 ? (
                <div className="studio-surface flex flex-wrap items-center gap-2 rounded-2xl border px-3.5 py-2.5">
                  <History className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={1.5} />
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    Versions
                  </span>
                  {drafts.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedVersion(d.version)}
                      className={`font-mono-meta h-7 rounded-full px-3 text-xs font-medium transition-colors ${
                        (activeDraft?.version ?? item.latestDraftVersion) === d.version
                          ? "studio-btn-accent"
                          : "studio-raised border text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                      }`}
                    >
                      v{d.version}
                    </button>
                  ))}
                </div>
              ) : null}

              <DraftPreviewCard
                label={
                  stagedPreviewDraft
                    ? `Unsaved preview (v${item.latestDraftVersion + 1})`
                    : activeDraft
                      ? `Recreated draft (v${activeDraft.version})`
                      : "Recreated post preview"
                }
                draft={stagedPreviewDraft ?? activeDraft}
                fallbackVideoUrl={item.latestDraftUrl}
                emptyHint={
                  item.latestDraftVersion > 0 && !activeDraft
                    ? "Loading submitted draft preview..."
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      ) : (
        /* TAB 3: CHANGES REQUESTED */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-6">
            {/* Active Manager Change Request Card */}
            {item.status === "changes_requested" ? (
              <section className="rounded-2xl bg-[var(--pastel-rose)] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                      <span className="inline-block h-2 w-2 rounded-full bg-[#dc2626]" />
                      <span>Changes requested by Manager (v{item.latestDraftVersion || 1})</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">
                      {item.gate2Feedback || "Manager requested revisions before posting."}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab("recreated")}
                    className="studio-btn-secondary inline-flex h-9 items-center gap-2 rounded-full px-4 text-xs font-medium"
                  >
                    <Upload className="h-3.5 w-3.5" strokeWidth={1.75} />
                    <span>Upload revised draft in Recreated post</span>
                  </button>
                </div>
              </section>
            ) : item.status === "idea_rejected" ? (
              <section className="rounded-2xl bg-[var(--pastel-rose)] p-5">
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  Idea parked at Gate 1
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-xs text-[var(--text-secondary)]">
                  {item.gate1Feedback || "Manager parked this idea at Gate 1."}
                </p>
              </section>
            ) : (
              <section className="studio-surface rounded-2xl border p-5">
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  No open change requests
                </div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {item.gate2Feedback
                    ? `Latest review note: ${item.gate2Feedback}`
                    : "When the Manager requests changes on a submitted cut, feedback and timestamped notes appear here."}
                </p>
              </section>
            )}

            {/* Manager Action Box inside Changes Requested tab when reviewing a draft */}
            {isManager && item.status === "draft_review" ? (
              <section className="studio-surface space-y-3 rounded-2xl border p-5">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Request changes on draft v{item.latestDraftVersion || 1}
                </h2>
                <div>
                  <label
                    htmlFor="changes-tab-feedback"
                    className="mb-1 block text-xs text-[var(--text-muted)]"
                  >
                    Revision instructions for team
                  </label>
                  <textarea
                    id="changes-tab-feedback"
                    rows={3}
                    value={gateFeedback}
                    onChange={(e) => setGateFeedback(e.target.value)}
                    placeholder="e.g. 0:08 tighten caption contrast and swap background audio"
                    className="studio-input w-full rounded-xl border px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleGate2("changes_requested")}
                    className="studio-btn-accent inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-medium disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
                    <span>Send change request</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleGate2("approved_to_post")}
                    className="studio-btn-secondary inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-medium disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" strokeWidth={1.75} />
                    <span>Approve to post</span>
                  </button>
                </div>
              </section>
            ) : null}

            {/* Revision Notes & Timestamped Feedback Thread */}
            <section className="studio-surface rounded-2xl border p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <MessageSquare className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={1.5} />
                  <span>Change request history &amp; notes</span>
                </div>
                <span className="font-mono-meta text-xs text-[var(--text-muted)]">
                  {revisionComments.length}
                </span>
              </div>

              <div className="mb-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                {revisionComments.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">
                    No revision comments or change requests logged yet.
                  </p>
                ) : (
                  revisionComments.map((c) => (
                    <div
                      key={c.id}
                      className={`rounded-xl border px-3.5 py-2.5 text-xs ${
                        c.actionType === "gate2_request_changes" || c.actionType === "gate1_reject"
                          ? "border-[var(--accent-border)] bg-[var(--pastel-cream)]"
                          : "studio-raised"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                          <span>{c.authorName}</span>
                          <span className="studio-surface rounded-full border px-2 py-0.5 text-[10px] capitalize text-[var(--text-muted)]">
                            {c.authorRole}
                          </span>
                          {c.draftVersion ? (
                            <span className="font-mono-meta text-[11px] text-[var(--text-secondary)]">
                              v{c.draftVersion}
                            </span>
                          ) : null}
                          {c.timestampLabel ? (
                            <span className="font-mono-meta text-[11px] font-semibold text-[var(--accent-text)]">
                              @{c.timestampLabel}
                            </span>
                          ) : null}
                        </div>
                        <span className="text-[11px] capitalize text-[var(--text-muted)]">
                          {c.actionType === "gate2_request_changes"
                            ? "Changes requested"
                            : c.actionType === "gate1_reject"
                              ? "Idea parked"
                              : "Comment"}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-[var(--text-secondary)]">
                        {c.body}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex flex-wrap gap-2">
                <input
                  type="text"
                  aria-label="Video timestamp"
                  value={timestampLabel}
                  onChange={(e) => setTimestampLabel(e.target.value)}
                  placeholder="0:12"
                  className="studio-input font-mono-meta h-9 w-20 rounded-xl border px-2.5 text-xs"
                />
                <input
                  type="text"
                  aria-label="Revision note"
                  required
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add timestamped change note"
                  className="studio-input h-9 min-w-0 flex-1 rounded-xl border px-3 text-xs"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="studio-btn-accent h-9 rounded-full px-4 text-xs font-medium disabled:opacity-50"
                >
                  Post note
                </button>
              </form>
            </section>
          </div>

          <div className="space-y-3 lg:col-span-6">
            <div className="space-y-3 lg:sticky lg:top-20">
              {drafts.length > 0 ? (
                <div className="studio-surface flex flex-wrap items-center gap-2 rounded-2xl border px-3.5 py-2.5">
                  <History className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={1.5} />
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    Versions
                  </span>
                  {drafts.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedVersion(d.version)}
                      className={`font-mono-meta h-7 rounded-full px-3 text-xs font-medium transition-colors ${
                        (activeDraft?.version ?? item.latestDraftVersion) === d.version
                          ? "studio-btn-accent"
                          : "studio-raised border text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                      }`}
                    >
                      v{d.version}
                    </button>
                  ))}
                </div>
              ) : null}

              <DraftPreviewCard
                label={
                  activeDraft
                    ? `Draft under review (v${activeDraft.version})`
                    : "Recreated post preview"
                }
                draft={activeDraft}
                fallbackVideoUrl={item.latestDraftUrl}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
