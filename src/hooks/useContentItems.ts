"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type {
  CommentActionType,
  ContentComment,
  ContentFormat,
  ContentItem,
  DraftSubmission,
  EffortLevel,
  HashtagPreset,
} from "@/types/content";

export interface SubmitIdeaInput {
  format: ContentFormat;
  title: string;
  topicType: string;
  effortLevel: EffortLevel;
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

export function useContentItems() {
  const { user, profile, isManager } = useAuth();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [hashtagPresets, setHashtagPresets] = useState<HashtagPreset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setHashtagPresets([]);
      setLoading(false);
      return;
    }

    const unsubItems = onSnapshot(
      query(collection(db, "contentItems"), orderBy("updatedAt", "desc")),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ContentItem, "id">),
        }));
        setItems(list);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to subscribe to contentItems:", err);
        setLoading(false);
      }
    );

    const unsubHashtags = onSnapshot(
      query(collection(db, "hashtagPresets"), orderBy("category", "asc")),
      (snap) => {
        setHashtagPresets(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<HashtagPreset, "id">),
          }))
        );
      }
    );

    return () => {
      unsubItems();
      unsubHashtags();
    };
  }, [user]);

  const actorName = profile?.displayName || profile?.email || "Team Member";
  const actorRole = isManager ? "manager" : "member";

  const addAuditComment = async (
    itemId: string,
    actionType: CommentActionType,
    body: string,
    draftVersion: number | null = null,
    timestampLabel: string | null = null
  ) => {
    if (!user) throw new Error("Not authenticated");
    await addDoc(collection(db, "contentItems", itemId, "comments"), {
      authorUid: user.uid,
      authorName: actorName,
      authorRole: actorRole,
      actionType,
      draftVersion,
      timestampLabel,
      body: body.trim(),
      createdAt: serverTimestamp(),
    });
  };

  const submitIdea = async (input: SubmitIdeaInput): Promise<string> => {
    if (!user) throw new Error("Not authenticated");
    const maxSerial = items.reduce(
      (max, item) => (item.serialNo > max ? item.serialNo : max),
      0
    );

    const docRef = await addDoc(collection(db, "contentItems"), {
      serialNo: maxSerial + 1,
      format: input.format,
      title: input.title.trim(),
      topicType: input.topicType,
      effortLevel: input.effortLevel,
      status: "idea_pending",
      referenceUrl: input.referenceUrl.trim(),
      referenceBackupUrl: input.referenceBackupUrl.trim(),
      referenceNotes: input.referenceNotes.trim(),
      adaptationIdea: input.adaptationIdea.trim(),
      callToAction: input.callToAction.trim(),
      scriptUrl: input.scriptUrl.trim(),
      scriptText: input.scriptText.trim(),
      hashtags: input.hashtags,
      assignedTo: input.assignedTo,
      targetPostDate: input.targetPostDate || null,
      latestDraftUrl: null,
      latestDraftVersion: 0,
      publishedUrl: null,
      gate1ReviewedBy: null,
      gate1ReviewedAt: null,
      gate1Feedback: null,
      gate2ReviewedBy: null,
      gate2ReviewedAt: null,
      gate2Feedback: null,
      createdByUid: user.uid,
      createdByName: actorName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  };

  const reviewGate1 = async (
    itemId: string,
    decision: "approved_for_production" | "idea_rejected",
    feedback: string,
    overrides?: { assignedTo?: string[]; effortLevel?: EffortLevel }
  ) => {
    if (!isManager) {
      throw new Error("Only the Marketing Manager can approve or decline ideas.");
    }
    const payload: Record<string, unknown> = {
      status: decision,
      gate1ReviewedBy: actorName,
      gate1ReviewedAt: serverTimestamp(),
      gate1Feedback: feedback.trim(),
      updatedAt: serverTimestamp(),
    };
    if (overrides?.assignedTo) {
      payload.assignedTo = overrides.assignedTo;
    }
    if (overrides?.effortLevel) {
      payload.effortLevel = overrides.effortLevel;
    }

    await updateDoc(doc(db, "contentItems", itemId), payload);
    await addAuditComment(
      itemId,
      decision === "approved_for_production" ? "gate1_approve" : "gate1_reject",
      feedback.trim() ||
        (decision === "approved_for_production"
          ? "Approved for recreation."
          : "Declined at idea review.")
    );
  };

  const resubmitIdea = async (itemId: string, notes?: string) => {
    await updateDoc(doc(db, "contentItems", itemId), {
      status: "idea_pending",
      updatedAt: serverTimestamp(),
    });
    if (notes?.trim()) {
      await addAuditComment(itemId, "comment", `Re-submitted idea: ${notes.trim()}`);
    }
  };

  const startProduction = async (itemId: string) => {
    await updateDoc(doc(db, "contentItems", itemId), {
      status: "in_production",
      updatedAt: serverTimestamp(),
    });
  };

  const submitDraftLink = async (
    itemId: string,
    currentVersion: number,
    videoUrl: string,
    notes: string
  ) => {
    if (!user) throw new Error("Not authenticated");
    const nextVersion = currentVersion + 1;
    const cleanUrl = videoUrl.trim();
    const cleanNotes = notes.trim();

    await updateDoc(doc(db, "contentItems", itemId), {
      status: "draft_review",
      latestDraftUrl: cleanUrl,
      latestDraftVersion: nextVersion,
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, "contentItems", itemId, "drafts"), {
      version: nextVersion,
      videoUrl: cleanUrl,
      notes: cleanNotes,
      submittedByUid: user.uid,
      submittedByName: actorName,
      submittedAt: serverTimestamp(),
    });

    await addAuditComment(
      itemId,
      "draft_submit",
      cleanNotes || `Submitted draft v${nextVersion} for manager review.`,
      nextVersion
    );
  };

  const reviewGate2 = async (
    itemId: string,
    draftVersion: number,
    decision: "approved_to_post" | "changes_requested",
    feedback: string
  ) => {
    if (!isManager) {
      throw new Error("Only the Marketing Manager can approve or request changes on drafts.");
    }
    const cleanFeedback = feedback.trim();
    await updateDoc(doc(db, "contentItems", itemId), {
      status: decision,
      gate2ReviewedBy: actorName,
      gate2ReviewedAt: serverTimestamp(),
      gate2Feedback: cleanFeedback,
      updatedAt: serverTimestamp(),
    });

    await addAuditComment(
      itemId,
      decision === "approved_to_post" ? "gate2_approve" : "gate2_request_changes",
      cleanFeedback ||
        (decision === "approved_to_post"
          ? `Approved draft v${draftVersion} for posting.`
          : `Requested changes on draft v${draftVersion}.`),
      draftVersion
    );
  };

  const markPosted = async (itemId: string, publishedUrl: string) => {
    const cleanUrl = publishedUrl.trim();
    await updateDoc(doc(db, "contentItems", itemId), {
      status: "posted",
      publishedUrl: cleanUrl,
      updatedAt: serverTimestamp(),
    });
    await addAuditComment(itemId, "posted", `Published live: ${cleanUrl}`);
  };

  const updateItemDetails = async (
    itemId: string,
    updates: Partial<
      Pick<
        ContentItem,
        | "title"
        | "format"
        | "topicType"
        | "effortLevel"
        | "referenceUrl"
        | "referenceBackupUrl"
        | "referenceNotes"
        | "adaptationIdea"
        | "callToAction"
        | "scriptUrl"
        | "scriptText"
        | "hashtags"
        | "assignedTo"
        | "targetPostDate"
      >
    >
  ) => {
    await updateDoc(doc(db, "contentItems", itemId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteContentItem = async (itemId: string) => {
    if (!isManager) {
      throw new Error("Only the Marketing Manager can delete content items.");
    }
    await deleteDoc(doc(db, "contentItems", itemId));
  };

  return {
    items,
    hashtagPresets,
    loading,
    submitIdea,
    reviewGate1,
    resubmitIdea,
    startProduction,
    submitDraftLink,
    reviewGate2,
    markPosted,
    updateItemDetails,
    deleteContentItem,
    addAuditComment,
  };
}

export function useItemSubcollections(itemId: string | null) {
  const [drafts, setDrafts] = useState<DraftSubmission[]>([]);
  const [comments, setComments] = useState<ContentComment[]>([]);

  useEffect(() => {
    if (!itemId) {
      setDrafts([]);
      setComments([]);
      return;
    }

    const unsubDrafts = onSnapshot(
      query(
        collection(db, "contentItems", itemId, "drafts"),
        orderBy("version", "desc")
      ),
      (snap) => {
        setDrafts(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<DraftSubmission, "id">),
          }))
        );
      }
    );

    const unsubComments = onSnapshot(
      query(
        collection(db, "contentItems", itemId, "comments"),
        orderBy("createdAt", "asc")
      ),
      (snap) => {
        setComments(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ContentComment, "id">),
          }))
        );
      }
    );

    return () => {
      unsubDrafts();
      unsubComments();
    };
  }, [itemId]);

  return { drafts, comments };
}
