"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SubmitIdeaModal } from "@/components/modals/SubmitIdeaModal";
import { DashboardView } from "@/components/views/DashboardView";
import { useAuth } from "@/contexts/AuthContext";
import { useContent } from "@/contexts/ContentContext";

export function DashboardPageContent() {
  const router = useRouter();
  const { isManager } = useAuth();
  const content = useContent();
  const [submitOpen, setSubmitOpen] = useState(false);

  return (
    <AppShell>
      {content.loading ? (
        <div className="studio-surface rounded-2xl border p-12 text-center text-sm text-[var(--text-muted)]">
          Loading Manan Wellness Studio...
        </div>
      ) : (
        <DashboardView
          items={content.items}
          isManager={isManager}
          onNewIdea={() => setSubmitOpen(true)}
          onNavigate={(target) => router.push(`/${target}`)}
          onSelectItem={(it) => router.push(`/item?id=${it.id}&from=dashboard`)}
        />
      )}

      <SubmitIdeaModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        hashtagPresets={content.hashtagPresets}
        onSubmit={content.submitIdea}
      />
    </AppShell>
  );
}

export default function DashboardPage() {
  return <DashboardPageContent />;
}
