import fs from "node:fs";
import path from "node:path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { parseSheetExport } from "./sheet-parser";

const PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "manan-content-management";

function initAdmin() {
  if (getApps().length > 0) return;
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath && fs.existsSync(credPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(credPath, "utf8"));
    initializeApp({
      credential: cert(serviceAccount),
      projectId: PROJECT_ID,
    });
  } else {
    initializeApp({ projectId: PROJECT_ID });
  }
}

async function main() {
  initAdmin();
  const db = getFirestore();

  const exportPath = path.resolve(process.cwd(), "scripts/data/sheet-export.json");
  const raw = JSON.parse(fs.readFileSync(exportPath, "utf8"));
  const { items, hashtagPresets } = parseSheetExport(raw);

  console.log(
    `Importing ${items.length} deduplicated content items and ${hashtagPresets.length} hashtag presets into project "${PROJECT_ID}"...`
  );

  let batch = db.batch();
  let opCount = 0;

  const commitBatch = async () => {
    if (opCount > 0) {
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
  };

  for (const item of items) {
    const ref = db.collection("contentItems").doc(item.docId);
    batch.set(
      ref,
      {
        serialNo: item.serialNo,
        format: item.format,
        title: item.title,
        topicType: item.topicType,
        effortLevel: item.effortLevel,
        status: item.status,
        referenceUrl: item.referenceUrl,
        referenceBackupUrl: item.referenceBackupUrl,
        referenceNotes: item.referenceNotes,
        adaptationIdea: item.adaptationIdea,
        callToAction: item.callToAction,
        scriptUrl: item.scriptUrl,
        scriptText: item.scriptText,
        hashtags: item.hashtags,
        assignedTo: item.assignedTo,
        targetPostDate: item.targetPostDate,
        latestDraftUrl: null,
        latestDraftVersion: 0,
        publishedUrl: null,
        gate1ReviewedBy:
          item.status !== "idea_pending" ? "Imported from Sheet" : null,
        gate1ReviewedAt:
          item.status !== "idea_pending" ? FieldValue.serverTimestamp() : null,
        gate1Feedback: null,
        gate2ReviewedBy:
          item.status === "approved_to_post" ? "Imported from Sheet" : null,
        gate2ReviewedAt:
          item.status === "approved_to_post" ? FieldValue.serverTimestamp() : null,
        gate2Feedback: null,
        createdByUid: "sheet-import",
        createdByName: "Manan Sheet Import",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    opCount += 1;
    if (opCount >= 400) {
      await commitBatch();
    }
  }

  for (const preset of hashtagPresets) {
    const ref = db.collection("hashtagPresets").doc(preset.docId);
    batch.set(
      ref,
      {
        category: preset.category,
        tags: preset.tags,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    opCount += 1;
    if (opCount >= 400) {
      await commitBatch();
    }
  }

  await commitBatch();
  console.log("Sheet import completed successfully.");
}

main().catch((err) => {
  console.error("Sheet import failed:", err);
  process.exit(1);
});
