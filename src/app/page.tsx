"use client";

import React from "react";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f6f8f7] text-sm text-slate-600">
        Connecting to Manan Wellness Studio...
      </main>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <AppShell />;
}
