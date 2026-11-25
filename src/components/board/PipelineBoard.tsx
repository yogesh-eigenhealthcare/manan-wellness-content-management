"use client";

import React from "react";
import { ExternalLink, Film, Image as ImageIcon, MessageSquare } from "lucide-react";
import { STATUS_META } from "@/lib/workflow";
import type { ContentItem, WorkflowStatus } from "@/types/content";

interface PipelineBoardProps {
  items: ContentItem[];
  viewMode: "kanban" | "table";
  showParked: boolean;
  onSelectItem: (item: ContentItem) => void;
}

const KANBAN_COLUMNS: {
  title: string;
  statuses: WorkflowStatus[];
  accent: string;
}[] = [
  {
    title: "Gate 1 · Idea Pending",
    statuses: ["idea_pending"],
    accent: "border-t-amber-500",
  },
  {
    title: "Approved & In Production",
    statuses: ["approved_for_production", "in_production"],
    accent: "border-t-sky-500",
  },
  {
    title: "Gate 2 · Final Review",
    statuses: ["draft_review"],
    accent: "border-t-purple-500",
  },
  {
    title: "Changes Requested",
    statuses: ["changes_requested"],
    accent: "border-t-orange-500",
  },
  {
    title: "Ready to Post",
    statuses: ["approved_to_post"],
    accent: "border-t-emerald-500",
  },
  {
    title: "Posted",
    statuses: ["posted"],
    accent: "border-t-teal-600",
  },
];

export function PipelineBoard({
  items,
  viewMode,
  showParked,
  onSelectItem,
}: PipelineBoardProps) {
  if (viewMode === "table") {
    return (
      <div
        tabIndex={0}
        role="region"
        aria-labelledby="content-table-caption"
        className="table-wrapper"
      >
        <table className="responsive-data-table">
          <caption id="content-table-caption" className="sr-only">
            Manan Wellness content pipeline items
          </caption>
          <thead>
            <tr>
              <th>Title / Hook</th>
              <th>Format</th>
              <th>Topic</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Effort</th>
              <th>Draft</th>
              <th>Links</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">
                  No content items match the current filters.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const meta = STATUS_META[item.status];
                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className="cursor-pointer transition hover:bg-slate-50"
                  >
                    <th>
                      <button
                        type="button"
                        onClick={() => onSelectItem(item)}
                        className="text-left font-semibold text-slate-900 hover:text-teal-700"
                      >
                        #{item.serialNo} {item.title}
                      </button>
                    </th>
                    <td data-label="Format" className="capitalize">
                      {item.format}
                    </td>
                    <td data-label="Topic">{item.topicType}</td>
                    <td data-label="Status">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.badgeClass}`}
                      >
                        {meta.shortLabel}
                      </span>
                    </td>
                    <td data-label="Assigned To" className="capitalize">
                      {item.assignedTo.length > 0 ? item.assignedTo.join(", ") : "Unassigned"}
                    </td>
                    <td data-label="Effort" className="capitalize">
                      {item.effortLevel}
                    </td>
                    <td data-label="Draft">
                      {item.latestDraftVersion > 0 ? `v${item.latestDraftVersion}` : "—"}
                    </td>
                    <td
                      data-label="Links"
                      onClick={(e) => e.stopPropagation()}
                      className="whitespace-nowrap"
                    >
                      <div className="flex items-center gap-2">
                        {item.referenceUrl ? (
                          <a
                            href={item.referenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline"
                          >
                            Ref <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                        {item.latestDraftUrl ? (
                          <a
                            href={item.latestDraftUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 hover:underline"
                          >
                            Draft <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  }

  const columns = showParked
    ? [
        ...KANBAN_COLUMNS,
        {
          title: "Parked / Declined",
          statuses: ["idea_rejected"] as WorkflowStatus[],
          accent: "border-t-rose-500",
        },
      ]
    : KANBAN_COLUMNS;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => {
        const colItems = items.filter((it) => col.statuses.includes(it.status));
        return (
          <section
            key={col.title}
            className={`flex w-76 shrink-0 flex-col rounded-xl border border-slate-200 border-t-4 ${col.accent} bg-slate-100/70`}
          >
            <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-3.5 py-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                {col.title}
              </h2>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                {colItems.length}
              </span>
            </header>

            <div className="flex max-h-[68vh] flex-col gap-2.5 overflow-y-auto p-2.5">
              {colItems.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white/60 p-4 text-center text-xs text-slate-400">
                  No items here
                </div>
              ) : (
                colItems.map((item) => {
                  const meta = STATUS_META[item.status];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectItem(item)}
                      className="group w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-xs transition hover:border-teal-400 hover:shadow-sm"
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1 font-medium">
                          {item.format === "carousel" ? (
                            <ImageIcon className="h-3 w-3 text-sky-600" />
                          ) : (
                            <Film className="h-3 w-3 text-teal-600" />
                          )}
                          #{item.serialNo} · {item.topicType}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.badgeClass}`}
                        >
                          {meta.shortLabel}
                        </span>
                      </div>

                      <div className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-teal-800">
                        {item.title}
                      </div>

                      {item.adaptationIdea ? (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {item.adaptationIdea}
                        </p>
                      ) : null}

                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                        <span className="truncate capitalize">
                          {item.assignedTo.length > 0
                            ? item.assignedTo.join(", ")
                            : "Unassigned"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {item.latestDraftVersion > 0 ? (
                            <span className="rounded bg-purple-100 px-1.5 py-0.5 font-semibold text-purple-800">
                              v{item.latestDraftVersion}
                            </span>
                          ) : null}
                          {item.gate2Feedback && item.status === "changes_requested" ? (
                            <MessageSquare className="h-3.5 w-3.5 text-orange-600" />
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
