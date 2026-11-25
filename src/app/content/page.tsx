"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SubmitIdeaModal } from "@/components/modals/SubmitIdeaModal";
import { ContentView } from "@/components/views/ContentView";
import { useAuth } from "@/contexts/AuthContext";
import { useContent } from "@/contexts/ContentContext";

export default function ContentPage() {
  const router = useRouter();
  const { isManager } = useAuth();
  const content = useContent();
  const [submitOpen, setSubmitOpen] = useState(false);

  return (
    <AppShell>
      <ContentView
        items={content.items}
        loading={content.loading}
        isManager={isManager}
        onSelectItem={(it) => router.push(`/item?id=${it.id}&from=content`)}
        onNewIdea={() => setSubmitOpen(true)}
      />

      <SubmitIdeaModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        hashtagPresets={content.hashtagPresets}
        onSubmit={content.submitIdea}
      />
    </AppShell>
  );
}
