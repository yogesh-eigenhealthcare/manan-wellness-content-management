"use client";

import React, { useState } from "react";
import { Clapperboard, Film, Image as ImageIcon, Play, Video } from "lucide-react";
import { resolveThumbnail } from "@/lib/thumbnail";
import type { ContentFormat } from "@/types/content";

interface ContentThumbnailProps {
  format: ContentFormat;
  referenceUrl?: string | null;
  referenceBackupUrl?: string | null;
  latestDraftUrl?: string | null;
  latestDraftKind?: string | null;
  title: string;
  size?: "table" | "card";
}

export function ContentThumbnail({
  format,
  referenceUrl,
  referenceBackupUrl,
  latestDraftUrl,
  latestDraftKind,
  title,
  size = "table",
}: ContentThumbnailProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const desc = resolveThumbnail({
    format,
    referenceUrl,
    referenceBackupUrl,
    latestDraftUrl,
  });

  const boxClass =
    size === "table"
      ? "h-14 w-24 shrink-0 rounded-lg"
      : "h-28 w-full rounded-lg";

  const showImage = Boolean(desc.imageUrl && !imgFailed);

  const badgeText =
    latestDraftKind === "pdf"
      ? "PDF"
      : latestDraftKind === "image"
        ? "IMG"
        : format === "long_form"
          ? "LONG"
          : format === "carousel"
            ? "POST"
            : "REEL";

  return (
    <div
      className={`relative overflow-hidden border border-[var(--border-subtle)] bg-slate-900 ${boxClass}`}
    >
      {showImage ? (
        <>
          <img
            src={desc.imageUrl!}
            alt={title}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white">
              <Play className="h-3 w-3 fill-white" />
            </span>
          </div>
        </>
      ) : (
        <div
          className={`flex h-full w-full flex-col items-center justify-center gap-1 ${
            desc.provider === "instagram"
              ? "bg-gradient-to-br from-purple-900/90 via-rose-900/80 to-amber-800/80 text-white"
              : format === "long_form"
                ? "bg-gradient-to-br from-indigo-900 to-slate-900 text-indigo-100"
                : format === "carousel"
                  ? "bg-gradient-to-br from-sky-900 to-slate-900 text-sky-100"
                  : "bg-gradient-to-br from-teal-900 to-slate-900 text-teal-100"
          }`}
        >
          {desc.provider === "instagram" ? (
            <Clapperboard className="h-4 w-4 opacity-90" />
          ) : format === "carousel" ? (
            <ImageIcon className="h-4 w-4 opacity-90" />
          ) : format === "long_form" ? (
            <Video className="h-4 w-4 opacity-90" />
          ) : (
            <Film className="h-4 w-4 opacity-90" />
          )}
        </div>
      )}

      <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white">
        {badgeText}
      </span>
    </div>
  );
}
