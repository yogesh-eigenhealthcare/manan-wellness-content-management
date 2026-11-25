import { resolveVideoEmbed } from "@/lib/videoEmbed";
import type { ContentFormat } from "@/types/content";

export interface ThumbnailDescriptor {
  imageUrl: string | null;
  provider: "youtube" | "google-drive" | "instagram" | "direct" | "other";
  format: ContentFormat;
}

/**
 * Derives a preview thumbnail URL from a content item's primary/backup/draft link.
 */
export function resolveThumbnail(params: {
  format: ContentFormat;
  referenceUrl?: string | null;
  referenceBackupUrl?: string | null;
  latestDraftUrl?: string | null;
}): ThumbnailDescriptor {
  const candidates = [
    params.latestDraftUrl,
    params.referenceBackupUrl,
    params.referenceUrl,
  ].filter((u): u is string => Boolean(u && u.trim()));

  for (const url of candidates) {
    const resolved = resolveVideoEmbed(url);
    if (resolved.kind === "youtube" && resolved.embedUrl) {
      const id = resolved.embedUrl.split("/embed/")[1]?.split("?")[0];
      if (id) {
        return {
          imageUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          provider: "youtube",
          format: params.format,
        };
      }
    }
    if (resolved.kind === "google-drive" && resolved.embedUrl) {
      const match = resolved.embedUrl.match(/\/file\/d\/([^/]+)\//);
      if (match?.[1]) {
        return {
          imageUrl: `https://drive.google.com/thumbnail?id=${match[1]}&sz=w480`,
          provider: "google-drive",
          format: params.format,
        };
      }
    }
  }

  const primary = resolveVideoEmbed(params.referenceUrl || params.latestDraftUrl);
  if (primary.kind === "instagram") {
    return { imageUrl: null, provider: "instagram", format: params.format };
  }
  if (primary.kind === "direct-video") {
    return { imageUrl: null, provider: "direct", format: params.format };
  }

  return { imageUrl: null, provider: "other", format: params.format };
}
