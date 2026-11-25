"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search as SearchIcon } from "lucide-react";
import { PipelineBoard } from "@/components/board/PipelineBoard";
import { AppShell } from "@/components/layout/AppShell";
import { SubmitIdeaModal } from "@/components/modals/SubmitIdeaModal";
import { useContent } from "@/contexts/ContentContext";
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

  return (
    <AppShell>
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

        {content.loading ? (
          <div className="studio-surface rounded-2xl border p-12 text-center text-sm text-[var(--text-muted)]">
            Loading board...
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
