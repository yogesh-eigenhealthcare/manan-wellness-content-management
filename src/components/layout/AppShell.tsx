"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Columns3,
  Film,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  X,
} from "lucide-react";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { SubmitIdeaModal } from "@/components/modals/SubmitIdeaModal";
import { useAuth } from "@/contexts/AuthContext";
import { useContent } from "@/contexts/ContentContext";
import { isGate1Pending, isGate2Pending } from "@/lib/workflow";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading: authLoading, isManager, signOut } = useAuth();
  const content = useContent();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

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
        Connecting to Manan Wellness Studio
      </main>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = globalSearch.trim();
    router.push(q ? `/content?q=${encodeURIComponent(q)}` : "/content");
  };

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
      icon: <LayoutDashboard className="h-4 w-4 shrink-0" strokeWidth={1.5} />,
      match: (p) => p === "/" || p === "/dashboard",
    },
    {
      href: "/content",
      label: "Content",
      icon: <Film className="h-4 w-4 shrink-0" strokeWidth={1.5} />,
      badge: content.items.length,
      match: (p) => p.startsWith("/content"),
    },
    {
      href: "/board",
      label: "Board",
      icon: <Columns3 className="h-4 w-4 shrink-0" strokeWidth={1.5} />,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      match: (p) => p.startsWith("/board"),
    },
    {
      href: "/insights",
      label: "Insights",
      icon: <BarChart3 className="h-4 w-4 shrink-0" strokeWidth={1.5} />,
      match: (p) => p.startsWith("/insights"),
    },
  ];

  const isSettingsActive = (pathname || "").startsWith("/settings");

  const initials = (profile?.displayName || profile?.email || "M")
    .trim()
    .charAt(0)
    .toUpperCase();

  const sidebarBody = (
    <div className="flex h-full flex-col justify-between px-3 py-4">
      <div className="space-y-4">
        {/* Channel Identity Block (Friendly Sidebar Header style) */}
        <div className="flex flex-col items-center border-b border-[var(--border-subtle)] pb-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white p-1.5 shadow-xs">
            <img
              src="https://mananwellness.com/svg/manan-logo.svg"
              alt="Manan Wellness"
              className="h-6 w-auto"
            />
          </div>
          <div className="font-display mt-2.5 text-sm font-semibold text-[var(--text-primary)]">
            Manan Wellness
          </div>
          <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[var(--pastel-cream)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--accent-text)]">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: isManager ? "var(--positive)" : "var(--accent-text)",
              }}
            />
            <span>{isManager ? "Manager" : "Team member"}</span>
          </div>
        </div>

        {/* Navigation Links (Image 1 warm cream active pill) */}
        <nav aria-label="Primary studio navigation" className="space-y-1">
          {navItems.map((item) => {
            const active = item.match(pathname || "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex h-10 w-full items-center justify-between rounded-xl px-3 text-sm transition-colors duration-150 ${
                  active
                    ? "bg-[var(--pastel-cream)] font-medium text-[var(--accent-text)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={
                      active ? "text-[var(--accent-text)]" : "text-[var(--text-muted)]"
                    }
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </span>
                {item.badge !== undefined ? (
                  <span
                    className={`font-mono-meta text-xs ${
                      active ? "text-[var(--accent-text)]" : "text-[var(--text-muted)]"
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Settings + Account Footer */}
      <div className="space-y-1 border-t border-[var(--border-subtle)] pt-3">
        <Link
          href="/settings"
          aria-current={isSettingsActive ? "page" : undefined}
          onClick={() => setMobileMenuOpen(false)}
          className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm transition-colors duration-150 ${
            isSettingsActive
              ? "bg-[var(--pastel-cream)] font-medium text-[var(--accent-text)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Settings
            className={`h-4 w-4 shrink-0 ${
              isSettingsActive ? "text-[var(--accent-text)]" : "text-[var(--text-muted)]"
            }`}
            strokeWidth={1.5}
          />
          <span>Settings</span>
        </Link>

        <div className="flex h-10 items-center justify-between gap-2 rounded-lg px-3 text-xs text-[var(--text-secondary)]">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="studio-raised flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium text-[var(--text-primary)]">
              {initials}
            </span>
            <span className="truncate">{profile?.displayName ?? "Team user"}</span>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            aria-label="Sign out"
            title="Sign out"
            className="rounded-md p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* YouTube Studio Full-Width 56px Header Bar */}
      <header className="studio-deep sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation"
            className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] lg:hidden"
          >
            <Menu className="h-4 w-4" strokeWidth={1.5} />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-7 items-center rounded-full bg-white px-2.5">
              <img
                src=""
                alt="Content Studio"
                className="h-4 w-auto"
              />
            </span>
            <span className="font-display text-base font-semibold tracking-tight text-[var(--text-primary)]">
              Content Studio
            </span>
          </Link>
        </div>

        {/* Center Global Search */}
        <search className="hidden max-w-md flex-1 sm:block">
          <form onSubmit={handleGlobalSearch} className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
              strokeWidth={1.5}
            />
            <input
              type="search"
              aria-label="Search across studio"
              spellCheck={false}
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search across your studio"
              className="studio-surface h-9 w-full rounded-full border pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </form>
        </search>

        {/* Right Primary Create Action */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubmitOpen(true)}
            className="studio-btn-accent inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium"
          >
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            <span>Create</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop 240px Sidebar */}
        <aside className="studio-deep hidden w-60 shrink-0 border-r lg:sticky lg:top-14 lg:block lg:h-[calc(100dvh-3.5rem)]">
          {sidebarBody}
        </aside>

        {/* Mobile Sidebar Drawer */}
        {mobileMenuOpen ? (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/55"
            />
            <aside className="studio-deep relative z-50 h-full w-64 border-r">
              <div className="flex h-14 items-center justify-between border-b border-[var(--border-subtle)] px-4">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Studio menu
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation"
                  className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
              <div className="h-[calc(100%-3.5rem)]">{sidebarBody}</div>
            </aside>
          </div>
        ) : null}

        {/* Fluid Content Canvas */}
        <main className="mx-auto w-full max-w-[1440px] flex-1 p-5 sm:p-6">
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
