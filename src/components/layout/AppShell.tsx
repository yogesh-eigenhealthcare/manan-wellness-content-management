"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Columns3,
  Film,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { SubmitIdeaModal } from "@/components/modals/SubmitIdeaModal";
import { useAuth } from "@/contexts/AuthContext";
import { useContent } from "@/contexts/ContentContext";
import { isGate1Pending, isGate2Pending } from "@/lib/workflow";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, profile, loading: authLoading, isManager, signOut } = useAuth();
  const content = useContent();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);

  const pendingApprovalsCount = useMemo(
    () =>
      content.items.filter(
        (i) => isGate1Pending(i.status) || isGate2Pending(i.status)
      ).length,
    [content.items]
  );

  if (authLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[var(--bg-app)] text-sm text-[var(--text-muted)]">
        Connecting to Manan Wellness Studio...
      </main>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const navItems: {
    href: string;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    match: (path: string) => boolean;
  }[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      match: (p) => p === "/" || p === "/dashboard",
    },
    {
      href: "/content",
      label: "Content",
      icon: <Film className="h-4 w-4" />,
      badge: content.items.length,
      match: (p) => p.startsWith("/content"),
    },
    {
      href: "/board",
      label: "Board",
      icon: <Columns3 className="h-4 w-4" />,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      match: (p) => p.startsWith("/board"),
    },
    {
      href: "/insights",
      label: "Insights",
      icon: <BarChart3 className="h-4 w-4" />,
      match: (p) => p.startsWith("/insights"),
    },
    {
      href: "/settings",
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
      match: (p) => p.startsWith("/settings"),
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-3">
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 py-1.5">
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 text-left"
          >
            <div className="flex h-9 items-center rounded-lg bg-white px-2 shadow-xs ring-1 ring-slate-200">
              <img
                src="https://mananwellness.com/svg/manan-logo.svg"
                alt="Manan Wellness"
                className="h-5 w-auto"
              />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-primary)]">
                Content Studio
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">
                Manan Wellness
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
            className="rounded-lg p-1.5 text-[var(--text-muted)] lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav aria-label="Primary studio navigation" className="space-y-1">
          {navItems.map((item) => {
            const active = item.match(pathname || "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-teal-600/12 font-semibold text-teal-600"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </span>
                {item.badge !== undefined ? (
                  <span className="studio-muted rounded-full border px-2 py-0.5 text-[11px] font-semibold text-[var(--text-muted)]">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="studio-muted flex items-center justify-between gap-2 rounded-xl border p-2.5">
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-[var(--text-primary)]">
            {profile?.displayName ?? "Team User"}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
            {isManager ? (
              <span className="inline-flex items-center gap-0.5 font-semibold text-teal-600">
                <ShieldCheck className="h-3 w-3" /> Manager
              </span>
            ) : (
              <span>Team Member</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          aria-label="Sign out"
          title="Sign out"
          className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Desktop Left Sidebar */}
      <aside className="studio-surface hidden w-60 shrink-0 border-r lg:sticky lg:top-0 lg:block lg:h-dvh">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/50"
          />
          <aside className="studio-surface relative z-50 h-full w-64 border-r shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      ) : null}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="studio-surface sticky top-0 z-20 flex items-center justify-between gap-3 border-b px-4 py-2.5 lg:hidden">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link
              href="/dashboard"
              className="flex h-8 items-center rounded-md bg-white px-2 ring-1 ring-slate-200"
            >
              <img
                src="https://mananwellness.com/svg/manan-logo.svg"
                alt="Manan Wellness"
                className="h-4 w-auto"
              />
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setSubmitOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white"
          >
            <Plus className="h-3.5 w-3.5" /> New Idea
          </button>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>

      <SubmitIdeaModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        hashtagPresets={content.hashtagPresets}
        onSubmit={content.submitIdea}
      />
    </div>
  );
}
