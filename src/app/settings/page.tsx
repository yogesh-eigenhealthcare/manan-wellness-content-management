"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsView } from "@/components/views/SettingsView";
import { useContent } from "@/contexts/ContentContext";

export default function SettingsPage() {
  const content = useContent();

  return (
    <AppShell>
      <SettingsView hashtagPresets={content.hashtagPresets} />
    </AppShell>
  );
}
