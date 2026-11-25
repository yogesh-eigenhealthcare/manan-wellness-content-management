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
      ? "h-[54px] w-24 shrink-0 rounded-md"
      : "aspect-video w-full rounded-lg";

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
            : "SHORT";

  return (
    <div
      className={`relative overflow-hidden border border-[var(--border-subtle)] bg-[#141415] ${boxClass}`}
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
          <div className="pointer-events-none absolute inset-0 bg-black/15" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white">
              <Play className="h-3 w-3 fill-white" />
            </span>
          </div>
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#1c1c1f] text-[#85858b]">
          {desc.provider === "instagram" ? (
            <Clapperboard className="h-4 w-4" strokeWidth={1.5} />
          ) : format === "carousel" ? (
            <ImageIcon className="h-4 w-4" strokeWidth={1.5} />
          ) : format === "long_form" ? (
            <Video className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <Film className="h-4 w-4" strokeWidth={1.5} />
          )}
        </div>
      )}

      <span className="font-mono-meta absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] font-medium leading-none text-[#ededed]">
        {badgeText}
      </span>
    </div>
  );
}
