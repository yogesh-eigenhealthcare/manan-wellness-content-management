"use client";

import React, { useMemo, useState } from "react";
import {
  BarChart3,
  Columns3,
  Film,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search as SearchIcon,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { PipelineBoard } from "@/components/board/PipelineBoard";
import { SubmitIdeaModal } from "@/components/modals/SubmitIdeaModal";
import { SideBySideReviewDrawer } from "@/components/review/SideBySideReviewDrawer";
import { ContentView } from "@/components/views/ContentView";
import { DashboardView } from "@/components/views/DashboardView";
import { InsightsView } from "@/components/views/InsightsView";
import { SettingsView } from "@/components/views/SettingsView";
import { useAuth } from "@/contexts/AuthContext";
import { useContentItems } from "@/hooks/useContentItems";
import { isGate1Pending, isGate2Pending } from "@/lib/workflow";
import {
  FORMAT_OPTIONS,
  TEAM_ASSIGNEE_OPTIONS,
  TOPIC_OPTIONS,
  type ContentFormat,
  type ContentItem,
} from "@/types/content";

type NavPage = "dashboard" | "content" | "board" | "insights" | "settings";

export function AppShell() {
  const { profile, isManager, signOut } = useAuth();
  const content = useContentItems();

  const [page, setPage] = useState<NavPage>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Board page filters
  const [boardSearch, setBoardSearch] = useState("");
  const [boardFormat, setBoardFormat] = useState<"all" | ContentFormat>("all");
  const [boardTopic, setBoardTopic] = useState("all");
  const [boardAssignee, setBoardAssignee] = useState("all");
  const [boardEffort, setBoardEffort] = useState("all");
  const [showParked, setShowParked] = useState(false);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);

  const pendingApprovalsCount = useMemo(
    () =>
      content.items.filter(
        (i) => isGate1Pending(i.status) || isGate2Pending(i.status)
      ).length,
    [content.items]
  );

  const boardFilteredItems = useMemo(() => {
    const q = boardSearch.trim().toLowerCase();
    return content.items.filter((item) => {
      if (boardFormat !== "all" && item.format !== boardFormat) return false;
      if (boardTopic !== "all" && item.topicType !== boardTopic) return false;
      if (boardEffort !== "all" && item.effortLevel !== boardEffort) return false;
      if (
        boardAssignee !== "all" &&
        !item.assignedTo.some((a) => a.toLowerCase() === boardAssignee.toLowerCase())
      ) {
        return false;
      }
      if (q) {
        const haystack = [
          item.title,
          item.adaptationIdea,
          item.callToAction,
          item.topicType,
          item.assignedTo.join(" "),
          String(item.serialNo),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [
    content.items,
    boardFormat,
    boardTopic,
    boardEffort,
    boardAssignee,
    boardSearch,
  ]);

  const selectedItem: ContentItem | null = useMemo(
    () => content.items.find((i) => i.id === selectedItemId) ?? null,
    [content.items, selectedItemId]
  );

  const navItems: {
    id: NavPage;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: "content",
      label: "Content",
      icon: <Film className="h-4 w-4" />,
      badge: content.items.length,
    },
    {
      id: "board",
      label: "Board",
      icon: <Columns3 className="h-4 w-4" />,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    {
      id: "insights",
      label: "Insights",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  const handleNavClick = (target: NavPage) => {
    setPage(target);
    setMobileMenuOpen(false);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-3">
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 py-1.5">
          <button
            type="button"
            onClick={() => handleNavClick("dashboard")}
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
          </button>

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
            const active = page === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => handleNavClick(item.id)}
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
              </button>
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
        {/* Minimal Mobile/Compact Top Bar */}
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
            <div className="flex h-8 items-center rounded-md bg-white px-2 ring-1 ring-slate-200">
              <img
                src="https://mananwellness.com/svg/manan-logo.svg"
                alt="Manan Wellness"
                className="h-4 w-auto"
              />
            </div>
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
          {content.loading && page === "dashboard" ? (
            <div className="studio-surface rounded-2xl border p-12 text-center text-sm text-[var(--text-muted)]">
              Loading Manan Wellness Studio...
            </div>
          ) : page === "dashboard" ? (
            <DashboardView
              items={content.items}
              isManager={isManager}
              onNewIdea={() => setSubmitOpen(true)}
              onNavigate={(target) => setPage(target)}
              onSelectItem={(it) => setSelectedItemId(it.id)}
            />
          ) : page === "content" ? (
            <ContentView
              items={content.items}
              loading={content.loading}
              isManager={isManager}
              onSelectItem={(it) => setSelectedItemId(it.id)}
              onNewIdea={() => setSubmitOpen(true)}
            />
          ) : page === "board" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">
                    Workflow Board
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Track items across Gate 1 approval, production, Gate 2 review, and posting
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="studio-surface inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={showParked}
                      onChange={(e) => setShowParked(e.target.checked)}
                      className="accent-teal-600"
                    />
                    Show Parked
                  </label>
                  <button
                    type="button"
                    onClick={() => setSubmitOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700"
                  >
                    <Plus className="h-4 w-4" /> New Idea
                  </button>
                </div>
              </div>

              <search>
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="studio-surface grid grid-cols-1 gap-2.5 rounded-xl border p-3 sm:grid-cols-2 lg:grid-cols-6"
                >
                  <div className="relative lg:col-span-2">
                    <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="search"
                      aria-label="Search board"
                      spellCheck={false}
                      value={boardSearch}
                      onChange={(e) => setBoardSearch(e.target.value)}
                      placeholder="Search board..."
                      className="studio-input w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
                    />
                  </div>
                  <select
                    aria-label="Filter board by format"
                    value={boardFormat}
                    onChange={(e) =>
                      setBoardFormat(e.target.value as "all" | ContentFormat)
                    }
                    className="studio-input rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value="all">All Formats</option>
                    {FORMAT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Filter board by topic"
                    value={boardTopic}
                    onChange={(e) => setBoardTopic(e.target.value)}
                    className="studio-input rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value="all">All Topics</option>
                    {TOPIC_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Filter board by assignee"
                    value={boardAssignee}
                    onChange={(e) => setBoardAssignee(e.target.value)}
                    className="studio-input rounded-lg border px-3 py-2 text-sm capitalize"
                  >
                    <option value="all">All Assignees</option>
                    {TEAM_ASSIGNEE_OPTIONS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Filter board by effort"
                    value={boardEffort}
                    onChange={(e) => setBoardEffort(e.target.value)}
                    className="studio-input rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value="all">All Effort Levels</option>
                    <option value="low">Low effort</option>
                    <option value="high">High effort</option>
                    <option value="general">General</option>
                  </select>
                </form>
              </search>

              <PipelineBoard
                items={boardFilteredItems}
                viewMode="kanban"
                showParked={showParked}
                onSelectItem={(it) => setSelectedItemId(it.id)}
              />
            </div>
          ) : page === "insights" ? (
            <InsightsView
              items={content.items}
              onGoToContent={() => setPage("content")}
            />
          ) : (
            <SettingsView hashtagPresets={content.hashtagPresets} />
          )}
        </main>
      </div>

      <SideBySideReviewDrawer
        item={selectedItem}
        hashtagPresets={content.hashtagPresets}
        onClose={() => setSelectedItemId(null)}
        actions={{
          reviewGate1: content.reviewGate1,
          resubmitIdea: content.resubmitIdea,
          startProduction: content.startProduction,
          submitDraftLink: content.submitDraftLink,
          reviewGate2: content.reviewGate2,
          markPosted: content.markPosted,
          updateItemDetails: content.updateItemDetails,
          deleteContentItem: content.deleteContentItem,
          addAuditComment: content.addAuditComment,
        }}
      />

      <SubmitIdeaModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        hashtagPresets={content.hashtagPresets}
        onSubmit={content.submitIdea}
      />
    </div>
  );
}
