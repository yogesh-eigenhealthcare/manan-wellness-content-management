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
      <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[#0f0f10] text-[#ededed]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(237,237,237,0.08)] bg-[#19191b] px-3.5 py-2.5 text-xs">
          <div className="flex items-center gap-2 font-medium text-[#ededed]">
            {kind === "pdf" ? (
              <FileText className="h-4 w-4 text-[#a1a1a6]" strokeWidth={1.5} />
            ) : (
              <ImageIcon className="h-4 w-4 text-[#a1a1a6]" strokeWidth={1.5} />
            )}
            <span>{label}</span>
            <span className="font-mono-meta rounded bg-[#232325] px-2 py-0.5 text-[11px] uppercase text-[#a1a1a6]">
              {kind}
            </span>
          </div>

          <a
            href={draft.fileDataUrl}
            download={draft.fileName || `draft-v${draft.version}.${kind === "pdf" ? "pdf" : "png"}`}
            className="inline-flex items-center gap-1 rounded-md bg-[#232325] px-2.5 py-1 text-[11px] font-medium text-[#ededed] hover:bg-[#2a2a2d]"
          >
            <span>Download</span>
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
          </a>
        </div>

        {kind === "image" ? (
          <div className="flex h-[460px] items-center justify-center bg-[#141415] p-4 lg:h-[580px]">
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
            className="h-[460px] w-full border-0 bg-white lg:h-[580px]"
          />
        )}

        {draft.fileName ? (
          <div className="border-t border-[rgba(237,237,237,0.08)] bg-[#19191b] px-3.5 py-2 text-[11px] text-[#a1a1a6]">
            File: <span className="text-[#ededed]">{draft.fileName}</span>
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
