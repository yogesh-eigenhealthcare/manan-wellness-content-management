import { normalizeReferenceUrl } from "../src/lib/videoEmbed";
import type { ContentFormat, EffortLevel, WorkflowStatus } from "../src/types/content";

export interface ParsedSheetExport {
  Reel_content?: string[][];
  Reels_post?: string[][];
  Post_content?: string[][];
  Hashtags?: string[][];
  [otherTab: string]: string[][] | undefined;
}

export interface ImportedContentItem {
  docId: string;
  serialNo: number;
  format: ContentFormat;
  title: string;
  topicType: string;
  effortLevel: EffortLevel;
  status: WorkflowStatus;
  referenceUrl: string;
  referenceBackupUrl: string;
  referenceNotes: string;
  adaptationIdea: string;
  callToAction: string;
  scriptUrl: string;
  scriptText: string;
  hashtags: string[];
  assignedTo: string[];
  targetPostDate: string | null;
}

export interface ImportedHashtagPreset {
  docId: string;
  category: string;
  tags: string[];
}

const EXCLUDED_PII_TABS = new Set(["pt_list", "Manan_wellness_clinic"]);

/**
 * Parses markdown hyperlink syntax `[display](url)` exported by gsheets CLI.
 */
export function parseMarkdownLink(raw: string): { text: string; url: string } {
  const trimmed = (raw || "").trim();
  if (!trimmed) return { text: "", url: "" };

  const mdMatch = trimmed.match(/^\[([\s\S]*?)\]\((https?:\/\/[^\s)]+)\)$/);
  if (mdMatch) {
    const label = mdMatch[1].trim();
    const url = mdMatch[2].trim();
    return { text: label === url ? "" : label, url };
  }

  if (/^https?:\/\/\S+$/i.test(trimmed)) {
    return { text: "", url: trimmed };
  }

  return { text: trimmed, url: "" };
}

function parseEffortLevel(raw: string): EffortLevel {
  const lower = (raw || "").trim().toLowerCase();
  if (lower.includes("low")) return "low";
  if (lower.includes("high")) return "high";
  return "general";
}

function parseAssignees(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[,/]/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .map((part) => {
      if (part === "pragati" || part.includes("pragati")) return "pragati mam";
      if (part.includes("animation")) return "animation team";
      if (part.includes("avantika")) return "avantika";
      return part;
    })
    .filter((val, idx, arr) => arr.indexOf(val) === idx);
}

function parseHashtagList(raw: string): string[] {
  if (!raw || raw.trim() === "1") return [];
  if (!raw.includes("#")) return [];
  return Array.from(
    new Set(
      raw
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.startsWith("#") && t.length > 1)
    )
  );
}

function parseShortDate(raw: string): string | null {
  const m = (raw || "").trim().match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;
  const day = m[1].padStart(2, "0");
  const month = m[2].padStart(2, "0");
  return `2026-${month}-${day}`;
}

