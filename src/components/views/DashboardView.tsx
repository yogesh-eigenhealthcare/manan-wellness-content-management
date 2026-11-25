"use client";

import React, { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Play,
  Plus,
} from "lucide-react";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { ContentThumbnail } from "@/components/video/ContentThumbnail";
import { STATUS_META, isGate1Pending, isGate2Pending } from "@/lib/workflow";
import { formatLabel, type ContentItem } from "@/types/content";

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
    title: "New custom Shorts thumbnails on mobile",
    takeaway:
      "Pick a clear high-contrast frame and readable title text so wellness Shorts stand out in browse feeds.",
  },
  {
    id: "ci-2",
    youtubeId: "clAPItNGkYk",
    channel: "YouTube Creators",
    title: "Keyframes in YouTube Create, Clips and Shorts",
    takeaway:
      "Use subtle zoom keyframes and captions in the first 3 seconds to hold viewer retention on therapy explainers.",
  },
  {
    id: "ci-3",
    youtubeId: "okO9m1eRYTY",
    channel: "Creator Insider",
    title: "Variety content on YouTube — watch this first",
    takeaway:
      "Pair short-form Reels / Shorts hooks with deeper Long form videos on anxiety, depression, and relationships.",
  },
  {
    id: "ci-4",
    youtubeId: "Rpisw-1BcgI",
    channel: "YouTube Creators",
    title: "Refresh thumbnails to reach a new audience",
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

export function DashboardView({
  items,
  isManager,
  onNewIdea,
  onNavigate,
  onSelectItem,
}: DashboardViewProps) {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [activeCreatorVideo, setActiveCreatorVideo] =
    useState<CreatorVideoTip | null>(null);

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
      {/* Page Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-medium tracking-tight text-[var(--text-primary)]">
          Channel dashboard
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate("content")}
            className="studio-raised inline-flex h-9 items-center rounded-lg border px-4 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)]"
          >
            All content
          </button>
          <button
            type="button"
            onClick={onNewIdea}
            className="studio-btn-accent inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            <span>New idea</span>
          </button>
        </div>
      </div>

      {/* YouTube Studio 3-Column Grid */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        {/* Column 1: Awaiting Manager Review */}
        <section className="studio-surface rounded-xl border p-5">
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <h2 className="text-base font-medium text-[var(--text-primary)]">
              {isManager ? "Needs your approval" : "Awaiting manager review"}
            </h2>
            <span className="font-mono-meta text-xs text-[var(--text-muted)]">
              {stats.gate1 + stats.gate2}
            </span>
          </div>

          {approvalQueue.length === 0 ? (
            <div className="studio-raised rounded-lg border border-dashed p-6 text-center text-sm text-[var(--text-muted)]">
              No pending Gate 1 or Gate 2 reviews
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {approvalQueue.map((item) => {
                const meta = STATUS_META[item.status];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectItem(item)}
                    className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-[var(--bg-hover)] -mx-2 px-2 rounded-lg"
                  >
                    <ContentThumbnail
                      format={item.format}
                      referenceUrl={item.referenceUrl}
                      referenceBackupUrl={item.referenceBackupUrl}
                      latestDraftUrl={item.latestDraftUrl}
                      latestDraftKind={item.latestDraftKind}
                      title={item.title}
                      size="table"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {item.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <span className="font-mono-meta">#{item.serialNo}</span>
                        <span>·</span>
                        <span className="truncate">{formatLabel(item.format)}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${meta.dotClass}`}
                        />
                        <span>{meta.shortLabel}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
            <button
              type="button"
              onClick={() => onNavigate("board")}
              className="studio-raised inline-flex h-9 items-center rounded-lg border px-4 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)]"
            >
              Open workflow board
            </button>
          </div>
        </section>

        {/* Column 2: Pipeline Analytics (YT Studio Channel Analytics style) */}
        <section className="studio-surface rounded-xl border p-5">
          <h2 className="text-base font-medium text-[var(--text-primary)]">
            Pipeline analytics
          </h2>

          <div className="mt-4">
            <div className="text-xs text-[var(--text-muted)]">Total items</div>
            <div className="tabular-nums mt-1 text-3xl font-medium tracking-tight text-[var(--text-primary)]">
              {stats.total}
            </div>
          </div>

          <div className="mt-5 space-y-3 border-t border-[var(--border-subtle)] pt-4 text-sm">
            <div className="text-xs font-medium text-[var(--text-muted)]">
              Stage summary
            </div>
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span>Gate 1 · Ideas pending</span>
              <span className="font-mono-meta text-[var(--text-primary)]">
                {stats.gate1}
              </span>
            </div>
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span>In production and rework</span>
              <span className="font-mono-meta text-[var(--text-primary)]">
                {stats.inProd}
              </span>
            </div>
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span>Gate 2 · Drafts in review</span>
              <span className="font-mono-meta text-[var(--text-primary)]">
                {stats.gate2}
              </span>
            </div>
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span>Approved to post</span>
              <span className="font-mono-meta text-[var(--text-primary)]">
                {stats.ready}
              </span>
            </div>
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span>Posted live</span>
              <span className="font-mono-meta text-[var(--text-primary)]">
                {stats.posted}
              </span>
            </div>
          </div>

          <div className="mt-5 border-t border-[var(--border-subtle)] pt-4">
            <button
              type="button"
              onClick={() => onNavigate("insights")}
              className="studio-raised inline-flex h-9 items-center rounded-lg border px-4 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)]"
            >
              Go to pipeline insights
            </button>
          </div>
        </section>

        {/* Column 3: Creator Insider Carousel + What's New */}
        <div className="space-y-5">
          <section className="studio-surface rounded-xl border p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-medium text-[var(--text-primary)]">
                Creator Insider
              </h2>
              <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <button
                  type="button"
                  onClick={handlePrevTip}
                  aria-label="Previous Creator Insider video"
                  className="rounded-md p-1 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <span className="font-mono-meta px-1">
                  {carouselIndex + 1} / {CREATOR_INSIDER_VIDEOS.length}
                </span>
                <button
                  type="button"
                  onClick={handleNextTip}
                  aria-label="Next Creator Insider video"
                  className="rounded-md p-1 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveCreatorVideo(currentTip)}
              className="group relative block w-full overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-black"
            >
              <img
                src={`https://i.ytimg.com/vi/${currentTip.youtubeId}/hqdefault.jpg`}
                alt={currentTip.title}
                className="aspect-video w-full object-cover opacity-95 transition-opacity duration-150 group-hover:opacity-100"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/75 text-white">
                  <Play className="h-4 w-4 fill-white" strokeWidth={1.5} />
                </span>
              </div>
            </button>

            <h3 className="mt-3 text-sm font-medium text-[var(--text-primary)]">
              {currentTip.title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
              {currentTip.takeaway}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveCreatorVideo(currentTip)}
                className="studio-raised inline-flex h-8 items-center rounded-lg border px-3.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)]"
              >
                Watch video
              </button>
              <a
                href={`https://www.youtube.com/watch?v=${currentTip.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              >
                <span>YouTube</span>
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
              </a>
            </div>
          </section>

          <section className="studio-surface rounded-xl border p-5">
            <h2 className="mb-3 text-base font-medium text-[var(--text-primary)]">
              What&apos;s new in Studio
            </h2>

            {newestIdeas.length === 0 ? (
              <p className="py-3 text-xs text-[var(--text-muted)]">
                No ideas added yet
              </p>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {newestIdeas.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectItem(item)}
                    className="flex w-full items-center justify-between gap-3 py-2.5 text-left transition-colors hover:text-[var(--accent)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-[var(--text-primary)]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                        <span className="font-mono-meta">#{item.serialNo}</span> ·{" "}
                        {formatLabel(item.format)} · {item.topicType}
                      </p>
                    </div>
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
            <div className="overflow-hidden rounded-lg bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${activeCreatorVideo.youtubeId}`}
                title={activeCreatorVideo.title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="aspect-video w-full border-0"
              />
            </div>
            <div className="studio-raised flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3.5 text-xs">
              <p className="max-w-xl text-[var(--text-secondary)]">
                {activeCreatorVideo.takeaway}
              </p>
              <a
                href={`https://www.youtube.com/watch?v=${activeCreatorVideo.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-[var(--accent)] hover:underline"
              >
                Watch on YouTube
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
              </a>
            </div>
          </div>
        ) : null}
      </ModalDialog>
    </div>
  );
}
