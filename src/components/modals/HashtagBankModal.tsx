"use client";

import React, { useState } from "react";
import { Check, Copy, Hash } from "lucide-react";
import { ModalDialog } from "@/components/ui/ModalDialog";
import type { HashtagPreset } from "@/types/content";

interface HashtagBankModalProps {
  open: boolean;
  onClose: () => void;
  presets: HashtagPreset[];
}

export function HashtagBankModal({ open, onClose, presets }: HashtagBankModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (preset: HashtagPreset) => {
    await navigator.clipboard.writeText(preset.tags.join(" "));
    setCopiedId(preset.id);
    setTimeout(() => setCopiedId((curr) => (curr === preset.id ? null : curr)), 1800);
  };

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      titleId="hashtag-bank-title"
      title="Manan Wellness Hashtag Bank"
      subtitle="Reusable hashtag sets imported from your spreadsheet."
      maxWidthClass="max-w-2xl"
    >
      {presets.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No hashtag presets imported yet. Run{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
            npm run import:sheet
          </code>{" "}
          to seed your sheet&apos;s hashtag groups.
        </p>
      ) : (
        <div className="space-y-3">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-sm font-semibold capitalize text-slate-900">
                  <Hash className="h-4 w-4 text-teal-600" />
                  {preset.category}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(preset)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  {copiedId === preset.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy All
                    </>
                  )}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {preset.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-white px-2 py-0.5 text-xs text-slate-700 border border-slate-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalDialog>
  );
}