function cleanHashtagToken(raw: string): string {
  const cleaned = raw
    .replace(/\(red heart\)/gi, "")
    .replace(/^#?theraaphy/i, "#therapy")
    .replace(/^#?theraphy/i, "#therapy")
    .trim();
  if (!cleaned) return "";
  return cleaned.startsWith("#") ? cleaned : `#${cleaned}`;
}

function normalizeCategoryName(raw: string): string {
  const lower = raw.trim().toLowerCase();
  if (lower === "theraphy") return "therapy";
  if (lower === "emothinal") return "emotional";
  return lower;
}

export function parseSheetExport(rawData: ParsedSheetExport): {
  items: ImportedContentItem[];
  hashtagPresets: ImportedHashtagPreset[];
} {
  // Defensive filter: never read clinical PII tabs even if present in input
  const safeData: ParsedSheetExport = {};
  for (const [tabName, rows] of Object.entries(rawData)) {
    if (!EXCLUDED_PII_TABS.has(tabName)) {
      safeData[tabName] = rows;
    }
  }

  const byNormalizedUrl = new Map<string, ImportedContentItem>();
  const itemsWithoutUrl: ImportedContentItem[] = [];
  let serialCounter = 0;

  // 1. Parse Reel_content (idea bank)
  const reelContentRows = (safeData.Reel_content ?? []).slice(1); // skip header
  for (const row of reelContentRows) {
    const linkInfo = parseMarkdownLink(row[1] ?? "");
    const rawCol2 = (row[2] ?? "").trim();
    const rawCol3 = (row[3] ?? "").trim();
    const cta = (row[4] ?? "").trim();
    const approvalNote = (row[5] ?? "").trim();
    const ideaNote = (row[7] ?? "").trim();

    if (!linkInfo.url && !rawCol3) continue;

    // Rows 82-85 in Reel_content are creator bio references without serial numbers
    const isCreatorRef = !(row[0] ?? "").trim() && !rawCol2;
    const title = isCreatorRef
      ? `Creator Reference: ${rawCol3.split("\n")[0]}`
      : rawCol3 || linkInfo.text || "Untitled Reel Idea";

    serialCounter += 1;
    const item: ImportedContentItem = {
      docId: `reel-${serialCounter}`,
      serialNo: serialCounter,
      format: "reel",
      title: title.slice(0, 200),
      topicType: rawCol2 || "General",
      effortLevel: "general",
      status: "idea_pending",
      referenceUrl: linkInfo.url,
      referenceBackupUrl: "",
      referenceNotes: isCreatorRef ? rawCol3 : approvalNote,
      adaptationIdea: ideaNote,
      callToAction: cta,
      scriptUrl: "",
      scriptText: "",
      hashtags: [],
      assignedTo: [],
      targetPostDate: null,
    };

    if (linkInfo.url) {
      const norm = normalizeReferenceUrl(linkInfo.url);
      if (!byNormalizedUrl.has(norm)) {
        byNormalizedUrl.set(norm, item);
      }
    } else {
      itemsWithoutUrl.push(item);
    }
  }

  // 2. Parse Reels_post (production queue) and deduplicate/merge into matching Reel_content items
  const reelsPostRows = (safeData.Reels_post ?? []).slice(2); // skip intro + header
  for (const row of reelsPostRows) {
    const refLink = parseMarkdownLink(row[1] ?? "");
    const scriptLink = parseMarkdownLink(row[2] ?? "");
    const rawHashtags = (row[3] ?? "").trim();
    const statusCol = (row[4] ?? "").trim().toLowerCase();
    const commentCol = (row[5] ?? "").trim();
    const addressToCol = (row[6] ?? "").trim();
    const effortCol = (row[7] ?? "").trim();
    const extraCol8 = (row[8] ?? "").trim();
    const extraCol9 = (row[9] ?? "").trim().toLowerCase();

    if (!refLink.url && !scriptLink.url && !scriptLink.text && !refLink.text) {
      continue;
    }

    const combinedStatusRaw = extraCol9 || statusCol;
    let mappedStatus: WorkflowStatus = "approved_for_production";
    if (combinedStatusRaw === "done") {
      mappedStatus = "approved_to_post";
    } else if (combinedStatusRaw === "pending") {
      mappedStatus = "in_production";
    }

    const parsedDate = parseShortDate(extraCol8);
    const extraNote = !parsedDate && extraCol8 ? extraCol8 : "";
    const mergedHashtags = parseHashtagList(rawHashtags);
    const mergedAssignees = parseAssignees(addressToCol);
    const mergedEffort = parseEffortLevel(effortCol);
    const nonHashtagNote =
      rawHashtags && !rawHashtags.includes("#") && rawHashtags !== "1"
        ? rawHashtags
        : "";

    const norm = refLink.url ? normalizeReferenceUrl(refLink.url) : "";
    const existing = norm ? byNormalizedUrl.get(norm) : undefined;

    if (existing) {
      if (scriptLink.text && existing.title.startsWith("Untitled")) {
        existing.title = scriptLink.text.slice(0, 200);
      } else if (scriptLink.text && existing.title.length < scriptLink.text.length && !existing.adaptationIdea) {
        existing.adaptationIdea = scriptLink.text;
      }
      existing.status = mappedStatus;
      existing.effortLevel = mergedEffort;
      if (scriptLink.url) existing.scriptUrl = scriptLink.url;
      if (scriptLink.text && !scriptLink.url) {
        existing.scriptText = scriptLink.text;
      }
      if (mergedHashtags.length > 0) existing.hashtags = mergedHashtags;
      if (mergedAssignees.length > 0) existing.assignedTo = mergedAssignees;
      if (parsedDate) existing.targetPostDate = parsedDate;
      const combinedNotes = [existing.referenceNotes, commentCol, extraNote, nonHashtagNote]
        .filter(Boolean)
        .join(" | ");
      existing.referenceNotes = combinedNotes.slice(0, 3000);
    } else {
      serialCounter += 1;
      const fallbackTitle =
        scriptLink.text ||
        refLink.text ||
        extraNote ||
        `Production Reel #${serialCounter}`;
      const newItem: ImportedContentItem = {
        docId: `reel-${serialCounter}`,
        serialNo: serialCounter,
        format: "reel",
        title: fallbackTitle.slice(0, 200),
        topicType: "General",
        effortLevel: mergedEffort,
        status: mappedStatus,
        referenceUrl: refLink.url,
        referenceBackupUrl: "",
        referenceNotes: [commentCol, extraNote, nonHashtagNote]
          .filter(Boolean)
          .join(" | ")
          .slice(0, 3000),
        adaptationIdea: !scriptLink.url && scriptLink.text ? scriptLink.text : "",
        callToAction: "",
        scriptUrl: scriptLink.url,
        scriptText: !scriptLink.url && scriptLink.text ? scriptLink.text : "",
        hashtags: mergedHashtags,
        assignedTo: mergedAssignees,
        targetPostDate: parsedDate,
      };
      if (norm) {
        byNormalizedUrl.set(norm, newItem);
      } else {
        itemsWithoutUrl.push(newItem);
      }
    }
  }

  // 3. Parse Post_content (carousels / static posts)
  const postRows = (safeData.Post_content ?? []).slice(1);
  let carouselCounter = 0;
  for (const row of postRows) {
    const link = parseMarkdownLink(row[1] ?? "");
    const note = (row[2] ?? "").trim();
    if (!link.url && !note) continue;
    serialCounter += 1;
    carouselCounter += 1;
    itemsWithoutUrl.push({
      docId: `carousel-${carouselCounter}`,
      serialNo: serialCounter,
      format: "carousel",
      title: (note || `Carousel Reference #${carouselCounter}`).slice(0, 200),
      topicType: "General",
      effortLevel: "low",
      status: "idea_pending",
      referenceUrl: link.url,
      referenceBackupUrl: "",
      referenceNotes: note,
      adaptationIdea: "",
      callToAction: "",
      scriptUrl: "",
      scriptText: "",
      hashtags: [],
      assignedTo: [],
      targetPostDate: null,
    });
  }

  // 4. Parse Hashtags tab into hashtagPresets
  const hashtagRows = safeData.Hashtags ?? [];
  const hashtagPresets: ImportedHashtagPreset[] = [];
  if (hashtagRows.length > 1) {
    const headers = hashtagRows[0];
    headers.forEach((rawCat, colIdx) => {
      const category = normalizeCategoryName(rawCat || "");
      if (!category) return;
      const tags: string[] = [];
      for (const row of hashtagRows.slice(1)) {
        const cleaned = cleanHashtagToken(row[colIdx] ?? "");
        if (cleaned && !tags.includes(cleaned)) {
          tags.push(cleaned);
        }
      }
      if (tags.length > 0) {
        hashtagPresets.push({
          docId: `preset-${category.replace(/[^a-z0-9]+/g, "-")}`,
          category,
          tags,
        });
      }
    });
  }

  const allItems = [...byNormalizedUrl.values(), ...itemsWithoutUrl].sort(
    (a, b) => a.serialNo - b.serialNo
  );

  return { items: allItems, hashtagPresets };
}
