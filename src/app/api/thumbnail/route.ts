import { NextRequest, NextResponse } from "next/server";

const ALLOWED_IG_HOSTS = new Set(["instagram.com", "www.instagram.com", "instagr.am"]);
const ALLOWED_CDN_SUFFIXES = [".fbcdn.net", ".cdninstagram.com"];

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseInstagramTarget(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    const host = parsed.hostname.toLowerCase();
    if (!ALLOWED_IG_HOSTS.has(host)) return null;

    const match = parsed.pathname.match(/^\/(reel|reels|p|tv)\/([a-zA-Z0-9_-]+)/);
    if (!match) return null;
    const segment = match[1] === "p" ? "p" : "reel";
    return `https://www.instagram.com/${segment}/${match[2]}/embed/`;
  } catch {
    return null;
  }
}

function isAllowedImageCdnUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_CDN_SUFFIXES.some((suffix) => host.endsWith(suffix));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url") ?? "";
  const embedUrl = parseInstagramTarget(rawUrl);
  if (!embedUrl) {
    return NextResponse.json({ error: "Unsupported URL" }, { status: 400 });
  }

  try {
    const embedRes = await fetch(embedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 3600 },
    });

    if (!embedRes.ok) {
      return new NextResponse(null, { status: 404 });
    }

    const html = await embedRes.text();
    const imgMatch =
      html.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/) ??
      html.match(/src="([^"]+)"[^>]*class="EmbeddedMediaImage"/);

    if (!imgMatch?.[1]) {
      return new NextResponse(null, { status: 404 });
    }

    const imageUrl = decodeHtmlEntities(imgMatch[1]);
    if (!isAllowedImageCdnUrl(imageUrl)) {
      return new NextResponse(null, { status: 404 });
    }

    const imgRes = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
      next: { revalidate: 86400 },
    });

    if (!imgRes.ok) {
      return new NextResponse(null, { status: 404 });
    }

    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const buffer = await imgRes.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
