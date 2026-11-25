"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SubmitIdeaModal } from "@/components/modals/SubmitIdeaModal";
import { ContentView } from "@/components/views/ContentView";
import { useAuth } from "@/contexts/AuthContext";
import { useContent } from "@/contexts/ContentContext";

function ContentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isManager } = useAuth();
  const content = useContent();
  const [submitOpen, setSubmitOpen] = useState(false);

  const initialQuery = searchParams.get("q") || "";

  return (
    <>
      <ContentView
        items={content.items}
        loading={content.loading}
        isManager={isManager}
        initialQuery={initialQuery}
        onSelectItem={(it) => router.push(`/item?id=${it.id}&from=content`)}
        onNewIdea={() => setSubmitOpen(true)}
      />

      <SubmitIdeaModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        hashtagPresets={content.hashtagPresets}
        onSubmit={content.submitIdea}
      />
    </>
  );
}

export default function ContentPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="studio-surface rounded-xl border p-12 text-center text-sm text-[var(--text-muted)]">
            Loading content
          </div>
        }
      >
        <ContentPageInner />
      </Suspense>
    </AppShell>
  );
}
