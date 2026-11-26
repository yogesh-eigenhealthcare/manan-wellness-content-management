"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { InsightsView } from "@/components/views/InsightsView";
import { useContent } from "@/contexts/ContentContext";

export default function InsightsPage() {
  const router = useRouter();
  const content = useContent();

  return (
    <AppShell>
      <InsightsView
        items={content.items}
        onGoToContent={() => router.push("/content")}
      />
    </AppShell>
  );
}
