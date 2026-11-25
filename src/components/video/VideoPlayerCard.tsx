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
    <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-slate-950 text-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900 px-3 py-2.5 text-xs">
        <div className="flex items-center gap-2 font-medium text-slate-200">
          <Film className="h-3.5 w-3.5 text-teal-400" />
          <span>{label}</span>
          <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
            {resolved.providerLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasBackup ? (
            <button
              type="button"
              onClick={() => setUseBackup((v) => !v)}
              className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700"
            >
              {useBackup ? "Show Primary Link" : "Switch to Backup Link"}
            </button>
          ) : null}
          {resolved.originalUrl ? (
            <a
              href={resolved.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-teal-600/90 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-teal-500"
            >
              Open <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>
      </div>

      {resolved.kind === "none" ? (
        <div
          className={`flex ${heightClass} w-full flex-col items-center justify-center gap-2 bg-slate-900/70 p-6 text-center text-xs text-slate-400`}
        >
          <PlayCircle className="h-9 w-9 text-slate-600" />
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
            <div className="border-t border-slate-800 bg-slate-900/95 px-3 py-1.5 text-[11px] text-slate-400">
              If Instagram blocks inline playback for this item, click{" "}
              <a
                href={resolved.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-teal-400 underline"
              >
                Open
              </a>{" "}
              or paste a Google Drive backup link.
            </div>
          ) : null}
        </div>
      ) : (
        <div
          className={`flex ${heightClass} w-full flex-col items-center justify-center gap-3 p-6 text-center text-xs text-slate-300`}
        >
          <PlayCircle className="h-9 w-9 text-teal-400" />
          <p className="max-w-xs break-all text-slate-400">{resolved.originalUrl}</p>
          <a
            href={resolved.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 font-medium text-white hover:bg-teal-500"
          >
            Open Video in New Tab <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
