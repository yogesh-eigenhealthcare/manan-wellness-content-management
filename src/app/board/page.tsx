"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { PipelineBoard } from "@/components/board/PipelineBoard";
import { AppShell } from "@/components/layout/AppShell";
import { SubmitIdeaModal } from "@/components/modals/SubmitIdeaModal";
import { useContent } from "@/contexts/ContentContext";
import { useDebounce } from "@/hooks/useDebounce";
import {
  FORMAT_OPTIONS,
  TEAM_ASSIGNEE_OPTIONS,
  TOPIC_OPTIONS,
  type ContentFormat,
} from "@/types/content";

export default function BoardPage() {
  const router = useRouter();
  const content = useContent();

  const [boardSearch, setBoardSearch] = useState("");
  const [boardFormat, setBoardFormat] = useState<"all" | ContentFormat>("all");
  const [boardTopic, setBoardTopic] = useState("all");
  const [boardAssignee, setBoardAssignee] = useState("all");
  const [boardEffort, setBoardEffort] = useState("all");
  const [showParked, setShowParked] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);

  const debouncedSearch = useDebounce(boardSearch, 250);

  const boardFilteredItems = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
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
    debouncedSearch,
  ]);

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Workflow board
          </h1>
          <div className="flex items-center gap-2">
            <label className="studio-surface inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-xs font-medium text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={showParked}
                onChange={(e) => setShowParked(e.target.checked)}
              />
              <span>Show parked</span>
            </label>
            <button
              type="button"
              onClick={() => setSubmitOpen(true)}
              className="studio-btn-accent inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium"
            >
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              <span>New idea</span>
            </button>
          </div>
        </div>

        <search>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="studio-surface grid grid-cols-1 gap-3 rounded-2xl border p-3 sm:grid-cols-2 lg:grid-cols-6"
          >
            <div className="relative lg:col-span-2">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
                strokeWidth={1.5}
              />
              <input
                type="search"
                aria-label="Filter board"
                spellCheck={false}
                value={boardSearch}
                onChange={(e) => setBoardSearch(e.target.value)}
                placeholder="Filter"
                className="studio-input h-9 w-full rounded-xl border pl-9 pr-3 text-sm"
              />
            </div>
            <select
              aria-label="Filter board by format"
              value={boardFormat}
              onChange={(e) =>
                setBoardFormat(e.target.value as "all" | ContentFormat)
              }
              className="studio-input h-9 rounded-xl border px-3 text-sm"
            >
              <option value="all">All formats</option>
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
              aria-label="Filter board by assignee"
              value={boardAssignee}
              onChange={(e) => setBoardAssignee(e.target.value)}
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
              aria-label="Filter board by effort"
              value={boardEffort}
              onChange={(e) => setBoardEffort(e.target.value)}
              className="studio-input h-9 rounded-xl border px-3 text-sm"
            >
              <option value="all">All effort levels</option>
              <option value="low">Low effort</option>
              <option value="high">High effort</option>
              <option value="general">General</option>
            </select>
          </form>
        </search>

        {content.loading ? (
          <div className="studio-surface rounded-xl border p-12 text-center text-sm text-[var(--text-muted)]">
            Loading board
          </div>
        ) : (
          <PipelineBoard
            items={boardFilteredItems}
            viewMode="kanban"
            showParked={showParked}
            onSelectItem={(it) => router.push(`/item?id=${it.id}&from=board`)}
          />
        )}
      </div>

      <SubmitIdeaModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        hashtagPresets={content.hashtagPresets}
        onSubmit={content.submitIdea}
      />
    </AppShell>
  );
}
