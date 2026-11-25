"use client";

import React from "react";
import { Download, FileText, Image as ImageIcon } from "lucide-react";
import { VideoPlayerCard } from "@/components/video/VideoPlayerCard";
import type { DraftSubmission } from "@/types/content";

interface DraftPreviewCardProps {
  label: string;
  draft: DraftSubmission | null;
  fallbackVideoUrl: string | null | undefined;
  emptyHint?: string;
}

export function DraftPreviewCard({
  label,
  draft,
  fallbackVideoUrl,
  emptyHint = "No recreated draft submitted yet. Submit a video link or upload an image/PDF on the left to preview it here.",
}: DraftPreviewCardProps) {
  const kind = draft?.draftKind ?? (draft?.fileDataUrl ? "image" : "video");

  if (draft && (kind === "image" || kind === "pdf") && draft.fileDataUrl) {
    return (
      <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-slate-950 text-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900 px-3 py-2.5 text-xs">
          <div className="flex items-center gap-2 font-medium text-slate-200">
            {kind === "pdf" ? (
              <FileText className="h-3.5 w-3.5 text-rose-400" />
            ) : (
              <ImageIcon className="h-3.5 w-3.5 text-sky-400" />
            )}
            <span>{label}</span>
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] uppercase text-slate-300">
              {kind}
            </span>
          </div>

          <a
            href={draft.fileDataUrl}
            download={draft.fileName || `draft-v${draft.version}.${kind === "pdf" ? "pdf" : "png"}`}
            className="inline-flex items-center gap-1 rounded-md bg-teal-600/90 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-teal-500"
          >
            Download <Download className="h-3 w-3" />
          </a>
        </div>

        {kind === "image" ? (
          <div className="flex h-[460px] lg:h-[580px] items-center justify-center bg-black p-3">
            <img
              src={draft.fileDataUrl}
              alt={draft.fileName || label}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          </div>
        ) : (
          <iframe
            src={draft.fileDataUrl}
            title={draft.fileName || label}
            className="h-[460px] lg:h-[580px] w-full border-0 bg-white"
          />
        )}

        {draft.fileName ? (
          <div className="border-t border-slate-800 bg-slate-900/95 px-3 py-1.5 text-[11px] text-slate-400">
            File: <span className="text-slate-200">{draft.fileName}</span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <VideoPlayerCard
      label={label}
      url={draft?.videoUrl || fallbackVideoUrl}
      emptyHint={emptyHint}
      tall
    />
  );
}
