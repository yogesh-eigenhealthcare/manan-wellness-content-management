"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Hash,
  LayoutGrid,
  LogOut,
  Plus,
  Search as SearchIcon,
  ShieldCheck,
  Sparkles,
  Table as TableIcon,
  Users,
} from "lucide-react";
import { PipelineBoard } from "@/components/board/PipelineBoard";
import { HashtagBankModal } from "@/components/modals/HashtagBankModal";
import { SubmitIdeaModal } from "@/components/modals/SubmitIdeaModal";
import { TeamRolesModal } from "@/components/modals/TeamRolesModal";
import { SideBySideReviewDrawer } from "@/components/review/SideBySideReviewDrawer";
import { useAuth } from "@/contexts/AuthContext";
import { useContentItems } from "@/hooks/useContentItems";
import { isGate1Pending, isGate2Pending } from "@/lib/workflow";
import {
  TEAM_ASSIGNEE_OPTIONS,
  TOPIC_OPTIONS,
  type ContentFormat,
  type ContentItem,
} from "@/types/content";

type WorkspaceTab = "all" | "approvals" | "production" | "ready";

export function AppShell() {
  const { profile, isManager, signOut } = useAuth();
  const content = useContentItems();

  const [tab, setTab] = useState<WorkspaceTab>("all");
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [showParked, setShowParked] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState<"all" | ContentFormat>("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [effortFilter, setEffortFilter] = useState<string>("all");

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [hashtagsOpen, setHashtagsOpen] = useState(false);

  const gate1Count = useMemo(
    () => content.items.filter((i) => isGate1Pending(i.status)).length,
    [content.items]
  );
  const gate2Count = useMemo(
    () => content.items.filter((i) => isGate2Pending(i.status)).length,
    [content.items]
  );
  const totalApprovalsCount = gate1Count + gate2Count;

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return content.items.filter((item) => {
      if (tab === "approvals") {
        if (!isGate1Pending(item.status) && !isGate2Pending(item.status)) {
          return false;
        }
      } else if (tab === "production") {
        if (
          item.status !== "approved_for_production" &&
          item.status !== "in_production" &&
          item.status !== "changes_requested"
        ) {
          return false;
        }
      } else if (tab === "ready") {
        if (item.status !== "approved_to_post" && item.status !== "posted") {
          return false;
        }
      }

      if (formatFilter !== "all" && item.format !== formatFilter) return false;
      if (topicFilter !== "all" && item.topicType !== topicFilter) return false;
      if (effortFilter !== "all" && item.effortLevel !== effortFilter) return false;
      if (
        assigneeFilter !== "all" &&
        !item.assignedTo.some((a) => a.toLowerCase() === assigneeFilter.toLowerCase())
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
          item.hashtags.join(" "),
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
    tab,
    formatFilter,
    topicFilter,
    effortFilter,
    assigneeFilter,
    searchQuery,
  ]);

  const selectedItem: ContentItem | null = useMemo(
    () => content.items.find((i) => i.id === selectedItemId) ?? null,
    [content.items, selectedItemId]
  );

  return (
    <div className="min-h-dvh bg-[#f6f8f7] text-slate-900">
      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 sm:text-lg">
                Manan Wellness Content Studio
              </h1>
              <p className="text-xs text-slate-500">
                Two-Gate Reel Approval &amp; Production Hub
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setHashtagsOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Hash className="h-3.5 w-3.5 text-teal-600" />
              Hashtags
            </button>

            <button
              type="button"
              onClick={() => setTeamOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Users className="h-3.5 w-3.5 text-teal-600" />
              Team Roles
            </button>

            <button
              type="button"
              onClick={() => setSubmitOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              New Idea
            </button>

            <div className="ml-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-800">
                  {profile?.displayName ?? "Team User"}
                </div>
                <div className="flex items-center justify-end gap-1 text-[10px]">
                  {isManager ? (
                    <span className="inline-flex items-center gap-0.5 font-semibold text-teal-700">
                      <ShieldCheck className="h-3 w-3" /> Manager
                    </span>
                  ) : (
                    <span className="text-slate-500">Team Member</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void signOut()}
                aria-label="Sign out"
                title="Sign out"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/70 hover:text-slate-900"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-5 sm:px-6">
        {/* Approval Summary Strip & Workspace Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Workspace views" className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setTab("all")}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                tab === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              All Pipeline ({content.items.length})
            </button>

            <button
              type="button"
              onClick={() => setTab("approvals")}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                tab === "approvals"
                  ? "bg-purple-700 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-purple-50"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isManager ? "Needs My Approval" : "Pending Manager Approval"}
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  tab === "approvals"
                    ? "bg-white/20 text-white"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {totalApprovalsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTab("production")}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                tab === "production"
                  ? "bg-sky-700 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              In Production &amp; Rework
            </button>

            <button
              type="button"
              onClick={() => setTab("ready")}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                tab === "ready"
                  ? "bg-emerald-700 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Ready to Post &amp; Posted
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={showParked}
                onChange={(e) => setShowParked(e.target.checked)}
                className="accent-teal-600"
              />
              Show Parked
            </label>

            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                aria-pressed={viewMode === "kanban"}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium ${
                  viewMode === "kanban"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Board
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                aria-pressed={viewMode === "table"}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium ${
                  viewMode === "table"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" /> Table
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <search>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="grid grid-cols-1 gap-2.5 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-6"
          >
            <div className="relative lg:col-span-2">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                aria-label="Search reels, ideas, or hashtags"
                spellCheck={false}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, #serial, adaptation idea, or hashtag..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
              />
            </div>

            <select
              aria-label="Filter by format"
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value as "all" | ContentFormat)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">All Formats</option>
              <option value="reel">Reels</option>
              <option value="carousel">Carousels / Posts</option>
            </select>

            <select
              aria-label="Filter by topic"
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">All Topics</option>
              {TOPIC_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by assignee"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm capitalize"
            >
              <option value="all">All Assignees</option>
              {TEAM_ASSIGNEE_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by effort"
              value={effortFilter}
              onChange={(e) => setEffortFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">All Effort Levels</option>
              <option value="low">Low effort</option>
              <option value="high">High effort</option>
              <option value="general">General</option>
            </select>
          </form>
        </search>

        {/* Gate Count Mini-Callout */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span>
            Showing <strong>{filteredItems.length}</strong> items
          </span>
          <span>·</span>
          <span>
            Gate 1 (Ideas awaiting approval):{" "}
            <strong className="text-amber-700">{gate1Count}</strong>
          </span>
          <span>·</span>
          <span>
            Gate 2 (Draft videos awaiting approval):{" "}
            <strong className="text-purple-700">{gate2Count}</strong>
          </span>
        </div>

        {/* Board or Table */}
        {content.loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Loading Manan Wellness pipeline...
          </div>
        ) : (
          <PipelineBoard
            items={filteredItems}
            viewMode={viewMode}
            showParked={showParked}
            onSelectItem={(it) => setSelectedItemId(it.id)}
          />
        )}
      </main>

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

      <TeamRolesModal open={teamOpen} onClose={() => setTeamOpen(false)} />

      <HashtagBankModal
        open={hashtagsOpen}
        onClose={() => setHashtagsOpen(false)}
        presets={content.hashtagPresets}
      />
    </div>
  );
}
