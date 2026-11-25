"use client";

import React, { useState } from "react";
import { ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types/content";

interface TeamRolesModalProps {
  open: boolean;
  onClose: () => void;
}

export function TeamRolesModal({ open, onClose }: TeamRolesModalProps) {
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

  const handlePreassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      await saveRolePreassignment(email, role, teamTag);
      setEmail("");
      setMsg("Pre-assignment saved. That email will receive the role on sign-in.");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Failed to save pre-assignment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      titleId="team-roles-title"
      title="Team Directory & Manager Roles"
      subtitle="Everyone can sign in to collaborate; only Managers can approve ideas (Gate 1) and final videos (Gate 2)."
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-5">
        {!isManager ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            You are signed in as a <strong>Team Member</strong>. To configure the initial Manager email before anyone is promoted, add it to{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5">scripts/managers.json</code>{" "}
            and run <code className="rounded bg-amber-100 px-1 py-0.5">npm run seed:managers</code>.
          </div>
        ) : (
          <form
            onSubmit={handlePreassign}
            className="space-y-3 rounded-xl border border-teal-200 bg-teal-50/60 p-4"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-teal-950">
              <UserPlus className="h-4 w-4 text-teal-700" />
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
                className="sm:col-span-2 rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm"
              />
              <select
                aria-label="Pre-assigned role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="rounded-lg border border-teal-200 bg-white px-2.5 py-2 text-sm"
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
              className="w-full rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-xs"
            />
            {msg ? (
              <p role="status" className="text-xs font-medium text-teal-800">
                {msg}
              </p>
            ) : null}
          </form>
        )}

        <div>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            Signed-In Team Members ({teamUsers.length})
          </h2>
          <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
            {teamUsers.map((u) => (
              <div
                key={u.uid}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <span>{u.displayName}</span>
                    {u.uid === profile?.uid ? (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                        You
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-slate-500">
                    {u.email} {u.teamTag ? `· ${u.teamTag}` : ""}
                  </div>
                </div>

                {isManager ? (
                  <div className="flex items-center gap-2">
                    <select
                      aria-label={`Role for ${u.displayName}`}
                      value={u.role}
                      disabled={busy || u.uid === profile?.uid}
                      onChange={(e) =>
                        void updateMemberRole(u.uid, e.target.value as UserRole, u.teamTag)
                      }
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium"
                    >
                      <option value="manager">Manager (Can Approve)</option>
                      <option value="member">Team Member</option>
                    </select>
                  </div>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      u.role === "manager"
                        ? "bg-teal-100 text-teal-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {u.role === "manager" ? <ShieldCheck className="h-3.5 w-3.5" /> : null}
                    {u.role === "manager" ? "Manager" : "Member"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {isManager && preassignments.length > 0 ? (
          <div>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Pre-assigned Email Rules ({preassignments.length})
            </h2>
            <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
              {preassignments.map((p) => (
                <div
                  key={p.email}
                  className="flex items-center justify-between px-4 py-2.5 text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800">{p.email}</span>
                    <span className="ml-2 rounded bg-teal-100 px-1.5 py-0.5 font-semibold text-teal-800">
                      {p.role}
                    </span>
                    {p.teamTag ? (
                      <span className="ml-2 text-slate-500">{p.teamTag}</span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => void removeRolePreassignment(p.email)}
                    className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Remove ${p.email}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </ModalDialog>
  );
}
