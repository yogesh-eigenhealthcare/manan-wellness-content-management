"use client";

import React from "react";
import { ExternalLink, MessageSquare } from "lucide-react";
import { ContentThumbnail } from "@/components/video/ContentThumbnail";
import { STATUS_META } from "@/lib/workflow";
import {
  formatLabel,
  type ContentItem,
  type WorkflowStatus,
} from "@/types/content";

interface PipelineBoardProps {
  items: ContentItem[];
  viewMode: "kanban" | "table";
  showParked?: boolean;
  onSelectItem: (item: ContentItem) => void;
}

const KANBAN_COLUMNS: {
  title: string;
  statuses: WorkflowStatus[];
  dotClass: string;
}[] = [
  {
    title: "Gate 1 · Idea pending",
    statuses: ["idea_pending"],
    dotClass: "bg-amber-500",
  },
  {
    title: "Approved and in production",
    statuses: ["approved_for_production", "in_production"],
    dotClass: "bg-sky-500",
  },
  {
    title: "Gate 2 · Final review",
    statuses: ["draft_review"],
    dotClass: "bg-amber-400",
  },
  {
    title: "Changes requested",
    statuses: ["changes_requested"],
    dotClass: "bg-orange-500",
  },
  {
    title: "Ready to post",
    statuses: ["approved_to_post"],
    dotClass: "bg-emerald-500",
  },
  {
    title: "Posted",
    statuses: ["posted"],
    dotClass: "bg-teal-500",
  },
];

export function PipelineBoard({
  items,
  viewMode,
  showParked = false,
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
              <th>Video / Post</th>
              <th>Format</th>
              <th>Topic</th>
              <th>Status</th>
              <th>Assigned to</th>
              <th>Effort</th>
              <th>Draft</th>
              <th>Links</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-[var(--text-muted)]">
                  No content items match the current filters
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const meta = STATUS_META[item.status];
                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className="cursor-pointer"
                  >
                    <th>
                      <div className="flex items-center gap-3">
                        <ContentThumbnail
                          format={item.format}
                          referenceUrl={item.referenceUrl}
                          referenceBackupUrl={item.referenceBackupUrl}
                          latestDraftUrl={item.latestDraftUrl}
                          latestDraftKind={item.latestDraftKind}
                          title={item.title}
                          size="table"
                        />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => onSelectItem(item)}
                            className="line-clamp-1 text-left text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent)]"
                          >
                            <span className="font-mono-meta mr-1.5 text-xs text-[var(--text-muted)]">
                              #{item.serialNo}
                            </span>
                            {item.title}
                          </button>
                          {item.adaptationIdea || item.callToAction ? (
                            <p className="mt-0.5 line-clamp-1 max-w-xs text-xs font-normal text-[var(--text-muted)]">
                              {item.adaptationIdea || item.callToAction}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </th>
                    <td data-label="Format" className="whitespace-nowrap text-xs">
                      {formatLabel(item.format)}
                    </td>
                    <td data-label="Topic" className="text-xs">
                      {item.topicType}
                    </td>
                    <td data-label="Status">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${meta.badgeClass}`}
                      >
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${meta.dotClass}`}
                        />
                        {meta.shortLabel}
                      </span>
                    </td>
                    <td data-label="Assigned to" className="text-xs capitalize">
                      {item.assignedTo.length > 0 ? item.assignedTo.join(", ") : "Unassigned"}
                    </td>
                    <td data-label="Effort" className="text-xs capitalize">
                      {item.effortLevel}
                    </td>
                    <td data-label="Draft" className="font-mono-meta text-xs">
                      {item.latestDraftVersion > 0 ? `v${item.latestDraftVersion}` : "—"}
                    </td>
                    <td
                      data-label="Links"
                      onClick={(e) => e.stopPropagation()}
                      className="whitespace-nowrap"
                    >
                      <div className="flex items-center gap-3 text-xs">
                        {item.referenceUrl ? (
                          <a
                            href={item.referenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--accent)]"
                          >
                            Ref <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </a>
                        ) : null}
                        {item.latestDraftUrl ? (
                          <a
                            href={item.latestDraftUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline"
                          >
                            Draft <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
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
          title: "Parked",
          statuses: ["idea_rejected"] as WorkflowStatus[],
          dotClass: "bg-rose-500",
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
            className="studio-raised flex w-72 shrink-0 flex-col rounded-xl border"
          >
            <header className="flex items-center justify-between border-b border-[var(--border-subtle)] px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${col.dotClass}`} />
                <h2 className="text-xs font-medium text-[var(--text-primary)]">
                  {col.title}
                </h2>
              </div>
              <span className="font-mono-meta text-xs text-[var(--text-muted)]">
                {colItems.length}
              </span>
            </header>

            <div className="flex max-h-[68vh] flex-col gap-2.5 overflow-y-auto p-2.5">
              {colItems.length === 0 ? (
                <div className="studio-surface rounded-lg border border-dashed p-4 text-center text-xs text-[var(--text-muted)]">
                  No items
                </div>
              ) : (
                colItems.map((item) => {
                  const meta = STATUS_META[item.status];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectItem(item)}
                      className="studio-surface group w-full space-y-2 rounded-lg border p-2.5 text-left transition-colors duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)]"
                    >
                      <ContentThumbnail
                        format={item.format}
                        referenceUrl={item.referenceUrl}
                        referenceBackupUrl={item.referenceBackupUrl}
                        latestDraftUrl={item.latestDraftUrl}
                        latestDraftKind={item.latestDraftKind}
                        title={item.title}
                        size="card"
                      />

                      <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                        <span className="truncate">
                          <span className="font-mono-meta mr-1">#{item.serialNo}</span>·{" "}
                          {item.topicType}
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-[var(--text-secondary)]">
                          <span
                            className={`inline-block h-1.5 w-1.5 rounded-full ${meta.dotClass}`}
                          />
                          {meta.shortLabel}
                        </span>
                      </div>

                      <div className="line-clamp-2 text-sm font-medium text-[var(--text-primary)]">
                        {item.title}
                      </div>

                      {item.adaptationIdea ? (
                        <p className="line-clamp-2 text-xs text-[var(--text-muted)]">
                          {item.adaptationIdea}
                        </p>
                      ) : null}

                      <div className="flex items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-2 text-xs text-[var(--text-muted)]">
                        <span className="truncate capitalize">
                          {item.assignedTo.length > 0
                            ? item.assignedTo.join(", ")
                            : "Unassigned"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {item.latestDraftVersion > 0 ? (
                            <span className="font-mono-meta rounded bg-[var(--bg-raised)] px-1.5 py-0.5 text-[11px] text-[var(--text-primary)]">
                              v{item.latestDraftVersion}
                            </span>
                          ) : null}
                          {item.gate2Feedback && item.status === "changes_requested" ? (
                            <MessageSquare
                              className="h-3.5 w-3.5 text-[var(--warning)]"
                              strokeWidth={1.5}
                            />
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
