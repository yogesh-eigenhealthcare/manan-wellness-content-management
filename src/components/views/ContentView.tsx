"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Search,
} from "lucide-react";
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
  initialQuery?: string;
  onSelectItem: (item: ContentItem) => void;
  onNewIdea: () => void;
}

type StageFilter = "all" | "approvals" | "production" | "ready" | "parked";

export function ContentView({
  items,
  loading,
  isManager,
  initialQuery = "",
  onSelectItem,
  onNewIdea,
}: ContentViewProps) {
  const [formatTab, setFormatTab] = useState<"all" | ContentFormat>("all");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [topicFilter, setTopicFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [effortFilter, setEffortFilter] = useState("all");

  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setSearchQuery(initialQuery);
  }, [initialQuery]);

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          Channel content
        </h1>
        <button
          type="button"
          onClick={onNewIdea}
          className="studio-btn-accent inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium"
        >
          <Plus className="h-4 w-4" strokeWidth={1.75} />
          <span>New idea</span>
        </button>
      </div>

      {/* Format Underline Tabs (YouTube Studio style) */}
      <div
        role="tablist"
        aria-label="Content format tabs"
        className="flex flex-wrap gap-2 border-b border-[var(--border-subtle)]"
      >
        <button
          type="button"
          role="tab"
          aria-selected={formatTab === "all"}
          onClick={() => setFormatTab("all")}
          className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
            formatTab === "all"
              ? "border-[var(--accent-text)] text-[var(--text-primary)]"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          All <span className="font-mono-meta ml-1 text-xs">({items.length})</span>
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
              className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                formatTab === opt.value
                  ? "border-[var(--accent-text)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {opt.label}{" "}
              <span className="font-mono-meta ml-1 text-xs">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Stage Filter Strip */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All stages"],
            ["approvals", isManager ? "Needs my approval" : "Pending approval"],
            ["production", "In production"],
            ["ready", "Ready and posted"],
            ["parked", "Parked"],
          ] as [StageFilter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStageFilter(key)}
            className={`h-8 rounded-full px-3.5 text-xs font-medium transition-colors ${
              stageFilter === key
                ? "studio-btn-secondary"
                : "studio-surface border text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filter Row */}
      <search>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="studio-surface grid grid-cols-1 gap-3 rounded-2xl border p-3 sm:grid-cols-2 lg:grid-cols-5"
        >
          <div className="relative lg:col-span-2">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
              strokeWidth={1.5}
            />
            <input
              type="search"
              aria-label="Filter content"
              spellCheck={false}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter"
              className="studio-input h-9 w-full rounded-xl border pl-9 pr-3 text-sm"
            />
          </div>

          <select
            aria-label="Filter by topic"
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="studio-input h-9 rounded-xl border px-3 text-sm"
          >
            <option value="all">All topics</option>
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
            className="studio-input h-9 rounded-xl border px-3 text-sm capitalize"
          >
            <option value="all">All assignees</option>
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
            className="studio-input h-9 rounded-xl border px-3 text-sm"
          >
            <option value="all">All effort levels</option>
            <option value="low">Low effort</option>
            <option value="high">High effort</option>
            <option value="general">General</option>
          </select>
        </form>
      </search>

      {/* Table */}
      {loading ? (
        <div className="studio-surface rounded-2xl border p-12 text-center text-sm text-[var(--text-muted)]">
          Loading content table
        </div>
      ) : (
        <PipelineBoard
          items={paginatedItems}
          viewMode="table"
          onSelectItem={onSelectItem}
        />
      )}

      {/* YouTube Studio Pagination Footer */}
      <div className="studio-surface flex flex-wrap items-center justify-end gap-6 rounded-2xl border px-4 py-2.5 text-xs text-[var(--text-muted)]">
        <label className="inline-flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            aria-label="Rows per page"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="studio-input h-8 rounded-md border px-2 text-xs"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </label>

        <span className="font-mono-meta text-[var(--text-secondary)]">
          {filteredItems.length === 0 ? 0 : startIndex + 1}–
          {Math.min(startIndex + pageSize, filteredItems.length)} of{" "}
          {filteredItems.length}
        </span>

        <nav aria-label="Pagination" className="flex items-center gap-1">
          <button
            type="button"
            disabled={clampedPage <= 1}
            onClick={() => setCurrentPage(1)}
            aria-label="First page"
            className="rounded-md p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-35"
          >
            <ChevronsLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            disabled={clampedPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
            className="rounded-md p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-35"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            disabled={clampedPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Next page"
            className="rounded-md p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-35"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            disabled={clampedPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
            aria-label="Last page"
            className="rounded-md p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-35"
          >
            <ChevronsRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </nav>
      </div>
    </div>
  );
}
