"use client";

import React, { useState } from "react";
import { ExternalLink, Film, PlayCircle } from "lucide-react";
import { resolveVideoEmbed } from "@/lib/videoEmbed";

interface VideoPlayerCardProps {
  label: string;
  url: string | null | undefined;
  backupUrl?: string | null | undefined;
  emptyHint?: string;
  tall?: boolean;
}

export function VideoPlayerCard({
  label,
  url,
  backupUrl,
  emptyHint = "No video link added yet.",
  tall = false,
}: VideoPlayerCardProps) {
  const [useBackup, setUseBackup] = useState(false);

  const hasBackup = Boolean(backupUrl && backupUrl.trim());
  const activeUrl = useBackup && hasBackup ? backupUrl : url;
  const resolved = resolveVideoEmbed(activeUrl);

  const heightClass = tall ? "h-[460px] lg:h-[580px]" : "aspect-[9/12] max-h-96";

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[#0f0f10] text-[#ededed]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(237,237,237,0.08)] bg-[#19191b] px-3.5 py-2.5 text-xs">
        <div className="flex items-center gap-2 font-medium text-[#ededed]">
          <Film className="h-4 w-4 text-[#a1a1a6]" strokeWidth={1.5} />
          <span>{label}</span>
          <span className="rounded bg-[#232325] px-2 py-0.5 text-[11px] text-[#a1a1a6]">
            {resolved.providerLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasBackup ? (
            <button
              type="button"
              onClick={() => setUseBackup((v) => !v)}
              className="rounded-md border border-[rgba(237,237,237,0.12)] bg-[#232325] px-2.5 py-1 text-[11px] text-[#ededed] hover:bg-[#2a2a2d]"
            >
              {useBackup ? "Primary link" : "Backup link"}
            </button>
          ) : null}
          {resolved.originalUrl ? (
            <a
              href={resolved.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-[#232325] px-2.5 py-1 text-[11px] font-medium text-[#ededed] hover:bg-[#2a2a2d]"
            >
              <span>Open</span>
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
            </a>
          ) : null}
        </div>
      </div>

      {resolved.kind === "none" ? (
        <div
          className={`flex ${heightClass} w-full flex-col items-center justify-center gap-2 bg-[#141415] p-6 text-center text-xs text-[#85858b]`}
        >
          <PlayCircle className="h-8 w-8 text-[#525252]" strokeWidth={1.5} />
          <p className="max-w-xs">{emptyHint}</p>
        </div>
      ) : resolved.kind === "direct-video" && resolved.embedUrl ? (
        <video
          src={resolved.embedUrl}
          controls
          playsInline
          className={`${heightClass} w-full bg-black object-contain`}
        />
      ) : resolved.canInlinePlay && resolved.embedUrl ? (
        <div className="relative bg-black">
          <iframe
            src={resolved.embedUrl}
            title={label}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className={`${heightClass} w-full border-0`}
          />
          {resolved.kind === "instagram" ? (
            <div className="border-t border-[rgba(237,237,237,0.08)] bg-[#19191b] px-3.5 py-2 text-[11px] text-[#a1a1a6]">
              If Instagram blocks inline playback, click{" "}
              <a
                href={resolved.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#ededed] underline"
              >
                Open
              </a>{" "}
              or attach a Google Drive backup link.
            </div>
          ) : null}
        </div>
      ) : (
        <div
          className={`flex ${heightClass} w-full flex-col items-center justify-center gap-3 p-6 text-center text-xs text-[#a1a1a6]`}
        >
          <PlayCircle className="h-8 w-8 text-[#85858b]" strokeWidth={1.5} />
          <p className="max-w-xs break-all text-[#85858b]">{resolved.originalUrl}</p>
          <a
            href={resolved.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#ededed] px-3.5 py-2 font-medium text-[#0f0f10]"
          >
            <span>Open link</span>
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
          </a>
        </div>
      )}
    </div>
  );
}
