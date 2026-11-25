"use client";

import React, { useMemo } from "react";
import { AlertCircle, CheckCircle2, Flame, Layers, TrendingUp, Users } from "lucide-react";
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
        `${gate2Pending} draft video(s) are waiting at Gate 2 — review these first so approved videos can go live.`
      );
    }
    if (gate1Pending > 10) {
      recommendations.push(
        `${gate1Pending} ideas are waiting in Gate 1 (${lowEffortReady} low-effort). Batch-approving 5–10 quick wins keeps the team fed for the week.`
      );
    }
    if (longFormCount === 0) {
      recommendations.push(
        `You currently have 0 Long form ideas — add 2–3 deeper explainer topics (e.g. Therapy FAQ or Panic vs Anxiety) to balance your Reels / Shorts.`
      );
    }
    if (readyToPost > 0) {
      recommendations.push(
        `${readyToPost} video(s) are Approved to Post — schedule and publish them, then paste the live link to close the loop.`
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Pipeline Insights
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Content health, topic balance, team workload, and approval velocity
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToContent}
          className="studio-surface rounded-lg border px-3.5 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
        >
          Inspect Content Table
        </button>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="studio-surface rounded-2xl border p-4">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Gate 1 Pass Rate</span>
            <TrendingUp className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            {analytics.gate1ApprovalRate}%
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {analytics.pastGate1} approved out of reviewed ideas
          </p>
        </div>

        <div className="studio-surface rounded-2xl border p-4">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Publishing Queue</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            {analytics.readyToPost + analytics.posted}
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {analytics.readyToPost} ready to post · {analytics.posted} posted
          </p>
        </div>

        <div className="studio-surface rounded-2xl border p-4">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Pending Approvals</span>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">
            {analytics.gate1Pending + analytics.gate2Pending}
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {analytics.gate1Pending} Gate 1 · {analytics.gate2Pending} Gate 2
          </p>
        </div>

        <div className="studio-surface rounded-2xl border p-4">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Drafts &amp; Rework</span>
            <Flame className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600">
            {analytics.draftsSubmitted}
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {analytics.changesRequested} currently in changes requested
          </p>
        </div>
      </div>

      {/* Funnel & Format Breakdown */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="studio-surface rounded-2xl border p-5">
          <div className="mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-teal-600" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Format Mix &amp; Workflow Funnel
            </h3>
          </div>

          <div className="space-y-3">
            {analytics.byFormat.map((f) => {
              const pct =
                analytics.total > 0 ? Math.round((f.count / analytics.total) * 100) : 0;
              return (
                <div key={f.value} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[var(--text-primary)]">
                      {f.label}
                    </span>
                    <span className="text-[var(--text-muted)]">
                      {f.count} ({pct}%)
                    </span>
                  </div>
                  <div className="studio-muted h-2.5 overflow-hidden rounded-full border">
                    <div
                      className="h-full rounded-full bg-teal-600 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 border-t border-[var(--border-subtle)] pt-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Recommended Next Actions
            </h4>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
              {analytics.recommendations.length === 0 ? (
                <li>Pipeline looks balanced across all stages!</li>
              ) : (
                analytics.recommendations.map((rec) => (
                  <li
                    key={rec}
                    className="studio-muted rounded-lg border px-3 py-2"
                  >
                    {rec}
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        {/* Mental Health Topic Pillars */}
        <section className="studio-surface rounded-2xl border p-5">
          <h3 className="mb-4 text-sm font-bold text-[var(--text-primary)]">
            Mental Health Topic Coverage
          </h3>
          <div className="space-y-2.5">
            {analytics.topics.map((t) => {
              const pct = Math.round((t.count / maxTopicCount) * 100);
              return (
                <div key={t.topic} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[var(--text-primary)]">
                      {t.topic}
                    </span>
                    <span className="text-[var(--text-muted)]">{t.count} items</span>
                  </div>
                  <div className="studio-muted h-2 overflow-hidden rounded-full border">
                    <div
                      className="h-full rounded-full bg-sky-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Team Workload */}
      <section className="studio-surface rounded-2xl border p-5">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-teal-600" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Team Production Workload
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {analytics.workload.map((w) => (
            <div
              key={w.name}
              className="studio-muted rounded-xl border p-3.5 text-xs"
            >
              <div className="font-semibold capitalize text-[var(--text-primary)]">
                {w.name}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold text-teal-600">{w.total}</span>
                <span className="text-[var(--text-muted)]">
                  total · {w.active} active
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
