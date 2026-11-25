import { describe, expect, it } from "vitest";
import { normalizeReferenceUrl, resolveVideoEmbed } from "./videoEmbed";

describe("resolveVideoEmbed", () => {
  it("converts Google Drive view and open URLs to preview embeds", () => {
    const viewRes = resolveVideoEmbed(
      "https://drive.google.com/file/d/1AbCdEfGhIjK/view?usp=sharing"
    );
    expect(viewRes.kind).toBe("google-drive");
    expect(viewRes.embedUrl).toBe("https://drive.google.com/file/d/1AbCdEfGhIjK/preview");
    expect(viewRes.canInlinePlay).toBe(true);

    const openRes = resolveVideoEmbed(
      "https://drive.google.com/open?id=9ZyXwVuTsRqP"
    );
    expect(openRes.kind).toBe("google-drive");
    expect(openRes.embedUrl).toBe("https://drive.google.com/file/d/9ZyXwVuTsRqP/preview");
  });

  it("converts YouTube watch, youtu.be, and Shorts URLs to embed URLs", () => {
    expect(
      resolveVideoEmbed("https://youtu.be/iuu1XSd4pxY?si=KVNYhBap97Ficu2z").embedUrl
    ).toBe("https://www.youtube.com/embed/iuu1XSd4pxY");

    expect(
      resolveVideoEmbed("https://www.youtube.com/watch?v=mSlv5G-2NLg&t=10").embedUrl
    ).toBe("https://www.youtube.com/embed/mSlv5G-2NLg");

    expect(
      resolveVideoEmbed("https://www.youtube.com/shorts/abc123XYZ").embedUrl
    ).toBe("https://www.youtube.com/embed/abc123XYZ");
  });

  it("resolves Instagram Reel and Post links", () => {
    const reel = resolveVideoEmbed(
      "https://www.instagram.com/reel/DZ-pcctqPrL/?mdxt=Zjk1"
    );
    expect(reel.kind).toBe("instagram");
    expect(reel.embedUrl).toBe("https://www.instagram.com/reel/DZ-pcctqPrL/embed/");

    const post = resolveVideoEmbed(
      "https://www.instagram.com/p/DaxfygiEmzU/?psln=aW55"
    );
    expect(post.kind).toBe("instagram");
    expect(post.embedUrl).toBe("https://www.instagram.com/p/DaxfygiEmzU/embed/");
  });

  it("handles Loom, Vimeo, and direct video URLs", () => {
    expect(resolveVideoEmbed("https://www.loom.com/share/abcd1234").embedUrl).toBe(
      "https://www.loom.com/embed/abcd1234"
    );
    expect(resolveVideoEmbed("https://vimeo.com/123456789").embedUrl).toBe(
      "https://player.vimeo.com/video/123456789"
    );
    expect(resolveVideoEmbed("https://cdn.example.com/draft-v1.mp4").kind).toBe(
      "direct-video"
    );
  });

  it("handles empty or invalid URLs gracefully", () => {
    expect(resolveVideoEmbed("").kind).toBe("none");
    expect(resolveVideoEmbed("Don't have reference reel").kind).toBe("none");
  });
});

describe("normalizeReferenceUrl", () => {
  it("strips tracking query params from Instagram URLs for deduplication", () => {
    expect(
      normalizeReferenceUrl(
        "https://www.instagram.com/reel/C8wBWCAB-4l/?utm_source=ig_web_copy_link&stkn=MzRl"
      )
    ).toBe("https://www.instagram.com/reel/C8wBWCAB-4l");
  });
});
