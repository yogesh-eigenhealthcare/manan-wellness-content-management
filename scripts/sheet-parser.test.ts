import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseSheetExport } from "./sheet-parser";

describe("parseSheetExport", () => {
  it("deduplicates overlapping Reel_content and Reels_post URLs and maps 'done' to approved_to_post", () => {
    const exportPath = path.resolve(process.cwd(), "scripts/data/sheet-export.json");
    const raw = JSON.parse(fs.readFileSync(exportPath, "utf8"));

    const { items, hashtagPresets } = parseSheetExport(raw);

    // 21 overlapping URLs merged cleanly: 84 + 29 - 21 + 9 carousels = 101 (or close after empty/duplicate check)
    expect(items.length).toBeGreaterThanOrEqual(95);
    expect(items.length).toBeLessThanOrEqual(105);

    const doneItems = items.filter((i) => i.status === "approved_to_post");
    expect(doneItems.length).toBe(4);

    const pendingItems = items.filter((i) => i.status === "in_production");
    expect(pendingItems.length).toBe(1);

    const carouselItems = items.filter((i) => i.format === "carousel");
    expect(carouselItems.length).toBe(9);

    expect(hashtagPresets.length).toBe(6);
    const therapyPreset = hashtagPresets.find((p) => p.category === "therapy");
    expect(therapyPreset?.tags).toContain("#therapy");
  });

  it("ignores clinical PII tabs even if passed in", () => {
    const { items } = parseSheetExport({
      pt_list: [["FALSE", "", "Patient Name", "", "30"]],
      Manan_wellness_clinic: [["FALSE", "1", "Patient"]],
      Reel_content: [["S. No.", "Reel URL", "Type", "Content"]],
    });
    expect(items).toHaveLength(0);
  });
});
