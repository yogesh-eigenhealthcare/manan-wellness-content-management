"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search as SearchIcon } from "lucide-react";
import { PipelineBoard } from "@/components/board/PipelineBoard";
import { isGate1Pending, isGate2Pending } from "@/lib/workflow";
import {
  FORMAT_OPTIONS,
  TEAM_ASSIGNEE_OPTIONS,
  TOPIC_OPTIONS,
  type ContentFormat,
  type ContentItem,
} from "@/types/content";

interface ContentViewProps {
  items: ContentItem[];
  loading: boolean;
  isManager: boolean;
  onSelectItem: (item: ContentItem) => void;
  onNewIdea: () => void;
}

type StageFilter = "all" | "approvals" | "production" | "ready" | "parked";

export function ContentView({
  items,
  loading,
  isManager,
  onSelectItem,
  onNewIdea,
}: ContentViewProps) {
  const [formatTab, setFormatTab] = useState<"all" | ContentFormat>("all");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [effortFilter, setEffortFilter] = useState("all");

  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (formatTab !== "all" && item.format !== formatTab) return false;

      if (stageFilter === "approvals") {
        if (!isGate1Pending(item.status) && !isGate2Pending(item.status)) return false;
      } else if (stageFilter === "production") {
        if (
          item.status !== "approved_for_production" &&
          item.status !== "in_production" &&
          item.status !== "changes_requested"
        ) {
          return false;
        }
      } else if (stageFilter === "ready") {
        if (item.status !== "approved_to_post" && item.status !== "posted") return false;
      } else if (stageFilter === "parked") {
        if (item.status !== "idea_rejected") return false;
      }

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
    items,
    formatTab,
    stageFilter,
    topicFilter,
    effortFilter,
    assigneeFilter,
    searchQuery,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [formatTab, stageFilter, topicFilter, effortFilter, assigneeFilter, searchQuery, pageSize]);

  const clampedPage = Math.min(currentPage, totalPages);
  const startIndex = (clampedPage - 1) * pageSize;
  const paginatedItems = useMemo(
    () => filteredItems.slice(startIndex, startIndex + pageSize),
    [filteredItems, startIndex, pageSize]
  );

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, clampedPage - 2);
    const end = Math.min(totalPages, clampedPage + 2);
    for (let p = start; p <= end; p += 1) pages.push(p);
    return pages;
  }, [clampedPage, totalPages]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Channel Content
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Browse, filter, and review all Reels / Shorts, Long form videos, and Carousels
          </p>
        </div>
        <button
          type="button"
          onClick={onNewIdea}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" /> New Idea
        </button>
      </div>

      {/* Format Tabs (YouTube Studio style) */}
      <div
        role="tablist"
        aria-label="Content format tabs"
        className="flex flex-wrap gap-1 border-b border-[var(--border-subtle)]"
      >
        <button
          type="button"
          role="tab"
          aria-selected={formatTab === "all"}
          onClick={() => setFormatTab("all")}
          className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
            formatTab === "all"
              ? "border-teal-600 text-teal-600"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          All ({items.length})
        </button>
        {FORMAT_OPTIONS.map((opt) => {
          const count = items.filter((i) => i.format === opt.value).length;
          return (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={formatTab === opt.value}
              onClick={() => setFormatTab(opt.value)}
              className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
                formatTab === opt.value
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {opt.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Stage Filter Pills */}
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["all", "All Stages"],
            ["approvals", isManager ? "Needs My Approval" : "Pending Approval"],
            ["production", "In Production & Rework"],
            ["ready", "Ready & Posted"],
            ["parked", "Parked"],
          ] as [StageFilter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStageFilter(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              stageFilter === key
                ? "bg-teal-600 text-white"
                : "studio-surface border text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search & Attribute Filters */}
      <search>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="studio-surface grid grid-cols-1 gap-2.5 rounded-xl border p-3 sm:grid-cols-2 lg:grid-cols-5"
        >
          <div className="relative lg:col-span-2">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="search"
              aria-label="Search content items"
              spellCheck={false}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, #serial, adaptation idea, or hashtag..."
              className="studio-input w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
            />
          </div>

          <select
            aria-label="Filter by topic"
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
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
            aria-label="Filter by assignee"
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
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
            aria-label="Filter by effort"
            value={effortFilter}
            onChange={(e) => setEffortFilter(e.target.value)}
            className="studio-input rounded-lg border px-3 py-2 text-sm"
          >
            <option value="all">All Effort Levels</option>
            <option value="low">Low effort</option>
            <option value="high">High effort</option>
            <option value="general">General</option>
          </select>
        </form>
      </search>

      {/* Table */}
      {loading ? (
        <div className="studio-surface rounded-2xl border p-12 text-center text-sm text-[var(--text-muted)]">
          Loading content table...
        </div>
      ) : (
        <PipelineBoard
          items={paginatedItems}
          viewMode="table"
          onSelectItem={onSelectItem}
        />
      )}

      {/* Pagination Bar */}
      <div className="studio-surface flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-xs">
        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <span>
            Showing{" "}
            <strong className="text-[var(--text-primary)]">
              {filteredItems.length === 0 ? 0 : startIndex + 1}
            </strong>
            –
            <strong className="text-[var(--text-primary)]">
              {Math.min(startIndex + pageSize, filteredItems.length)}
            </strong>{" "}
            of <strong className="text-[var(--text-primary)]">{filteredItems.length}</strong>
          </span>

          <label className="inline-flex items-center gap-1.5">
            <span>Rows:</span>
            <select
              aria-label="Rows per page"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="studio-input rounded-md border px-2 py-1 text-xs"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>

        <nav aria-label="Pagination" className="flex items-center gap-1">
          <button
            type="button"
            disabled={clampedPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="studio-surface inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </button>

          {pageNumbers.map((p) => (
            <button
              key={p}
              type="button"
              aria-current={p === clampedPage ? "page" : undefined}
              onClick={() => setCurrentPage(p)}
              className={`min-w-8 rounded-lg px-2.5 py-1.5 font-semibold ${
                p === clampedPage
                  ? "bg-teal-600 text-white"
                  : "studio-surface border text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            disabled={clampedPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="studio-surface inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-40"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </nav>
      </div>
    </div>
  );
}
