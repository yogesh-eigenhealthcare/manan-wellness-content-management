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

  it("routes Instagram reel and post URLs through /api/thumbnail", () => {
    const res = resolveThumbnail({
      format: "reel",
      referenceUrl: "https://www.instagram.com/reel/DZ-pcctqPrL/",
    });
    expect(res.provider).toBe("instagram");
    expect(res.imageUrl).toBe(
      "/api/thumbnail?url=https%3A%2F%2Fwww.instagram.com%2Freel%2FDZ-pcctqPrL%2F"
    );
  });
});
