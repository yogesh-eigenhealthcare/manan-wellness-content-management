"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Film,
  Image as ImageIcon,
  Play,
  Plus,
  Sparkles,
  Video,
} from "lucide-react";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { STATUS_META, isGate1Pending, isGate2Pending } from "@/lib/workflow";
import { formatLabel, type ContentFormat, type ContentItem } from "@/types/content";

interface CreatorVideoTip {
  id: string;
  youtubeId: string;
  channel: string;
  title: string;
  takeaway: string;
}

const CREATOR_INSIDER_VIDEOS: CreatorVideoTip[] = [
  {
    id: "ci-1",
    youtubeId: "cF8fJ1AGdA0",
    channel: "Creator Insider",
    title: "New! Custom Shorts Thumbnails on Mobile",
    takeaway:
      "Pick a clear high-contrast frame and readable title text so wellness Shorts stand out in browse feeds.",
  },
  {
    id: "ci-2",
    youtubeId: "clAPItNGkYk",
    channel: "YouTube Creators",
    title: "Keyframes in YouTube Create, Clips & Shorts",
    takeaway:
      "Use subtle zoom keyframes and captions in the first 3 seconds to hold viewer retention on therapy explainers.",
  },
  {
    id: "ci-3",
    youtubeId: "okO9m1eRYTY",
    channel: "Creator Insider",
    title: "Variety Content on YouTube - Watch this First!",
    takeaway:
      "Pair short-form Reels/Shorts hooks with deeper Long form videos on anxiety, depression, and relationships.",
  },
  {
    id: "ci-4",
    youtubeId: "Rpisw-1BcgI",
    channel: "YouTube Creators",
    title: "Refresh Thumbnails to Reach a New Audience",
    takeaway:
      "Test clear, empathetic titles and thumbnail framing on evergreen mental health topics to revive older posts.",
  },
];

interface DashboardViewProps {
  items: ContentItem[];
  isManager: boolean;
  onNewIdea: () => void;
  onNavigate: (page: "content" | "board" | "insights") => void;
  onSelectItem: (item: ContentItem) => void;
}

function FormatSmallIcon({ format }: { format: ContentFormat }) {
  if (format === "carousel") return <ImageIcon className="h-3.5 w-3.5 text-sky-500" />;
  if (format === "long_form") return <Video className="h-3.5 w-3.5 text-indigo-500" />;
  return <Film className="h-3.5 w-3.5 text-teal-500" />;
}

