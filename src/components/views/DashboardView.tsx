"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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
      "Pair short-form Reels / Shorts hooks with deeper Long form videos on anxiety, depression, and relationships.",
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
  const [carouselIndex, setCarouselIndex] = useState(0);
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
    return [...items].sort((a, b) => b.serialNo - a.serialNo).slice(0, 4);
  }, [items]);

  const currentTip = CREATOR_INSIDER_VIDEOS[carouselIndex];

  const handlePrevTip = () => {
    setCarouselIndex((i) =>
      i === 0 ? CREATOR_INSIDER_VIDEOS.length - 1 : i - 1
    );
  };

  const handleNextTip = () => {
    setCarouselIndex((i) =>
      i === CREATOR_INSIDER_VIDEOS.length - 1 ? 0 : i + 1
    );
  };

  return (
    <div className="space-y-6">
      {/* Minimal Studio Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Studio dashboard
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Overview of Manan Wellness Reels / Shorts, Long form &amp; Carousels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate("content")}
            className="studio-surface inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          >
            All Content <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onNewIdea}
            className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" /> New Idea
          </button>
        </div>
      </div>

      {/* 3-Column YouTube Studio Layout */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        {/* Column 1: Awaiting Manager Review */}
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

          <div className="space-y-2.5">
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

        {/* Column 2: Channel / Pipeline Analytics Card (YT Studio style) */}
        <section className="studio-surface flex flex-col rounded-2xl border p-5">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Pipeline analytics
          </h3>
          <div className="mt-3">
            <div className="text-xs text-[var(--text-muted)]">Total ideas</div>
            <div className="mt-0.5 text-3xl font-bold text-[var(--text-primary)]">
              {stats.total}
            </div>
          </div>

          <div className="mt-5 space-y-2.5 border-t border-[var(--border-subtle)] pt-4 text-xs">
            <div className="font-semibold text-[var(--text-primary)]">Summary</div>
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span>Gate 1 · Ideas pending</span>
              <span className="font-semibold text-amber-600">{stats.gate1}</span>
            </div>
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span>In production / rework</span>
              <span className="font-semibold text-sky-600">{stats.inProd}</span>
            </div>
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span>Gate 2 · Drafts in review</span>
              <span className="font-semibold text-purple-600">{stats.gate2}</span>
            </div>
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span>Approved to post</span>
              <span className="font-semibold text-emerald-600">{stats.ready}</span>
            </div>
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span>Posted live</span>
              <span className="font-semibold text-teal-600">{stats.posted}</span>
            </div>
          </div>

          <div className="mt-5 border-t border-[var(--border-subtle)] pt-4">
            <button
              type="button"
              onClick={() => onNavigate("insights")}
              className="studio-muted rounded-full border px-4 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-hover)]"
            >
              Go to pipeline insights
            </button>
          </div>
        </section>

        {/* Column 3: Creator Insider Carousel + What's New in Content Studio */}
        <div className="space-y-5">
          {/* Creator Insider Carousel (YT Studio style) */}
          <section className="studio-surface rounded-2xl border p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Creator Insider
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <button
                  type="button"
                  onClick={handlePrevTip}
                  aria-label="Previous Creator Insider video"
                  className="rounded-full p-1 text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="tabular-nums font-medium">
                  {carouselIndex + 1} / {CREATOR_INSIDER_VIDEOS.length}
                </span>
                <button
                  type="button"
                  onClick={handleNextTip}
                  aria-label="Next Creator Insider video"
                  className="rounded-full p-1 text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveCreatorVideo(currentTip)}
              className="group relative block w-full overflow-hidden rounded-xl bg-slate-900"
            >
              <img
                src={`https://i.ytimg.com/vi/${currentTip.youtubeId}/hqdefault.jpg`}
                alt={currentTip.title}
                className="aspect-video w-full object-cover transition group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/25 transition group-hover:bg-black/35">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white shadow-md">
                  <Play className="h-5 w-5 fill-white" />
                </span>
              </div>
            </button>

            <h4 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
              {currentTip.title}
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
              {currentTip.takeaway}
            </p>

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveCreatorVideo(currentTip)}
                className="studio-muted rounded-full border px-4 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-hover)]"
              >
                Watch video
              </button>
              <a
                href={`https://www.youtube.com/watch?v=${currentTip.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] hover:text-teal-600"
              >
                YouTube <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </section>

          {/* What's new in Content Studio (Newly added ideas) */}
          <section className="studio-surface rounded-2xl border p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                What&apos;s new in Content Studio
              </h3>
              <Sparkles className="h-4 w-4 text-teal-500" />
            </div>

            {newestIdeas.length === 0 ? (
              <p className="py-4 text-xs text-[var(--text-muted)]">
                No ideas added yet.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {newestIdeas.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectItem(item)}
                    className="flex w-full items-center justify-between gap-3 py-2.5 text-left transition hover:text-teal-600"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[var(--text-primary)]">
                        #{item.serialNo} {item.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                        {formatLabel(item.format)} · {item.topicType}
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
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
