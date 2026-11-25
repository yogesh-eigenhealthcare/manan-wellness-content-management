"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  History,
  MessageSquare,
  Play,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { VideoPlayerCard } from "@/components/video/VideoPlayerCard";
import { useAuth } from "@/contexts/AuthContext";
import { useItemSubcollections } from "@/hooks/useContentItems";
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

interface SideBySideReviewDrawerProps {
  item: ContentItem | null;
  hashtagPresets: HashtagPreset[];
  onClose: () => void;
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

export function SideBySideReviewDrawer({
  item,
  hashtagPresets,
  onClose,
  actions,
}: SideBySideReviewDrawerProps) {
  const { isManager } = useAuth();
  const { drafts, comments } = useItemSubcollections(item?.id ?? null);

  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [draftUrl, setDraftUrl] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [gateFeedback, setGateFeedback] = useState("");
  const [publishedUrl, setPublishedUrl] = useState("");
  const [commentText, setCommentText] = useState("");
  const [timestampLabel, setTimestampLabel] = useState("");

  // Editable production fields
  const [title, setTitle] = useState("");
  const [format, setFormat] = useState<ContentFormat>("reel");
  const [topicType, setTopicType] = useState("General");
  const [effortLevel, setEffortLevel] = useState<EffortLevel>("general");
  const [referenceBackupUrl, setReferenceBackupUrl] = useState("");
  const [adaptationIdea, setAdaptationIdea] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [scriptUrl, setScriptUrl] = useState("");
  const [scriptText, setScriptText] = useState("");
  const [hashtagsText, setHashtagsText] = useState("");
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [targetPostDate, setTargetPostDate] = useState("");

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!item) return;
    setSelectedVersion(item.latestDraftVersion || null);
    setDraftUrl("");
    setDraftNotes("");
    setGateFeedback("");
    setPublishedUrl(item.publishedUrl ?? "");
    setCommentText("");
    setTimestampLabel("");
    setTitle(item.title);
    setFormat(item.format);
    setTopicType(item.topicType);
    setEffortLevel(item.effortLevel);
    setReferenceBackupUrl(item.referenceBackupUrl ?? "");
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

  if (!item) {
    return (
      <ModalDialog
        open={false}
        onClose={onClose}
        titleId="review-dialog-title"
        title="Content Details"
      >
        <div />
      </ModalDialog>
    );
  }

