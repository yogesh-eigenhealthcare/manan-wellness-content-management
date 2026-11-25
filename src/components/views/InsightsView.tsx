"use client";

import React, { useMemo } from "react";
import { isGate1Pending, isGate2Pending } from "@/lib/workflow";
import { FORMAT_OPTIONS, type ContentItem } from "@/types/content";

interface InsightsViewProps {
  items: ContentItem[];
  onGoToContent: () => void;
}

export function InsightsView({ items, onGoToContent }: InsightsViewProps) {
  const analytics = useMemo(() => {
    const total = items.length;
    const gate1Pending = items.filter((i) => isGate1Pending(i.status)).length;
    const gate1Rejected = items.filter((i) => i.status === "idea_rejected").length;
    const pastGate1 = items.filter(
      (i) => i.status !== "idea_pending" && i.status !== "idea_rejected"
    ).length;
    const gate1Reviewed = pastGate1 + gate1Rejected;
    const gate1ApprovalRate =
      gate1Reviewed > 0 ? Math.round((pastGate1 / gate1Reviewed) * 100) : 0;

    const draftsSubmitted = items.filter((i) => i.latestDraftVersion > 0).length;
    const gate2Pending = items.filter((i) => isGate2Pending(i.status)).length;
    const changesRequested = items.filter((i) => i.status === "changes_requested").length;
    const readyToPost = items.filter((i) => i.status === "approved_to_post").length;
    const posted = items.filter((i) => i.status === "posted").length;

    const byFormat = FORMAT_OPTIONS.map((opt) => ({
      label: opt.label,
      value: opt.value,
      count: items.filter((i) => i.format === opt.value).length,
    }));

    const topicCounts = new Map<string, number>();
    for (const item of items) {
      const key = item.topicType || "General";
      topicCounts.set(key, (topicCounts.get(key) ?? 0) + 1);
    }
    const topics = Array.from(topicCounts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);

    const assigneeCounts = new Map<string, { active: number; total: number }>();
    for (const item of items) {
      const assignees = item.assignedTo.length > 0 ? item.assignedTo : ["unassigned"];
      const isActive =
        item.status === "approved_for_production" ||
        item.status === "in_production" ||
        item.status === "changes_requested" ||
        item.status === "draft_review";
      for (const person of assignees) {
        const curr = assigneeCounts.get(person) ?? { active: 0, total: 0 };
        curr.total += 1;
        if (isActive) curr.active += 1;
        assigneeCounts.set(person, curr);
      }
    }
    const workload = Array.from(assigneeCounts.entries())
      .map(([name, counts]) => ({ name, ...counts }))
      .sort((a, b) => b.total - a.total);

    const lowEffortReady = items.filter(
      (i) => i.status === "idea_pending" && i.effortLevel === "low"
    ).length;
    const longFormCount = items.filter((i) => i.format === "long_form").length;

    const recommendations: string[] = [];
    if (gate2Pending > 0) {
      recommendations.push(
        `${gate2Pending} draft video(s) are waiting at Gate 2 for final sign-off.`
      );
    }
    if (gate1Pending > 10) {
      recommendations.push(
        `${gate1Pending} ideas are waiting in Gate 1 (${lowEffortReady} low-effort). Batch-approving 5 to 10 keeps the weekly calendar full.`
      );
    }
    if (longFormCount === 0) {
      recommendations.push(
        `No Long form ideas are logged yet — add 2 to 3 deeper mental health explainers to balance Reels / Shorts.`
      );
    }
    if (readyToPost > 0) {
      recommendations.push(
        `${readyToPost} item(s) are approved to post and ready to be scheduled.`
      );
    }

    return {
      total,
      gate1Pending,
      pastGate1,
      gate1ApprovalRate,
      draftsSubmitted,
      gate2Pending,
      changesRequested,
      readyToPost,
      posted,
      byFormat,
      topics,
      workload,
      recommendations,
    };
  }, [items]);

  const maxTopicCount = Math.max(1, ...analytics.topics.map((t) => t.count));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-medium tracking-tight text-[var(--text-primary)]">
          Pipeline insights
        </h1>
        <button
          type="button"
          onClick={onGoToContent}
          className="studio-raised inline-flex h-9 items-center rounded-lg border px-4 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)]"
        >
          Inspect content table
        </button>
      </div>

      {/* 4 Compact Stat Cards (Numbers only, equal height, per unslop) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="studio-surface rounded-xl border p-5">
          <div className="text-xs text-[var(--text-muted)]">Gate 1 pass rate</div>
          <div className="tabular-nums mt-2 text-3xl font-medium tracking-tight text-[var(--text-primary)]">
            {analytics.gate1ApprovalRate}%
          </div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">
            {analytics.pastGate1} approved of reviewed
          </div>
        </div>

        <div className="studio-surface rounded-xl border p-5">
          <div className="text-xs text-[var(--text-muted)]">Publishing queue</div>
          <div className="tabular-nums mt-2 text-3xl font-medium tracking-tight text-[var(--text-primary)]">
            {analytics.readyToPost + analytics.posted}
          </div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">
            {analytics.readyToPost} ready · {analytics.posted} posted
          </div>
        </div>

        <div className="studio-surface rounded-xl border p-5">
          <div className="text-xs text-[var(--text-muted)]">Pending approvals</div>
          <div className="tabular-nums mt-2 text-3xl font-medium tracking-tight text-[var(--text-primary)]">
            {analytics.gate1Pending + analytics.gate2Pending}
          </div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">
            {analytics.gate1Pending} Gate 1 · {analytics.gate2Pending} Gate 2
          </div>
        </div>

        <div className="studio-surface rounded-xl border p-5">
          <div className="text-xs text-[var(--text-muted)]">Drafts submitted</div>
          <div className="tabular-nums mt-2 text-3xl font-medium tracking-tight text-[var(--text-primary)]">
            {analytics.draftsSubmitted}
          </div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">
            {analytics.changesRequested} in rework
          </div>
        </div>
      </div>

      {/* Asymmetric Split: 2/3 Main Topic Chart + 1/3 Team Workload List */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="studio-surface rounded-xl border p-5 lg:col-span-2">
          <h2 className="text-base font-medium text-[var(--text-primary)]">
            Mental health topic coverage
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Item distribution across Manan Wellness content pillars
          </p>

          <div className="mt-5 space-y-3">
            {analytics.topics.map((t, idx) => {
              const pct = Math.round((t.count / maxTopicCount) * 100);
              return (
                <div key={t.topic} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[var(--text-primary)]">
                      {t.topic}
                    </span>
                    <span className="font-mono-meta text-[var(--text-muted)]">
                      {t.count}
                    </span>
                  </div>
                  <div className="studio-raised h-2.5 overflow-hidden rounded">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${pct}%`,
                        backgroundColor:
                          idx === 0 ? "var(--accent)" : "var(--text-muted)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="studio-surface rounded-xl border p-5">
          <h2 className="text-base font-medium text-[var(--text-primary)]">
            Team workload
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Active and total assignments
          </p>

          <div className="mt-4 divide-y divide-[var(--border-subtle)]">
            {analytics.workload.map((w) => (
              <div
                key={w.name}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <span className="capitalize text-[var(--text-primary)]">{w.name}</span>
                <span className="font-mono-meta text-xs text-[var(--text-secondary)]">
                  {w.active} active / {w.total}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Format Mix + Next Actions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="studio-surface rounded-xl border p-5">
          <h2 className="mb-4 text-base font-medium text-[var(--text-primary)]">
            Format mix
          </h2>
          <div className="space-y-3">
            {analytics.byFormat.map((f) => {
              const pct =
                analytics.total > 0 ? Math.round((f.count / analytics.total) * 100) : 0;
              return (
                <div key={f.value} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[var(--text-primary)]">
                      {f.label}
                    </span>
                    <span className="font-mono-meta text-[var(--text-muted)]">
                      {f.count} ({pct}%)
                    </span>
                  </div>
                  <div className="studio-raised h-2 overflow-hidden rounded">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: "var(--accent)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="studio-surface rounded-xl border p-5">
          <h2 className="mb-4 text-base font-medium text-[var(--text-primary)]">
            Recommended next actions
          </h2>
          <ul className="space-y-2.5 text-sm text-[var(--text-secondary)]">
            {analytics.recommendations.length === 0 ? (
              <li>Pipeline is balanced across all stages.</li>
            ) : (
              analytics.recommendations.map((rec) => (
                <li
                  key={rec}
                  className="studio-raised rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed"
                >
                  {rec}
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
