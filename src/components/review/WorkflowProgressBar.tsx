"use client";

import React from "react";
import { Check, RotateCcw } from "lucide-react";
import { STATUS_META, getWorkflowProgress } from "@/lib/workflow";
import type { WorkflowStatus } from "@/types/content";

interface WorkflowProgressBarProps {
  status: WorkflowStatus;
}

export function WorkflowProgressBar({ status }: WorkflowProgressBarProps) {
  const progress = getWorkflowProgress(status);
  if (!progress) return null;

  const { checkpoints, currentIndex, isComplete, isRework, percent } = progress;
  const meta = STATUS_META[status];

  return (
    <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-raised)]/70 px-4 py-3.5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-medium text-[var(--text-secondary)]">
          Pipeline progress
        </span>
        <span className="font-mono-meta text-[11px] font-medium text-[var(--text-muted)]">
          Step {currentIndex + 1} of {checkpoints.length} · {meta.label}
        </span>
      </div>

      <div className="relative">
        {/* Background & filled track spanning center-to-center of the 5 columns */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-3 left-[10%] right-[10%] h-1 rounded-full bg-[var(--border-strong)]"
        >
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{
              width: `${percent}%`,
              backgroundColor: isRework ? "var(--warning)" : "var(--positive)",
            }}
          />
        </div>

        <ol
          aria-label="Content workflow checkpoints"
          className="relative grid grid-cols-5 gap-1"
        >
          {checkpoints.map((cp, idx) => {
            const done = idx < currentIndex || isComplete;
            const current = idx === currentIndex && !isComplete;

            return (
              <li
                key={cp.key}
                aria-current={idx === currentIndex ? "step" : undefined}
                className="flex flex-col items-center text-center"
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${
                    done
                      ? "border-[var(--positive)] bg-[var(--positive)] text-white"
                      : current && isRework
                        ? "border-[#ea580c] bg-[#ffedd5] text-[#9a3412] ring-4 ring-[#ffedd5]/70 dark:border-orange-400 dark:bg-orange-500/20 dark:text-orange-200 dark:ring-orange-500/20"
                        : current
                          ? "border-[var(--positive)] bg-[var(--bg-surface)] text-[var(--positive)] ring-4 ring-[var(--pastel-mint)]"
                          : "border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-muted)]"
                  }`}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  ) : current && isRework ? (
                    <RotateCcw className="h-3 w-3" strokeWidth={2.25} />
                  ) : current ? (
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: "var(--positive)" }}
                    />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </span>

                <span
                  className={`mt-1.5 text-[11px] leading-tight sm:text-xs ${
                    done || current
                      ? "font-medium text-[var(--text-primary)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {cp.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
