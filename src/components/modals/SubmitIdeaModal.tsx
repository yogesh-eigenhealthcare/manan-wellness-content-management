"use client";

import React, { useState } from "react";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { VideoPlayerCard } from "@/components/video/VideoPlayerCard";
import type { SubmitIdeaInput } from "@/hooks/useContentItems";
import {
  FORMAT_OPTIONS,
  TEAM_ASSIGNEE_OPTIONS,
  TOPIC_OPTIONS,
  type ContentFormat,
  type EffortLevel,
  type HashtagPreset,
} from "@/types/content";

interface SubmitIdeaModalProps {
  open: boolean;
  onClose: () => void;
  hashtagPresets: HashtagPreset[];
  onSubmit: (input: SubmitIdeaInput) => Promise<string>;
}

export function SubmitIdeaModal({
  open,
  onClose,
  hashtagPresets,
  onSubmit,
}: SubmitIdeaModalProps) {
  const [format, setFormat] = useState<ContentFormat>("reel");
  const [title, setTitle] = useState("");
  const [topicType, setTopicType] = useState<string>("General");
  const [effortLevel, setEffortLevel] = useState<EffortLevel>("low");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [referenceBackupUrl, setReferenceBackupUrl] = useState("");
  const [referenceNotes, setReferenceNotes] = useState("");
  const [adaptationIdea, setAdaptationIdea] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [scriptUrl, setScriptUrl] = useState("");
  const [hashtagsRaw, setHashtagsRaw] = useState("");
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAssignee = (person: string) => {
    setAssignedTo((prev) =>
      prev.includes(person) ? prev.filter((a) => a !== person) : [...prev, person]
    );
  };

  const resetForm = () => {
    setFormat("reel");
    setTitle("");
    setTopicType("General");
    setEffortLevel("low");
    setReferenceUrl("");
    setReferenceBackupUrl("");
    setReferenceNotes("");
    setAdaptationIdea("");
    setCallToAction("");
    setScriptUrl("");
    setHashtagsRaw("");
    setAssignedTo([]);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const hashtags = Array.from(
        new Set(
          hashtagsRaw
            .split(/[\s,]+/)
            .map((t) => t.trim())
            .filter(Boolean)
            .map((t) => (t.startsWith("#") ? t : `#${t}`))
        )
      );
      await onSubmit({
        format,
        title,
        topicType,
        effortLevel,
        referenceUrl,
        referenceBackupUrl,
        referenceNotes,
        adaptationIdea,
        callToAction,
        scriptUrl,
        scriptText: "",
        hashtags,
        assignedTo,
        targetPostDate: null,
      });
      resetForm();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit idea.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      titleId="submit-idea-title"
      title="Submit New Content Idea (Gate 1)"
      subtitle="Share a trending reference link and adaptation idea for Marketing Manager approval."
      maxWidthClass="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-3.5">
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
              Format
            </span>
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="studio-surface inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <input
                    type="radio"
                    name="format"
                    value={opt.value}
                    checked={format === opt.value}
                    onChange={() => setFormat(opt.value)}
                    className="accent-teal-600"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="idea-title"
              className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]"
            >
              Title / Hook <span aria-hidden="true">*</span>
            </label>
            <input
              id="idea-title"
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 5 signs your nervous system is overloaded"
              className="studio-input w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="idea-topic"
                className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]"
              >
                Topic
              </label>
              <select
                id="idea-topic"
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
            <div>
              <label
                htmlFor="idea-effort"
                className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]"
              >
                Effort Level
              </label>
              <select
                id="idea-effort"
                value={effortLevel}
                onChange={(e) => setEffortLevel(e.target.value as EffortLevel)}
                className="studio-input w-full rounded-lg border px-2.5 py-2 text-sm"
              >
                <option value="low">Low efforts</option>
                <option value="high">High efforts</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="idea-ref-url"
              className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]"
            >
              Reference Reel / Short / YouTube / Post URL
            </label>
            <input
              id="idea-ref-url"
              type="url"
              spellCheck={false}
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/... or https://youtu.be/..."
              className="studio-input w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="idea-backup-url"
              className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]"
            >
              Backup Drive / MP4 Link (optional)
            </label>
            <input
              id="idea-backup-url"
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
              htmlFor="idea-adaptation"
              className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]"
            >
              How should Manan Wellness recreate it?
            </label>
            <textarea
              id="idea-adaptation"
              rows={2}
              value={adaptationIdea}
              onChange={(e) => setAdaptationIdea(e.target.value)}
              placeholder="e.g. Use Dr. Pragati speaking with subtle background piano and Manan branding"
              className="studio-input w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="idea-cta"
              className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]"
            >
              Call to Action
            </label>
            <input
              id="idea-cta"
              type="text"
              value={callToAction}
              onChange={(e) => setCallToAction(e.target.value)}
              placeholder='e.g. Comment "HELP" to book a session'
              className="studio-input w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
              Suggested Assignee
            </span>
            <div className="flex flex-wrap gap-1.5">
              {TEAM_ASSIGNEE_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggleAssignee(p)}
                  className={`rounded-full border px-2.5 py-1 text-xs capitalize ${
                    assignedTo.includes(p)
                      ? "border-teal-600 bg-teal-50 font-medium text-teal-800"
                      : "studio-surface text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="idea-hashtags"
              className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]"
            >
              Hashtags (optional)
            </label>
            <input
              id="idea-hashtags"
              type="text"
              value={hashtagsRaw}
              onChange={(e) => setHashtagsRaw(e.target.value)}
              placeholder="#MananWellness #MentalHealthAwareness"
              className="studio-input w-full rounded-lg border px-3 py-2 text-xs"
            />
            {hashtagPresets.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {hashtagPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      setHashtagsRaw((prev) =>
                        [prev.trim(), preset.tags.join(" ")].filter(Boolean).join(" ")
                      )
                    }
                    className="studio-muted rounded border px-2 py-0.5 text-[11px] text-[var(--text-secondary)] hover:border-teal-500"
                  >
                    + {preset.category}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <VideoPlayerCard
              label="Live Reference Preview"
              url={referenceUrl}
              backupUrl={referenceBackupUrl}
              emptyHint="Paste an Instagram Reel, YouTube Shorts/Long form, or Google Drive link on the left to preview it here."
            />

            <div>
              <label
                htmlFor="idea-script-doc"
                className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]"
              >
                Google Doc Script URL (optional)
              </label>
              <input
                id="idea-script-doc"
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
                htmlFor="idea-ref-notes"
                className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]"
              >
                Editing / Music Notes
              </label>
              <textarea
                id="idea-ref-notes"
                rows={2}
                value={referenceNotes}
                onChange={(e) => setReferenceNotes(e.target.value)}
                placeholder="Notes about pacing, audio, or caption style..."
                className="studio-input w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-3 border-t border-[var(--border-subtle)] pt-3">
            {error ? (
              <div
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
              >
                {error}
              </div>
            ) : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="studio-surface rounded-lg border px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit for Manager Approval"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </ModalDialog>
  );
}
