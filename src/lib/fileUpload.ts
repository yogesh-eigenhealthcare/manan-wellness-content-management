import type { DraftKind } from "@/types/content";

export const MAX_DRAFT_DATA_URL_LENGTH = 900_000;

export interface PreparedDraftFile {
  draftKind: Extract<DraftKind, "image" | "pdf">;
  fileDataUrl: string;
  fileName: string;
  mimeType: string;
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read selected file."));
    reader.readAsDataURL(blob);
  });
}

function compressImageInBrowser(file: File): Promise<{ dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const maxDim = 1440;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Canvas context unavailable for image compression."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.85;
        let dataUrl = canvas.toDataURL("image/webp", quality);
        if (!dataUrl.startsWith("data:image/webp")) {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        while (dataUrl.length > MAX_DRAFT_DATA_URL_LENGTH && quality > 0.35) {
          quality -= 0.15;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        URL.revokeObjectURL(objectUrl);
        if (dataUrl.length > MAX_DRAFT_DATA_URL_LENGTH) {
          reject(
            new Error(
              "Image is still too large after compression. Please use a smaller image (under 650 KB) or paste a Drive link."
            )
          );
          return;
        }
        const mimeMatch = dataUrl.match(/^data:([^;]+);/);
        resolve({
          dataUrl,
          mimeType: mimeMatch?.[1] ?? "image/jpeg",
        });
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not decode the selected image."));
    };
    img.src = objectUrl;
  });
}

/**
 * Validates and prepares an image or PDF file for Firestore-backed preview
 * without requiring paid Firebase Storage buckets.
 */
export async function prepareDraftUploadFile(file: File): Promise<PreparedDraftFile> {
  const safeFileName = (file.name || "draft-file").trim().slice(0, 200);
  const isPdf =
    file.type === "application/pdf" || safeFileName.toLowerCase().endsWith(".pdf");
  const isImage =
    file.type.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif)$/i.test(safeFileName);

  if (!isPdf && !isImage) {
    throw new Error("Only PDF (.pdf) or Image (.png, .jpg, .webp) files are supported.");
  }

  if (isPdf) {
    const dataUrl = await readAsDataUrl(file);
    if (dataUrl.length > MAX_DRAFT_DATA_URL_LENGTH) {
      throw new Error(
        "PDF exceeds the 650 KB inline storage limit. Please compress the PDF or paste a Google Drive link instead."
      );
    }
    return {
      draftKind: "pdf",
      fileDataUrl: dataUrl,
      fileName: safeFileName,
      mimeType: "application/pdf",
    };
  }

  // Image: if already compact keep directly; otherwise compress smoothly
  const directUrl = await readAsDataUrl(file);
  if (directUrl.length <= MAX_DRAFT_DATA_URL_LENGTH) {
    return {
      draftKind: "image",
      fileDataUrl: directUrl,
      fileName: safeFileName,
      mimeType: (file.type || "image/png").slice(0, 100),
    };
  }

  const compressed = await compressImageInBrowser(file);
  return {
    draftKind: "image",
    fileDataUrl: compressed.dataUrl,
    fileName: safeFileName,
    mimeType: compressed.mimeType.slice(0, 100),
  };
}

export function validateDraftMutualExclusion(
  videoUrl: string,
  uploadFile: PreparedDraftFile | null
): { ok: true; mode: "video" | "file" } | { ok: false; error: string } {
  const hasVideo = Boolean(videoUrl.trim());
  const hasFile = Boolean(uploadFile);

  if (hasVideo && hasFile) {
    return {
      ok: false,
      error: "Choose either a video link OR a PDF/image upload, not both.",
    };
  }
  if (!hasVideo && !hasFile) {
    return {
      ok: false,
      error: "Provide a video link or upload a PDF/image file first.",
    };
  }
  return { ok: true, mode: hasVideo ? "video" : "file" };
}
