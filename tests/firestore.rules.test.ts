import fs from "node:fs";
import path from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

let testEnv: RulesTestEnvironment;

const PROJECT_ID = "manan-content-management";

function baseContentItem(createdByUid: string) {
  return {
    serialNo: 1,
    format: "reel",
    title: "5 4 3 2 1 Grounding Technique",
    topicType: "Anxiety",
    effortLevel: "low",
    status: "idea_pending",
    referenceUrl: "https://www.instagram.com/reel/DXwOOyhTirX/",
    referenceBackupUrl: "",
    referenceNotes: "Soft piano BGM",
    adaptationIdea: "Dr. Pragati explaining in Hindi",
    callToAction: "Save this for anxious days",
    scriptUrl: "",
    scriptText: "",
    hashtags: ["#MananWellness", "#AnxietyRelief"],
    assignedTo: ["pragati mam"],
    targetPostDate: null,
    latestDraftUrl: null,
    latestDraftVersion: 0,
    publishedUrl: null,
    gate1ReviewedBy: null,
    gate1ReviewedAt: null,
    gate1Feedback: null,
    gate2ReviewedBy: null,
    gate2ReviewedAt: null,
    gate2Feedback: null,
    createdByUid,
    createdByName: "Team Member",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

describe("firestore.rules two-gate approval security", () => {
  beforeAll(async () => {
    const rules = fs.readFileSync(
      path.resolve(process.cwd(), "firestore.rules"),
      "utf8"
    );
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: { rules, host: "127.0.0.1", port: 8080 },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, "users", "manager-1"), {
        uid: "manager-1",
        email: "manager@manan.com",
        displayName: "Marketing Manager",
        photoURL: "",
        role: "manager",
        teamTag: "Marketing Manager",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, "users", "member-1"), {
        uid: "member-1",
        email: "member@manan.com",
        displayName: "Animation Team",
        photoURL: "",
        role: "member",
        teamTag: "Animation Team",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it("blocks unauthenticated writes and self-escalation to manager", async () => {
    const anonDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(anonDb, "contentItems", "item-1"), baseContentItem("anon"))
    );

    const memberDb = testEnv
      .authenticatedContext("member-1", { email: "member@manan.com" })
      .firestore();
    await assertFails(
      updateDoc(doc(memberDb, "users", "member-1"), {
        role: "manager",
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("enforces manager-only Gate 1 and Gate 2 approvals while letting members submit ideas and drafts", async () => {
    const memberDb = testEnv
      .authenticatedContext("member-1", { email: "member@manan.com" })
      .firestore();
    const managerDb = testEnv
      .authenticatedContext("manager-1", { email: "manager@manan.com" })
      .firestore();

    // 1. Member submits idea (reel and long_form both permitted)
    await assertSucceeds(
      setDoc(doc(memberDb, "contentItems", "reel-1"), baseContentItem("member-1"))
    );
    await assertSucceeds(
      setDoc(doc(memberDb, "contentItems", "long-1"), {
        ...baseContentItem("member-1"),
        format: "long_form",
      })
    );

    // 2. Member CANNOT approve Gate 1
    await assertFails(
      updateDoc(doc(memberDb, "contentItems", "reel-1"), {
        status: "approved_for_production",
        updatedAt: serverTimestamp(),
      })
    );

    // 3. Manager approves Gate 1
    await assertSucceeds(
      updateDoc(doc(managerDb, "contentItems", "reel-1"), {
        status: "approved_for_production",
        gate1ReviewedBy: "Marketing Manager",
        gate1ReviewedAt: serverTimestamp(),
        gate1Feedback: "Go ahead",
        updatedAt: serverTimestamp(),
      })
    );

    // 4. Member starts production & submits draft link v1
    await assertSucceeds(
      updateDoc(doc(memberDb, "contentItems", "reel-1"), {
        status: "in_production",
        updatedAt: serverTimestamp(),
      })
    );
    await assertSucceeds(
      updateDoc(doc(memberDb, "contentItems", "reel-1"), {
        status: "draft_review",
        latestDraftUrl: "https://drive.google.com/file/d/abc123/view",
        latestDraftVersion: 1,
        updatedAt: serverTimestamp(),
      })
    );

    // 5. Member CANNOT approve Gate 2
    await assertFails(
      updateDoc(doc(memberDb, "contentItems", "reel-1"), {
        status: "approved_to_post",
        updatedAt: serverTimestamp(),
      })
    );

    // 6. Manager approves Gate 2
    await assertSucceeds(
      updateDoc(doc(managerDb, "contentItems", "reel-1"), {
        status: "approved_to_post",
        gate2ReviewedBy: "Marketing Manager",
        gate2ReviewedAt: serverTimestamp(),
        gate2Feedback: "Ready to post!",
        updatedAt: serverTimestamp(),
      })
    );

    // 7. Member marks Posted with live URL
    await assertSucceeds(
      updateDoc(doc(memberDb, "contentItems", "reel-1"), {
        status: "posted",
        publishedUrl: "https://www.instagram.com/reel/LIVE123/",
        updatedAt: serverTimestamp(),
      })
    );
  });
});