export function DashboardView({
  items,
  isManager,
  onNewIdea,
  onNavigate,
  onSelectItem,
}: DashboardViewProps) {
  const [activeCreatorVideo, setActiveCreatorVideo] = useState<CreatorVideoTip | null>(
    null
  );

  const stats = useMemo(() => {
    const posted = items.filter((i) => i.status === "posted").length;
    const ready = items.filter((i) => i.status === "approved_to_post").length;
    const gate2 = items.filter((i) => isGate2Pending(i.status)).length;
    const gate1 = items.filter((i) => isGate1Pending(i.status)).length;
    const inProd = items.filter(
      (i) =>
        i.status === "approved_for_production" ||
        i.status === "in_production" ||
        i.status === "changes_requested"
    ).length;

    return {
      total: items.length,
      posted,
      ready,
      gate2,
      gate1,
      inProd,
    };
  }, [items]);

  const approvalQueue = useMemo(() => {
    const gate2Items = items.filter((i) => isGate2Pending(i.status));
    const gate1Items = items.filter((i) => isGate1Pending(i.status));
    return [...gate2Items, ...gate1Items].slice(0, 5);
  }, [items]);

  const newestIdeas = useMemo(() => {
    return [...items]
      .sort((a, b) => b.serialNo - a.serialNo)
      .slice(0, 5);
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Minimal Studio Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Studio Dashboard
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Overview of Manan Wellness Reels / Shorts, Long form &amp; Carousels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate("content")}
            className="studio-surface inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          >
            All Content <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onNewIdea}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" /> New Idea
          </button>
        </div>
      </div>

      {/* Minimal Stats Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="studio-surface rounded-xl border p-4">
          <div className="text-xs font-medium text-[var(--text-muted)]">Total Ideas</div>
          <div className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
            {stats.total}
          </div>
        </div>
        <div className="studio-surface rounded-xl border p-4">
          <div className="text-xs font-medium text-[var(--text-muted)]">
            Gate 1 · Pending
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-600">{stats.gate1}</div>
        </div>
        <div className="studio-surface rounded-xl border p-4">
          <div className="text-xs font-medium text-[var(--text-muted)]">
            In Production
          </div>
          <div className="mt-1 text-2xl font-bold text-sky-600">{stats.inProd}</div>
        </div>
        <div className="studio-surface rounded-xl border p-4">
          <div className="text-xs font-medium text-[var(--text-muted)]">
            Gate 2 · Draft Review
          </div>
          <div className="mt-1 text-2xl font-bold text-purple-600">{stats.gate2}</div>
        </div>
        <div className="studio-surface rounded-xl border p-4">
          <div className="text-xs font-medium text-[var(--text-muted)]">
            Approved to Post
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{stats.ready}</div>
        </div>
        <div className="studio-surface rounded-xl border p-4">
          <div className="text-xs font-medium text-[var(--text-muted)]">Posted</div>
          <div className="mt-1 text-2xl font-bold text-teal-600">{stats.posted}</div>
        </div>
      </div>

      {/* YouTube Studio-style 3-Card Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Column 1: Pending Approvals / Latest Attention */}
        <section className="studio-surface flex flex-col rounded-2xl border p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {isManager ? "Needs Your Approval" : "Awaiting Manager Review"}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Draft cuts (Gate 2) and reference ideas (Gate 1)
              </p>
            </div>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>

          <div className="flex-1 space-y-2.5">
            {approvalQueue.length === 0 ? (
              <div className="studio-muted rounded-xl border border-dashed p-6 text-center text-xs text-[var(--text-muted)]">
                <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-500" />
                Everything is reviewed!
              </div>
            ) : (
              approvalQueue.map((item) => {
                const meta = STATUS_META[item.status];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectItem(item)}
                    className="studio-muted flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left transition hover:border-teal-500"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                        <FormatSmallIcon format={item.format} />
                        <span>#{item.serialNo}</span>
                        <span>·</span>
                        <span>{formatLabel(item.format)}</span>
                      </div>
                      <p className="mt-0.5 truncate text-sm font-semibold text-[var(--text-primary)]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                        {item.topicType}
                        {item.assignedTo.length > 0
                          ? ` · ${item.assignedTo.join(", ")}`
                          : ""}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.badgeClass}`}
                    >
                      {meta.shortLabel}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-4 border-t border-[var(--border-subtle)] pt-3">
            <button
              type="button"
              onClick={() => onNavigate("board")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:underline"
            >
              Open Kanban Board <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>

        {/* Column 2: Creator Insider (YouTube Growth Videos) */}
        <section className="studio-surface flex flex-col rounded-2xl border p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Creator Insider
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Suggested YouTube videos to grow social reach
              </p>
            </div>
            <Play className="h-4 w-4 text-rose-500" />
          </div>

          <div className="flex-1 space-y-3">
            {CREATOR_INSIDER_VIDEOS.map((vid) => (
              <button
                key={vid.id}
                type="button"
                onClick={() => setActiveCreatorVideo(vid)}
                className="studio-muted group flex w-full items-start gap-3 rounded-xl border p-2.5 text-left transition hover:border-teal-500"
              >
                <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-900">
                  <img
                    src={`https://i.ytimg.com/vi/${vid.youtubeId}/hqdefault.jpg`}
                    alt={vid.title}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <Play className="h-5 w-5 fill-white text-white" />
                  </div>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-600">
                    {vid.channel}
                  </span>
                  <div className="line-clamp-2 text-xs font-semibold text-[var(--text-primary)]">
                    {vid.title}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-[var(--text-muted)]">
                    {vid.takeaway}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Column 3: What's New in Content Studio (Newly Added Ideas) */}
        <section className="studio-surface flex flex-col rounded-2xl border p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                What&apos;s new in Content Studio
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Newly added ideas &amp; references
              </p>
            </div>
            <Sparkles className="h-4 w-4 text-teal-500" />
          </div>

          <div className="flex-1 space-y-2.5">
            {newestIdeas.length === 0 ? (
              <div className="studio-muted rounded-xl border border-dashed p-6 text-center text-xs text-[var(--text-muted)]">
                No ideas added yet. Click &ldquo;New Idea&rdquo; to submit your first one.
              </div>
            ) : (
              newestIdeas.map((item) => {
                const meta = STATUS_META[item.status];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectItem(item)}
                    className="studio-muted flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left transition hover:border-teal-500"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                        <FormatSmallIcon format={item.format} />
                        <span>#{item.serialNo}</span>
                        <span>·</span>
                        <span>{formatLabel(item.format)}</span>
                      </div>
                      <p className="mt-0.5 truncate text-sm font-semibold text-[var(--text-primary)]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">
                        {item.adaptationIdea || item.callToAction || item.topicType}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.badgeClass}`}
                    >
                      {meta.shortLabel}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-4 border-t border-[var(--border-subtle)] pt-3">
            <button
              type="button"
              onClick={() => onNavigate("insights")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:underline"
            >
              View Pipeline Insights <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>
      </div>

      {/* Inline Creator Insider Video Player Modal */}
      <ModalDialog
        open={Boolean(activeCreatorVideo)}
        onClose={() => setActiveCreatorVideo(null)}
        titleId="creator-insider-modal-title"
        title={activeCreatorVideo?.title ?? "Creator Insider"}
        subtitle={activeCreatorVideo?.channel}
        maxWidthClass="max-w-3xl"
      >
        {activeCreatorVideo ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${activeCreatorVideo.youtubeId}`}
                title={activeCreatorVideo.title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="aspect-video w-full border-0"
              />
            </div>
            <div className="studio-muted flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 text-xs">
              <p className="max-w-xl text-[var(--text-secondary)]">
                <strong>Manan Wellness Takeaway:</strong> {activeCreatorVideo.takeaway}
              </p>
              <a
                href={`https://www.youtube.com/watch?v=${activeCreatorVideo.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-teal-600 hover:underline"
              >
                Watch on YouTube <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ) : null}
      </ModalDialog>
    </div>
  );
}
