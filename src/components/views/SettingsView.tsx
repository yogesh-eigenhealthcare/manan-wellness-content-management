"use client";

import React, { useState } from "react";
import { Check, Copy, Hash, Monitor, Moon, ShieldCheck, Sun, Trash2, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, type ThemePreference } from "@/contexts/ThemeContext";
import type { HashtagPreset, UserRole } from "@/types/content";

interface SettingsViewProps {
  hashtagPresets: HashtagPreset[];
}

export function SettingsView({ hashtagPresets }: SettingsViewProps) {
  const { preference, systemScheme, setThemePreference } = useTheme();
  const {
    profile,
    teamUsers,
    preassignments,
    isManager,
    updateMemberRole,
    saveRolePreassignment,
    removeRolePreassignment,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("manager");
  const [teamTag, setTeamTag] = useState("Marketing Manager");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handlePreassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      await saveRolePreassignment(email, role, teamTag);
      setEmail("");
      setMsg("Saved email pre-assignment.");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Failed to save pre-assignment.");
    } finally {
      setBusy(false);
    }
  };

  const handleCopyTags = async (preset: HashtagPreset) => {
    await navigator.clipboard.writeText(preset.tags.join(" "));
    setCopiedId(preset.id);
    setTimeout(() => setCopiedId((c) => (c === preset.id ? null : c)), 1800);
  };

  const themeOptions: {
    value: ThemePreference;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: "system",
      label: `System (Currently ${systemScheme})`,
      description: "Automatically matches your device theme.",
      icon: <Monitor className="h-4 w-4" />,
    },
    {
      value: "light",
      label: "Light Mode",
      description: "Bright studio workspace.",
      icon: <Sun className="h-4 w-4" />,
    },
    {
      value: "dark",
      label: "Dark Mode",
      description: "Low-glare dark workspace.",
      icon: <Moon className="h-4 w-4" />,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Settings</h2>
        <p className="text-xs text-[var(--text-muted)]">
          Appearance, manager approval roles, and Manan Wellness hashtag presets
        </p>
      </div>

      {/* Theme Appearance */}
      <section className="studio-surface rounded-2xl border p-5">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Appearance</h3>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Choose Dark Mode, Light Mode, or follow your OS preference.
        </p>

        <fieldset className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <legend className="sr-only">Theme preference</legend>
          {themeOptions.map((opt) => {
            const active = preference === opt.value;
            return (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                  active
                    ? "border-teal-600 bg-teal-600/10"
                    : "studio-muted hover:border-teal-500/60"
                }`}
              >
                <input
                  type="radio"
                  name="theme-preference"
                  value={opt.value}
                  checked={active}
                  onChange={() => setThemePreference(opt.value)}
                  className="mt-0.5 accent-teal-600"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                    {opt.icon}
                    <span>{opt.label}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                    {opt.description}
                  </p>
                </div>
              </label>
            );
          })}
        </fieldset>
      </section>

      {/* Team Roles & Manager Access */}
      <section className="studio-surface space-y-4 rounded-2xl border p-5">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Team Roles &amp; Manager Permissions
          </h3>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Everyone can sign in and submit drafts; only Managers can approve ideas (Gate 1) and final cuts (Gate 2).
          </p>
        </div>

        {!isManager ? (
          <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            You are signed in as a <strong>Team Member</strong>. To pre-seed the initial Manager email, add it to{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5">scripts/managers.json</code> and run{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5">npm run seed:managers</code>.
          </div>
        ) : (
          <form
            onSubmit={handlePreassign}
            className="studio-muted space-y-3 rounded-xl border p-4"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
              <UserPlus className="h-4 w-4 text-teal-600" />
              Pre-assign Manager / Team Role by Email
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
              <input
                type="email"
                required
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@mananwellness.com"
                className="studio-input sm:col-span-2 rounded-lg border px-3 py-2 text-sm"
              />
              <select
                aria-label="Pre-assigned role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="studio-input rounded-lg border px-2.5 py-2 text-sm"
              >
                <option value="manager">Manager</option>
                <option value="member">Member</option>
              </select>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                Save Email Role
              </button>
            </div>
            <input
              type="text"
              value={teamTag}
              onChange={(e) => setTeamTag(e.target.value)}
              placeholder="Team label (e.g. Marketing Manager, Animation Team)"
              className="studio-input w-full rounded-lg border px-3 py-1.5 text-xs"
            />
            {msg ? (
              <p role="status" className="text-xs font-medium text-teal-600">
                {msg}
              </p>
            ) : null}
          </form>
        )}

        <div className="divide-y divide-[var(--border-subtle)] rounded-xl border border-[var(--border-subtle)]">
          {teamUsers.map((u) => (
            <div
              key={u.uid}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <div>
                <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                  <span>{u.displayName}</span>
                  {u.uid === profile?.uid ? (
                    <span className="studio-muted rounded border px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
                      You
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {u.email} {u.teamTag ? `· ${u.teamTag}` : ""}
                </div>
              </div>

              {isManager ? (
                <select
                  aria-label={`Role for ${u.displayName}`}
                  value={u.role}
                  disabled={busy || u.uid === profile?.uid}
                  onChange={(e) =>
                    void updateMemberRole(u.uid, e.target.value as UserRole, u.teamTag)
                  }
                  className="studio-input rounded-lg border px-2.5 py-1.5 text-xs font-medium"
                >
                  <option value="manager">Manager (Can Approve)</option>
                  <option value="member">Team Member</option>
                </select>
              ) : (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    u.role === "manager"
                      ? "bg-teal-100 text-teal-800"
                      : "studio-muted text-[var(--text-secondary)]"
                  }`}
                >
                  {u.role === "manager" ? <ShieldCheck className="h-3.5 w-3.5" /> : null}
                  {u.role === "manager" ? "Manager" : "Member"}
                </span>
              )}
            </div>
          ))}
        </div>

        {isManager && preassignments.length > 0 ? (
          <div className="divide-y divide-[var(--border-subtle)] rounded-xl border border-[var(--border-subtle)]">
            {preassignments.map((p) => (
              <div
                key={p.email}
                className="flex items-center justify-between px-4 py-2.5 text-xs"
              >
                <div>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {p.email}
                  </span>
                  <span className="ml-2 rounded bg-teal-100 px-1.5 py-0.5 font-semibold text-teal-800">
                    {p.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void removeRolePreassignment(p.email)}
                  className="rounded p-1 text-[var(--text-muted)] hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Remove ${p.email}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {/* Hashtag Bank */}
      <section className="studio-surface space-y-3 rounded-2xl border p-5">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-teal-600" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Hashtag Presets ({hashtagPresets.length})
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {hashtagPresets.map((preset) => (
            <div
              key={preset.id}
              className="studio-muted rounded-xl border p-3.5"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold capitalize text-[var(--text-primary)]">
                  {preset.category}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyTags(preset)}
                  className="studio-surface inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  {copiedId === preset.id ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                {preset.tags.join(" ")}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
