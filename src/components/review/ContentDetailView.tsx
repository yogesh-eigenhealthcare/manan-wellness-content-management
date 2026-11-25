"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
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
  Sparkles,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { DraftPreviewCard } from "@/components/video/DraftPreviewCard";
import { VideoPlayerCard } from "@/components/video/VideoPlayerCard";
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

type DetailTab = "reference" | "recreated";

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
    item.status === "draft_review" ||
      item.status === "changes_requested" ||
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

  const [gateFeedback, setGateFeedback] = useState("");
  const [publishedUrl, setPublishedUrl] = useState(item.publishedUrl ?? "");
  const [commentText, setCommentText] = useState("");
  const [timestampLabel, setTimestampLabel] = useState("");

  // Editable brief & script fields
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
    setSelectedVersion(item.latestDraftVersion || null);
    setDraftUrl("");
    setPreparedFile(null);
    setDraftNotes("");
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
    setNotice(null);
    setErrorMsg(null);
  }, [item]);

  const statusMeta = STATUS_META[item.status];
  const activeDraft =
    drafts.find((d) => d.version === selectedVersion) ?? drafts[0] ?? null;

  const hasVideoLink = Boolean(draftUrl.trim());
  const hasUploadedFile = Boolean(preparedFile);

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
      setErrorMsg(err instanceof Error ? err.message : "Action failed.");
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
      "Saved project details."
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
      setErrorMsg(err instanceof Error ? err.message : "Could not load file.");
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
    }, `Submitted draft v${item.latestDraftVersion + 1} for Manager approval.`);
  };

  const handleGate1 = async (decision: "approved_for_production" | "idea_rejected") => {
    if (decision === "idea_rejected" && !gateFeedback.trim()) {
      setErrorMsg("Please write a short reason when declining an idea.");
      return;
    }
    await runAction(async () => {
      await actions.reviewGate1(item.id, decision, gateFeedback, {
        assignedTo,
        effortLevel,
      });
      setGateFeedback("");
    }, decision === "approved_for_production" ? "Approved for production." : "Idea parked.");
  };

  const handleGate2 = async (decision: "approved_to_post" | "changes_requested") => {
    if (decision === "changes_requested" && !gateFeedback.trim()) {
      setErrorMsg("Please add suggestions for the team before requesting changes.");
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
    }, decision === "approved_to_post" ? "Approved to post!" : "Sent back for revisions.");
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
    setNotice("Copied title, CTA, and hashtags to clipboard.");
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
      {/* Project Header Bar */}
      <div className="studio-surface rounded-2xl border p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to {backLabel}
            </button>

            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              #{item.serialNo} · {item.title}
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusMeta.badgeClass}`}
              >
                {statusMeta.label}
              </span>
              <span className="studio-muted rounded-full border px-2.5 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
                {formatLabel(item.format)}
              </span>
              <span className="studio-muted rounded-full border px-2.5 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
                {item.topicType}
              </span>
              <span className="studio-muted rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize text-[var(--text-secondary)]">
                {item.effortLevel} effort
              </span>
              {item.latestDraftVersion > 0 ? (
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
                  Draft v{item.latestDraftVersion}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCaptionAndTags}
              className="studio-surface inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            >
              <Copy className="h-3.5 w-3.5" /> Copy Caption &amp; Tags
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
                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            ) : null}
          </div>
        </div>

        {/* Two Project Tabs: Reference vs Recreated */}
        <div
          role="tablist"
          aria-label="Content workspace tabs"
          className="mt-5 flex gap-2 border-t border-[var(--border-subtle)] pt-3"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "reference"}
            onClick={() => setActiveTab("reference")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "reference"
                ? "bg-teal-600 text-white shadow-xs"
                : "studio-muted text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            <Link2 className="h-3.5 w-3.5" />
            Reference Post
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "recreated"}
            onClick={() => setActiveTab("recreated")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "recreated"
                ? "bg-teal-600 text-white shadow-xs"
                : "studio-muted text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            <Film className="h-3.5 w-3.5" />
            Recreated Post
            {item.latestDraftVersion > 0 ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeTab === "recreated"
                    ? "bg-white/20 text-white"
                    : "bg-purple-100 text-purple-800"
                }`}
              >
                v{item.latestDraftVersion}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {notice ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800"
        >
          {notice}
        </div>
      ) : null}
      {errorMsg ? (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-800"
        >
          {errorMsg}
        </div>
      ) : null}

      {/* TAB 1: REFERENCE POST (Left: Contents | Right: Live Preview) */}
      {activeTab === "reference" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT HALF: Reference Details & Gate 1 */}
          <div className="space-y-5 lg:col-span-6">
            {/* Gate 1: Manager Idea Approval */}
            {item.status === "idea_pending" ? (
              <div className="rounded-2xl border border-amber-300/60 bg-amber-50/90 p-5 text-amber-950">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  Gate 1: Marketing Manager Idea Approval
                </div>
                {isManager ? (
                  <div className="space-y-3">
                    <p className="text-xs text-amber-900">
                      Review the reference post preview on the right. Approve to let the team recreate it, or park with feedback.
                    </p>
                    <div>
                      <label
                        htmlFor="gate1-feedback"
                        className="mb-1 block text-xs font-medium text-amber-900"
                      >
                        Manager Note / Direction
                      </label>
                      <textarea
                        id="gate1-feedback"
                        rows={2}
                        value={gateFeedback}
                        onChange={(e) => setGateFeedback(e.target.value)}
                        placeholder="e.g. Approved for Dr. Pragati in Hindi, keep under 40s"
                        className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-slate-900"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleGate1("approved_for_production")}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Approve to Recreate
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleGate1("idea_rejected")}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" /> Decline / Park
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-xs text-amber-900">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <span>
                      Waiting for the <strong>Marketing Manager</strong> to approve this reference idea before production starts.
                    </span>
                  </div>
                )}
              </div>
            ) : null}

            {item.status === "idea_rejected" ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-xs text-rose-900">
                <p className="font-semibold">Idea Parked by Manager</p>
                {item.gate1Feedback ? (
                  <p className="mt-1 text-rose-800">{item.gate1Feedback}</p>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    runAction(
                      () => actions.resubmitIdea(item.id, "Updated and re-submitted."),
                      "Re-submitted for Manager approval."
                    )
                  }
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Re-submit for Gate 1 Approval
                </button>
              </div>
            ) : null}

            <form
              onSubmit={handleSaveDetails}
              className="studio-surface space-y-4 rounded-2xl border p-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Reference Post Contents &amp; Brief
                </h3>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>

              <div>
                <label
                  htmlFor="ref-title"
                  className="mb-1 block text-xs font-medium text-[var(--text-muted)]"
                >
                  Title / Hook
                </label>
                <input
                  id="ref-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="studio-input w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="ref-format"
                    className="mb-1 block text-xs font-medium text-[var(--text-muted)]"
                  >
                    Format
                  </label>
                  <select
                    id="ref-format"
                    value={format}
                    onChange={(e) => setFormat(e.target.value as ContentFormat)}
                    className="studio-input w-full rounded-lg border px-2.5 py-2 text-sm"
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
                    className="mb-1 block text-xs font-medium text-[var(--text-muted)]"
                  >
                    Topic
                  </label>
                  <select
                    id="ref-topic"
                    value={topicType}
                    onChange={(e) => setTopicType(e.target.value)}
                    className="studio-input w-full rounded-lg border px-2.5 py-2 text-sm"
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
                    className="mb-1 block text-xs font-medium text-[var(--text-muted)]"
                  >
                    Effort
                  </label>
                  <select
                    id="ref-effort"
                    value={effortLevel}
                    onChange={(e) => setEffortLevel(e.target.value as EffortLevel)}
                    className="studio-input w-full rounded-lg border px-2.5 py-2 text-sm"
                  >
                    <option value="low">Low effort</option>
                    <option value="high">High effort</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="ref-date"
                    className="mb-1 block text-xs font-medium text-[var(--text-muted)]"
                  >
                    Target Post Date
                  </label>
                  <input
                    id="ref-date"
                    type="date"
                    value={targetPostDate}
                    onChange={(e) => setTargetPostDate(e.target.value)}
                    className="studio-input w-full rounded-lg border px-2.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                  Assigned Team
                </span>
                <div className="flex flex-wrap gap-2">
                  {TEAM_ASSIGNEE_OPTIONS.map((person) => {
                    const active = assignedTo.includes(person);
                    return (
                      <button
                        key={person}
                        type="button"
                        onClick={() => toggleAssignee(person)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${
                          active
                            ? "border-teal-600 bg-teal-50 text-teal-800"
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
                  className="mb-1 block text-xs font-medium text-[var(--text-muted)]"
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
                  className="studio-input w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="ref-backup-url"
                  className="mb-1 block text-xs font-medium text-[var(--text-muted)]"
                >
                  Backup Reference Video Link (Drive / MP4 if IG won&apos;t embed)
                </label>
                <input
                  id="ref-backup-url"
                  type="url"
                  spellCheck={false}
                  value={referenceBackupUrl}
                  onChange={(e) => setReferenceBackupUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/.../view"
                  className="studio-input w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="ref-adaptation"
                  className="mb-1 block text-xs font-medium text-[var(--text-muted)]"
                >
                  Manan Wellness Adaptation Idea
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
                  className="mb-1 block text-xs font-medium text-[var(--text-muted)]"
                >
                  Reference Editing / Audio Notes
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
                  className="mb-1 block text-xs font-medium text-[var(--text-muted)]"
                >
                  Call to Action
                </label>
                <input
                  id="ref-cta"
                  type="text"
                  value={callToAction}
                  onChange={(e) => setCallToAction(e.target.value)}
                  className="studio-input w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
            </form>
          </div>

          {/* RIGHT HALF: Reference Post Preview */}
          <div className="lg:col-span-6">
            <div className="lg:sticky lg:top-6">
              <VideoPlayerCard
                label="Reference Post Preview"
                url={referenceUrl}
                backupUrl={referenceBackupUrl}
                emptyHint="No reference URL attached yet. Paste an Instagram, YouTube, or Google Drive link on the left to preview it here."
                tall
              />
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: RECREATED POST (Left: Contents & Submission | Right: Live Preview) */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT HALF: Recreated Submission, Script, Gate 2, Comments */}
          <div className="space-y-5 lg:col-span-6">
            {item.status === "idea_pending" ? (
              <div className="rounded-2xl border border-amber-300/60 bg-amber-50/90 p-4 text-xs text-amber-900">
                <strong>Waiting on Gate 1:</strong> Once the Marketing Manager approves the Reference Post, you can submit your recreated draft here.
              </div>
            ) : null}

            {item.status === "approved_for_production" ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-900">
                <div className="text-xs">
                  <strong>Idea Approved!</strong> Mark as In Production while creating, or submit your draft below.
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    runAction(
                      () => actions.startProduction(item.id),
                      "Moved to In Production."
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
                >
                  <Play className="h-3.5 w-3.5" /> Start Production
                </button>
              </div>
            ) : null}

            {/* Gate 2: Manager Final Video Review */}
            {item.status === "draft_review" ? (
              <div className="rounded-2xl border border-purple-200 bg-purple-50/90 p-5 text-purple-950">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  Gate 2: Manager Final Review (v{item.latestDraftVersion})
                </div>
                {isManager ? (
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="gate2-feedback"
                        className="mb-1 block text-xs font-medium text-purple-950"
                      >
                        Approval Note or Requested Changes
                      </label>
                      <textarea
                        id="gate2-feedback"
                        rows={2}
                        value={gateFeedback}
                        onChange={(e) => setGateFeedback(e.target.value)}
                        placeholder="e.g. 0:08 fix caption typo, rest looks great!"
                        className="w-full rounded-lg border border-purple-300 bg-white px-3 py-2 text-sm text-slate-900"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleGate2("approved_to_post")}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Approve to Post
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleGate2("changes_requested")}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-orange-300 bg-white px-3 py-2 text-xs font-semibold text-orange-800 hover:bg-orange-50 disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4" /> Request Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-xs text-purple-900">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" />
                    <span>
                      Waiting for the <strong>Marketing Manager</strong> to review draft v{item.latestDraftVersion} and approve before posting.
                    </span>
                  </div>
                )}
              </div>
            ) : null}

            {/* Publishing: Approved to Post -> Posted */}
            {item.status === "approved_to_post" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!publishedUrl.trim()) return;
                  void runAction(
                    () => actions.markPosted(item.id, publishedUrl),
                    "Marked as Posted!"
                  );
                }}
                className="space-y-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5 text-emerald-950"
              >
                <div className="text-sm font-semibold">
                  Approved &amp; Ready to Post
                </div>
                <label
                  htmlFor="published-ig-url"
                  className="block text-xs font-medium text-emerald-900"
                >
                  Paste Live Social Post URL after publishing
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
                    className="min-w-0 flex-1 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Mark Posted
                  </button>
                </div>
              </form>
            ) : null}

            {item.status === "posted" && item.publishedUrl ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-xs text-teal-900">
                <span>
                  <strong>Published live!</strong>
                </span>
                <a
                  href={item.publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-teal-700 underline"
                >
                  View Live Post <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ) : null}

            {/* Submit Recreated Draft (Mutually Exclusive: Video Link OR Upload PDF/Image) */}
            {item.status === "approved_for_production" ||
            item.status === "in_production" ||
            item.status === "changes_requested" ? (
              <form
                onSubmit={handleSubmitDraft}
                className="studio-surface space-y-4 rounded-2xl border p-5"
              >
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {item.status === "changes_requested"
                      ? `Submit Revised Recreated Draft (v${item.latestDraftVersion + 1})`
                      : `Submit Recreated Post (v${item.latestDraftVersion + 1})`}
                  </h3>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    Provide <strong>either</strong> a video link <strong>or</strong> upload a PDF/image file. Adding one locks the other.
                  </p>
                </div>

                {item.status === "changes_requested" && item.gate2Feedback ? (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-900">
                    <strong>Manager Suggestions:</strong> {item.gate2Feedback}
                  </div>
                ) : null}

                {/* Option 1: Video Link */}
                <div
                  className={`studio-muted space-y-2 rounded-xl border p-3.5 transition ${
                    hasUploadedFile ? "opacity-55" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="draft-video-url"
                      className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]"
                    >
                      <Link2 className="h-3.5 w-3.5 text-teal-600" />
                      Option 1: Paste Video Link
                    </label>
                    {hasVideoLink ? (
                      <button
                        type="button"
                        onClick={() => setDraftUrl("")}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:underline"
                      >
                        <X className="h-3 w-3" /> Clear Link
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
                    placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                    className="studio-input w-full rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed"
                  />
                  {hasUploadedFile ? (
                    <p className="text-[11px] text-amber-600">
                      Video link is disabled because a PDF/image is selected below. Remove the file to paste a video link.
                    </p>
                  ) : null}
                </div>

                {/* Option 2: Upload PDF or Image */}
                <div
                  className={`studio-muted space-y-2 rounded-xl border p-3.5 transition ${
                    hasVideoLink ? "opacity-55" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="draft-file-upload"
                      className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]"
                    >
                      <Upload className="h-3.5 w-3.5 text-sky-600" />
                      Option 2: Upload PDF or Image
                    </label>
                    {hasUploadedFile ? (
                      <button
                        type="button"
                        onClick={handleClearFile}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:underline"
                      >
                        <X className="h-3 w-3" /> Remove File
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
                    className="studio-input block w-full cursor-pointer rounded-lg border px-3 py-2 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-teal-600 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-teal-700 disabled:cursor-not-allowed"
                  />

                  {fileBusy ? (
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Preparing file preview...
                    </p>
                  ) : preparedFile ? (
                    <div className="studio-surface flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
                      <FileText className="h-4 w-4 text-teal-600" />
                      <span className="truncate font-medium text-[var(--text-primary)]">
                        {preparedFile.fileName}
                      </span>
                      <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-teal-800">
                        {preparedFile.draftKind}
                      </span>
                    </div>
                  ) : hasVideoLink ? (
                    <p className="text-[11px] text-amber-600">
                      File upload is disabled because a video link was entered above. Clear the video link to upload a PDF/image.
                    </p>
                  ) : (
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Supports PNG, JPG, WEBP (auto-compressed) and PDF (up to 650 KB).
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="draft-notes"
                    className="mb-1 block text-xs font-medium text-[var(--text-muted)]"
                  >
                    Notes for Manager (optional)
                  </label>
                  <input
                    id="draft-notes"
                    type="text"
                    value={draftNotes}
                    onChange={(e) => setDraftNotes(e.target.value)}
                    placeholder="e.g. Updated subtitles & lowered BGM as suggested"
                    className="studio-input w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy || fileBusy || (!hasVideoLink && !hasUploadedFile)}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" /> Submit for Manager Final Review (Gate 2)
                </button>
              </form>
            ) : null}

            {/* Script & Hashtags Card */}
            <form
              onSubmit={handleSaveDetails}
              className="studio-surface space-y-3 rounded-2xl border p-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Recreated Script &amp; Hashtags
                </h3>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  Save Script
                </button>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor="rec-script-url"
                    className="text-xs font-medium text-[var(--text-muted)]"
                  >
                    Google Doc Script Link
                  </label>
                  {scriptUrl ? (
                    <a
                      href={scriptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:underline"
                    >
                      Open Doc <ExternalLink className="h-3 w-3" />
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
                  className="studio-input w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="rec-script-text"
                  className="mb-1 block text-xs font-medium text-[var(--text-muted)]"
                >
                  Inline Script / Talking Points
                </label>
                <textarea
                  id="rec-script-text"
                  rows={3}
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="Write hook, lines, or scene breakdown..."
                  className="studio-input w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="rec-hashtags"
                  className="mb-1 block text-xs font-medium text-[var(--text-muted)]"
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
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-[var(--text-muted)]">Presets:</span>
                    {hashtagPresets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset.tags)}
                        className="studio-muted rounded-md border px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] hover:border-teal-500"
                      >
                        + {preset.category}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </form>

            {/* Feedback & Comments */}
            <div className="studio-surface rounded-2xl border p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                <MessageSquare className="h-4 w-4 text-[var(--text-muted)]" />
                Feedback &amp; Approval Timeline
              </div>

              <div className="mb-3 max-h-60 space-y-2.5 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">
                    No comments or approval events yet.
                  </p>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className="studio-muted rounded-lg border px-3 py-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                          <span>{c.authorName}</span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] uppercase ${
                              c.authorRole === "manager"
                                ? "bg-teal-100 text-teal-800"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {c.authorRole}
                          </span>
                          {c.draftVersion ? (
                            <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] text-purple-800">
                              v{c.draftVersion}
                            </span>
                          ) : null}
                          {c.timestampLabel ? (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] text-amber-900">
                              @{c.timestampLabel}
                            </span>
                          ) : null}
                        </div>
                        <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
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
                  className="studio-input w-20 rounded-lg border px-2.5 py-2 text-xs"
                />
                <input
                  type="text"
                  aria-label="Comment message"
                  required
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add note or feedback..."
                  className="studio-input min-w-0 flex-1 rounded-lg border px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  Post
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT HALF: Recreated Draft Preview */}
          <div className="space-y-3 lg:col-span-6">
            <div className="space-y-3 lg:sticky lg:top-6">
              {drafts.length > 0 ? (
                <div className="studio-surface flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2">
                  <History className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    Draft Versions:
                  </span>
                  {drafts.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedVersion(d.version)}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                        (activeDraft?.version ?? item.latestDraftVersion) === d.version
                          ? "bg-purple-600 text-white"
                          : "studio-muted border text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
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
                    ? `Recreated Draft (v${activeDraft.version})`
                    : "Recreated Post Preview"
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
