"use client";

import React, { createContext, useContext } from "react";
import { useContentItems } from "@/hooks/useContentItems";

type ContentContextValue = ReturnType<typeof useContentItems>;

const ContentContext = createContext<ContentContextValue | null>(null);

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const value = useContentItems();
  return (
    <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
  );
}

export function useContent(): ContentContextValue {
  const ctx = useContext(ContentContext);
  if (!ctx) {
    throw new Error("useContent must be used within a ContentProvider");
  }
  return ctx;
}
