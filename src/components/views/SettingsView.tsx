"use client";

import React, { useState } from "react";
import { Check, Copy, Hash, Monitor, Moon, Sun, Trash2, UserPlus } from "lucide-react";
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
      setMsg("Saved email pre-assignment");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Failed to save pre-assignment");
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
      label: `System (${systemScheme})`,
      description: "Matches your device theme",
      icon: <Monitor className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={1.5} />,
    },
    {
      value: "light",
      label: "Light",
      description: "Bright studio surface",
      icon: <Sun className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={1.5} />,
    },
    {
      value: "dark",
      label: "Dark",
      description: "Graphite dark studio",
      icon: <Moon className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={1.5} />,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
        Settings
      </h1>

      {/* Appearance */}
      <section className="studio-surface rounded-2xl border p-5">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Appearance
        </h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Choose Dark, Light, or System theme
        </p>

        <fieldset className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <legend className="sr-only">Theme preference</legend>
          {themeOptions.map((opt) => {
            const active = preference === opt.value;
            return (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                  active
                    ? "border-[var(--accent-border)] bg-[var(--accent-soft)]"
                    : "studio-raised hover:bg-[var(--bg-hover)]"
                }`}
              >
                <input
                  type="radio"
                  name="theme-preference"
                  value={opt.value}
                  checked={active}
                  onChange={() => setThemePreference(opt.value)}
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)]">
                    {opt.icon}
                    <span>{opt.label}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
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
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Team roles and permissions
          </h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Everyone can sign in and submit drafts; only Managers approve Gate 1 and Gate 2.
          </p>
        </div>

        {!isManager ? (
          <div className="studio-raised rounded-xl border px-4 py-3 text-xs text-[var(--text-secondary)]">
            Signed in as a Team member. To pre-seed the initial Manager email, add it to{" "}
            <code className="font-mono-meta">scripts/managers.json</code> and run{" "}
            <code className="font-mono-meta">npm run seed:managers</code>.
          </div>
        ) : (
          <form
            onSubmit={handlePreassign}
            className="studio-raised space-y-3 rounded-xl border p-4"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-primary)]">
              <UserPlus className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={1.5} />
              <span>Pre-assign role by email</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
              <input
                type="email"
                required
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@mananwellness.com"
                className="studio-input h-9 sm:col-span-2 rounded-xl border px-3 text-sm"
              />
              <select
                aria-label="Pre-assigned role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="studio-input h-9 rounded-xl border px-2.5 text-sm"
              >
                <option value="manager">Manager</option>
                <option value="member">Member</option>
              </select>
              <button
                type="submit"
                disabled={busy}
                className="studio-btn-accent h-9 rounded-full px-3 text-xs font-medium disabled:opacity-50"
              >
                Save email
              </button>
            </div>
            <input
              type="text"
              value={teamTag}
              onChange={(e) => setTeamTag(e.target.value)}
              placeholder="Team label"
              className="studio-input h-9 w-full rounded-xl border px-3 text-xs"
            />
            {msg ? (
              <p role="status" className="text-xs font-medium text-[var(--accent-text)]">
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
                <div className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                  <span>{u.displayName}</span>
                  {u.uid === profile?.uid ? (
                    <span className="studio-raised rounded border px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
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
                  className="studio-input h-8 rounded-lg border px-2.5 text-xs font-medium"
                >
                  <option value="manager">Manager</option>
                  <option value="member">Team member</option>
                </select>
              ) : (
                <span className="studio-raised inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs text-[var(--text-secondary)]">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        u.role === "manager" ? "var(--accent)" : "var(--text-muted)",
                    }}
                  />
                  {u.role === "manager" ? "Manager" : "Member"}
                </span>
              )}
            </div>
          ))}
        </div>

        {isManager && preassignments.length > 0 ? (
          <div className="divide-y divide-[var(--border-subtle)] rounded-lg border border-[var(--border-subtle)]">
            {preassignments.map((p) => (
              <div
                key={p.email}
                className="flex items-center justify-between px-4 py-2.5 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--text-primary)]">
                    {p.email}
                  </span>
                  <span className="studio-raised rounded border px-1.5 py-0.5 capitalize text-[var(--text-secondary)]">
                    {p.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void removeRolePreassignment(p.email)}
                  className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--danger)]"
                  aria-label={`Remove ${p.email}`}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {/* Hashtag Bank */}
      <section className="studio-surface space-y-3 rounded-2xl border p-5">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={1.5} />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Hashtag presets
          </h2>
          <span className="font-mono-meta text-xs text-[var(--text-muted)]">
            ({hashtagPresets.length})
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {hashtagPresets.map((preset) => (
            <div key={preset.id} className="studio-raised rounded-xl border p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium capitalize text-[var(--text-primary)]">
                  {preset.category}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyTags(preset)}
                  className="studio-surface inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  {copiedId === preset.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[var(--positive)]" strokeWidth={1.5} />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                {preset.tags.join(" ")}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
