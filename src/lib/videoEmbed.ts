export type EmbedKind =
  | "google-drive"
  | "youtube"
  | "vimeo"
  | "loom"
  | "streamable"
  | "instagram"
  | "direct-video"
  | "external"
  | "none";

export interface ResolvedVideoEmbed {
  kind: EmbedKind;
  providerLabel: string;
  originalUrl: string;
  embedUrl: string | null;
  canInlinePlay: boolean;
}

const DIRECT_VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i;

function safeParseUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Resolves a pasted video URL (Google Drive, YouTube/Shorts, Vimeo, Loom,
 * Streamable, Instagram Reel/Post, or direct video file) into an inline-playable
 * embed descriptor without requiring binary video storage.
 */
export function resolveVideoEmbed(rawUrl: string | null | undefined): ResolvedVideoEmbed {
  if (!rawUrl || !rawUrl.trim()) {
    return {
      kind: "none",
      providerLabel: "No Link",
      originalUrl: "",
      embedUrl: null,
      canInlinePlay: false,
    };
  }

  const parsed = safeParseUrl(rawUrl);
  if (!parsed) {
    return {
      kind: "none",
      providerLabel: "Invalid Link",
      originalUrl: rawUrl.trim(),
      embedUrl: null,
      canInlinePlay: false,
    };
  }

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const pathname = parsed.pathname;

  // Google Drive: /file/d/<ID>/view, /file/d/<ID>/preview, /open?id=<ID>, /uc?id=<ID>
  if (host === "drive.google.com" || host === "docs.google.com") {
    const fileMatch = pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    const idParam = parsed.searchParams.get("id");
    const fileId = fileMatch?.[1] ?? idParam;
    if (fileId) {
      return {
        kind: "google-drive",
        providerLabel: "Google Drive",
        originalUrl: parsed.toString(),
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        canInlinePlay: true,
      };
    }
  }

  // YouTube & YouTube Shorts
  if (host === "youtu.be" || host === "youtube.com" || host === "m.youtube.com") {
    let videoId: string | null = null;
    if (host === "youtu.be") {
      videoId = pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (pathname.startsWith("/shorts/")) {
      videoId = pathname.split("/")[2] ?? null;
    } else if (pathname.startsWith("/embed/")) {
      videoId = pathname.split("/")[2] ?? null;
    } else if (pathname === "/watch") {
      videoId = parsed.searchParams.get("v");
    }

    if (videoId) {
      return {
        kind: "youtube",
        providerLabel: "YouTube",
        originalUrl: parsed.toString(),
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        canInlinePlay: true,
      };
    }
  }

  // Vimeo
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const vimeoMatch = pathname.match(/\/(?:video\/)?(\d+)/);
    if (vimeoMatch?.[1]) {
      return {
        kind: "vimeo",
        providerLabel: "Vimeo",
        originalUrl: parsed.toString(),
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
        canInlinePlay: true,
      };
    }
  }

  // Loom
  if (host === "loom.com") {
    const loomMatch = pathname.match(/\/(?:share|embed)\/([a-zA-Z0-9]+)/);
    if (loomMatch?.[1]) {
      return {
        kind: "loom",
        providerLabel: "Loom",
        originalUrl: parsed.toString(),
        embedUrl: `https://www.loom.com/embed/${loomMatch[1]}`,
        canInlinePlay: true,
      };
    }
  }

  // Streamable
  if (host === "streamable.com") {
    const streamMatch = pathname.match(/\/(?:e\/)?([a-zA-Z0-9]+)$/);
    if (streamMatch?.[1]) {
      return {
        kind: "streamable",
        providerLabel: "Streamable",
        originalUrl: parsed.toString(),
        embedUrl: `https://streamable.com/e/${streamMatch[1]}`,
        canInlinePlay: true,
      };
    }
  }

  // Instagram Reels / Posts
  if (host === "instagram.com" || host === "instagr.am") {
    const igMatch = pathname.match(/\/(reel|reels|p|tv)\/([a-zA-Z0-9_-]+)/);
    if (igMatch?.[2]) {
      const kindSegment = igMatch[1] === "p" ? "p" : "reel";
      return {
        kind: "instagram",
        providerLabel: kindSegment === "p" ? "Instagram Post" : "Instagram Reel",
        originalUrl: parsed.toString(),
        embedUrl: `https://www.instagram.com/${kindSegment}/${igMatch[2]}/embed/`,
        canInlinePlay: true,
      };
    }
  }

  // Direct MP4 / WebM / MOV URL
  if (DIRECT_VIDEO_EXTENSIONS.test(pathname)) {
    return {
      kind: "direct-video",
      providerLabel: "Direct Video",
      originalUrl: parsed.toString(),
      embedUrl: parsed.toString(),
      canInlinePlay: true,
    };
  }

  return {
    kind: "external",
    providerLabel: host,
    originalUrl: parsed.toString(),
    embedUrl: null,
    canInlinePlay: false,
  };
}

/**
 * Normalizes Instagram/YouTube URLs for deduplication by stripping tracking query params.
 */
export function normalizeReferenceUrl(rawUrl: string): string {
  const parsed = safeParseUrl(rawUrl);
  if (!parsed) return rawUrl.trim();
  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  if (host === "instagram.com" || host === "youtu.be") {
    return `https://${parsed.hostname}${parsed.pathname}`.replace(/\/+$/, "");
  }
  return parsed.toString().replace(/\/+$/, "");
}
