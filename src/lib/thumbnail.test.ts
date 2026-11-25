import { describe, expect, it } from "vitest";
import { resolveThumbnail } from "./thumbnail";

describe("resolveThumbnail", () => {
  it("extracts YouTube thumbnail URL", () => {
    const res = resolveThumbnail({
      format: "reel",
      referenceUrl: "https://youtu.be/iuu1XSd4pxY?si=123",
    });
    expect(res.provider).toBe("youtube");
    expect(res.imageUrl).toBe("https://i.ytimg.com/vi/iuu1XSd4pxY/hqdefault.jpg");
  });

  it("extracts Google Drive thumbnail URL and prioritizes latestDraftUrl", () => {
    const res = resolveThumbnail({
      format: "long_form",
      referenceUrl: "https://www.instagram.com/reel/DZ-pcctqPrL/",
      latestDraftUrl: "https://drive.google.com/file/d/1AbCdEfGh/view?usp=sharing",
    });
    expect(res.provider).toBe("google-drive");
    expect(res.imageUrl).toBe("https://drive.google.com/thumbnail?id=1AbCdEfGh&sz=w480");
  });

  it("returns instagram provider fallback when no image thumbnail URL is available", () => {
    const res = resolveThumbnail({
      format: "reel",
      referenceUrl: "https://www.instagram.com/reel/DZ-pcctqPrL/",
    });
    expect(res.provider).toBe("instagram");
    expect(res.imageUrl).toBeNull();
  });
});