  const statusMeta = STATUS_META[item.status];
  const activeDraft =
    drafts.find((d) => d.version === selectedVersion) ?? drafts[0] ?? null;
  const activeDraftUrl = activeDraft?.videoUrl ?? item.latestDraftUrl;

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
          referenceBackupUrl,
          adaptationIdea,
          callToAction,
          scriptUrl,
          scriptText,
          hashtags: parseHashtags(hashtagsText),
          assignedTo,
          targetPostDate: targetPostDate || null,
        }),
      "Details saved."
    );
  };

  const handleSubmitDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftUrl.trim()) return;
    await runAction(async () => {
      await actions.submitDraftLink(
        item.id,
        item.latestDraftVersion,
        draftUrl,
        draftNotes
      );
      setDraftUrl("");
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
    <ModalDialog
      open={Boolean(item)}
      onClose={onClose}
      titleId="review-dialog-title"
      title={`#${item.serialNo} · ${item.title}`}
      subtitle={`${formatLabel(item.format)} · ${statusMeta.label}`}
      maxWidthClass="max-w-6xl"
    >
      <div className="space-y-4">
        {/* Top status strip */}
        <div className="studio-muted flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusMeta.badgeClass}`}
            >
              {statusMeta.label}
            </span>
            <span className="studio-surface rounded-full border px-2.5 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
              {formatLabel(item.format)}
            </span>
            <span className="studio-surface rounded-full border px-2.5 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
              {item.topicType}
            </span>
            <span className="studio-surface rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize text-[var(--text-secondary)]">
              {item.effortLevel} effort
            </span>
            {item.latestDraftVersion > 0 ? (
              <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
                Draft v{item.latestDraftVersion}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCaptionAndTags}
              className="studio-surface inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
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
                      onClose();
                    });
                  }
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            ) : null}
          </div>
        </div>

        {notice ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-medium text-emerald-800"
          >
            {notice}
          </div>
        ) : null}
        {errorMsg ? (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-800"
          >
            {errorMsg}
          </div>
        ) : null}

        {/* Side-by-Side Video Comparison */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* LEFT: Reference Video + Brief + Script */}
          <div className="space-y-4">
            <VideoPlayerCard
              label="Reference Video / Post"
              url={item.referenceUrl}
              backupUrl={referenceBackupUrl}
              emptyHint="No reference link attached (original Manan concept)."
            />

            <form
              onSubmit={handleSaveDetails}
              className="studio-surface space-y-3 rounded-xl border p-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Production Brief, Script &amp; Hashtags
                </h2>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>

              <div>
                <label
                  htmlFor="detail-title"
                  className="mb-1 block text-xs font-medium text-[var(--text-muted)]"
                >
                  Title / Hook
                </label>
                <input
                  id="detail-title"
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
                    htmlFor="detail-format"
                    className="mb-1 block text-xs font-medium text-[var(--text-muted)]"
                  >
                    Format
                  </label>
                  <select
                    id="detail-format"
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
                    htmlFor="detail-topic"
                    className="mb-1 block text-xs font-medium text-[var(--text-muted)]"
                  >
                    Topic
                  </label>
                  <select
                    id="detail-topic"
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
                    htmlFor="detail-effort"
                    className="mb-1 block text-xs font-medium text-[var(--text-muted)]"
                  >
                    Effort
                  </label>
                  <select
                    id="detail-effort"
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
                    htmlFor="detail-date"
                    className="mb-1 block text-xs font-medium text-[var(--text-muted)]"
                  >
                    Target Date
                  </label>
                  <input
                    id="detail-date"
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
                  htmlFor="detail-idea"
                  className="mb-1 block text-xs font-medium text-[var(--text-muted)]"
                >
                  Manan Wellness Adaptation Idea
                </label>
                <textarea
                  id="detail-idea"
                  rows={2}
                  value={adaptationIdea}
                  onChange={(e) => setAdaptationIdea(e.target.value)}
                  className="studio-input w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="detail-cta"
                  className="mb-1 block text-xs font-medium text-[var(--text-muted)]"
                >
                  Call to Action
                </label>
                <input
                  id="detail-cta"
                  type="text"
                  value={callToAction}
                  onChange={(e) => setCallToAction(e.target.value)}
                  className="studio-input w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor="detail-script-url"
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
                  id="detail-script-url"
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
                  htmlFor="detail-script-text"
                  className="mb-1 block text-xs font-medium text-[var(--text-muted)]"
                >
                  Inline Script / Talking Points
                </label>
                <textarea
                  id="detail-script-text"
                  rows={3}
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="Write hook, lines, or scene breakdown..."
                  className="studio-input w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="detail-backup-url"
                  className="mb-1 block text-xs font-medium text-[var(--text-muted)]"
                >
                  Backup Reference Video Link (Drive / MP4 if IG won&apos;t embed)
                </label>
                <input
                  id="detail-backup-url"
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
                  htmlFor="detail-hashtags"
                  className="mb-1 block text-xs font-medium text-[var(--text-muted)]"
                >
                  Hashtags
                </label>
                <textarea
                  id="detail-hashtags"
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
          </div>

          {/* RIGHT: Recreated Draft Video + Manager Gates + Activity */}
          <div className="space-y-4">
            <VideoPlayerCard
              label={
                activeDraft
                  ? `Recreated Draft (v${activeDraft.version})`
                  : "Recreated Draft Video"
              }
              url={activeDraftUrl}
              emptyHint="No recreated draft link submitted yet. Once approved at Gate 1, paste a Google Drive / YouTube / Loom link below."
            />

            {drafts.length > 0 ? (
              <div className="studio-muted flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2">
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
                        : "studio-surface border text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    v{d.version}
                  </button>
                ))}
              </div>
            ) : null}

            {/* Gate 1: Manager Idea Approval */}
            {item.status === "idea_pending" ? (
              <div className="rounded-xl border border-amber-300/60 bg-amber-50/90 p-4 text-amber-950">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  Gate 1: Marketing Manager Idea Approval
                </div>
                {isManager ? (
                  <div className="space-y-3">
                    <p className="text-xs text-amber-900">
                      Approve this reference idea so the team can recreate it, or decline with feedback.
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
                      Waiting for the <strong>Marketing Manager</strong> to approve this idea before production starts.
                    </span>
                  </div>
                )}
              </div>
            ) : null}

            {/* Parked / Rejected idea resubmit */}
            {item.status === "idea_rejected" ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
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

            {/* Start Production button */}
            {item.status === "approved_for_production" ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-900">
                <div className="text-xs">
                  <strong>Idea Approved!</strong> Mark as In Production while creating, or paste your draft video link below.
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

            {/* Paste Draft Link Form */}
            {item.status === "approved_for_production" ||
            item.status === "in_production" ||
            item.status === "changes_requested" ? (
              <form
                onSubmit={handleSubmitDraft}
                className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/90 p-4 text-indigo-950"
              >
                <div className="text-sm font-semibold">
                  {item.status === "changes_requested"
                    ? `Submit Revised Draft (v${item.latestDraftVersion + 1})`
                    : `Submit Recreated Video Link (v${item.latestDraftVersion + 1})`}
                </div>
                {item.status === "changes_requested" && item.gate2Feedback ? (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-900">
                    <strong>Manager Suggestions:</strong> {item.gate2Feedback}
                  </div>
                ) : null}
                <div>
                  <label
                    htmlFor="draft-video-url"
                    className="mb-1 block text-xs font-medium text-indigo-950"
                  >
                    Recreated Video Link (Google Drive, YouTube Unlisted, Loom, MP4)
                  </label>
                  <input
                    id="draft-video-url"
                    type="url"
                    required
                    spellCheck={false}
                    value={draftUrl}
                    onChange={(e) => setDraftUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                    className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label
                    htmlFor="draft-notes"
                    className="mb-1 block text-xs font-medium text-indigo-950"
                  >
                    Notes for Manager (optional)
                  </label>
                  <input
                    id="draft-notes"
                    type="text"
                    value={draftNotes}
                    onChange={(e) => setDraftNotes(e.target.value)}
                    placeholder="e.g. Updated subtitles & lowered BGM as suggested"
                    className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" /> Submit for Manager Final Review (Gate 2)
                </button>
              </form>
            ) : null}

            {/* Gate 2: Manager Final Video Approval */}
            {item.status === "draft_review" ? (
              <div className="rounded-xl border border-purple-200 bg-purple-50/90 p-4 text-purple-950">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  Gate 2: Manager Final Video Review (v{item.latestDraftVersion})
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
                className="space-y-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-950"
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
              <div className="flex items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-xs text-teal-900">
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

            {/* Activity & Comments */}
            <div className="studio-surface rounded-xl border p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <MessageSquare className="h-4 w-4 text-[var(--text-muted)]" />
                Feedback &amp; Approval Timeline
              </div>

              <div className="mb-3 max-h-56 space-y-2.5 overflow-y-auto pr-1">
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
        </div>
      </div>
    </ModalDialog>
  );
}
