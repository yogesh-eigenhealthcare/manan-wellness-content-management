import { describe, expect, it } from "vitest";
import { validateDraftMutualExclusion, type PreparedDraftFile } from "./fileUpload";

describe("validateDraftMutualExclusion", () => {
  const sampleFile: PreparedDraftFile = {
    draftKind: "pdf",
    fileDataUrl: "data:application/pdf;base64,JVBERi0=",
    fileName: "storyboard.pdf",
    mimeType: "application/pdf",
  };

  it("allows video link alone", () => {
    expect(
      validateDraftMutualExclusion("https://drive.google.com/file/d/abc/view", null)
    ).toEqual({ ok: true, mode: "video" });
  });

  it("allows PDF/image file upload alone", () => {
    expect(validateDraftMutualExclusion("", sampleFile)).toEqual({
      ok: true,
      mode: "file",
    });
  });

  it("rejects having both a video link and an uploaded file at the same time", () => {
    const res = validateDraftMutualExclusion(
      "https://drive.google.com/file/d/abc/view",
      sampleFile
    );
    expect(res.ok).toBe(false);
  });

  it("rejects submitting neither a video link nor a file", () => {
    const res = validateDraftMutualExclusion("   ", null);
    expect(res.ok).toBe(false);
  });
});
