"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ContentDetailView } from "@/components/review/ContentDetailView";
import { useContent } from "@/contexts/ContentContext";

const BACK_LABELS: Record<string, { label: string; href: string }> = {
  dashboard: { label: "Dashboard", href: "/dashboard" },
  content: { label: "Channel Content", href: "/content" },
  board: { label: "Workflow Board", href: "/board" },
};

function ItemDetailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const content = useContent();

  const itemId = searchParams.get("id");
  const from = searchParams.get("from") || "content";
  const backTarget = BACK_LABELS[from] ?? BACK_LABELS.content;

  const item = content.items.find((i) => i.id === itemId) ?? null;

  if (content.loading) {
    return (
      <div className="studio-surface rounded-2xl border p-12 text-center text-sm text-[var(--text-muted)]">
        Loading content item...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="studio-surface space-y-3 rounded-2xl border p-10 text-center">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Content item not found.
        </p>
        <button
          type="button"
          onClick={() => router.push(backTarget.href)}
          className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
        >
          Back to {backTarget.label}
        </button>
      </div>
    );
  }

  return (
    <ContentDetailView
      item={item}
      backLabel={backTarget.label}
      hashtagPresets={content.hashtagPresets}
      onBack={() => router.push(backTarget.href)}
      actions={{
        reviewGate1: content.reviewGate1,
        resubmitIdea: content.resubmitIdea,
        startProduction: content.startProduction,
        submitDraftLink: content.submitDraftLink,
        submitDraftFile: content.submitDraftFile,
        reviewGate2: content.reviewGate2,
        markPosted: content.markPosted,
        updateItemDetails: content.updateItemDetails,
        deleteContentItem: content.deleteContentItem,
        addAuditComment: content.addAuditComment,
      }}
    />
  );
}

export default function ItemPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="studio-surface rounded-2xl border p-12 text-center text-sm text-[var(--text-muted)]">
            Loading content item...
          </div>
        }
      >
        <ItemDetailInner />
      </Suspense>
    </AppShell>
  );
}
