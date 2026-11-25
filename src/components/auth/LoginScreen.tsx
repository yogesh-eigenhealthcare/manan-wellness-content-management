"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function LoginScreen() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, authError, clearAuthError } =
    useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(displayName, email, password);
      }
    } catch {
      // Surfaced via authError
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch {
      // Surfaced via authError
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--bg-app)] p-6">
      <div className="studio-surface w-full max-w-md rounded-xl border p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-white px-2.5">
            <img
              src="https://mananwellness.com/svg/manan-logo.svg"
              alt="Manan Wellness"
              className="h-6 w-auto"
            />
          </div>
          <div>
            <h1 className="text-lg font-medium text-[var(--text-primary)]">
              Manan Wellness Studio
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              Content planning and two-gate approval
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={submitting}
          className="studio-raised flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border px-4 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-60"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <div className="h-px flex-1 bg-[var(--border-subtle)]" />
          <span>or</span>
          <div className="h-px flex-1 bg-[var(--border-subtle)]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" ? (
            <div>
              <label
                htmlFor="fullname"
                className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
              >
                Full name
              </label>
              <input
                id="fullname"
                name="fullname"
                type="text"
                autoComplete="name"
                required
                value={displayName}
                onChange={(e) => {
                  clearAuthError();
                  setDisplayName(e.target.value);
                }}
                placeholder="Avantika or Animation Team"
                className="studio-input h-10 w-full rounded-lg border px-3 text-sm"
              />
            </div>
          ) : null}

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              spellCheck={false}
              enterKeyHint="next"
              required
              value={email}
              onChange={(e) => {
                clearAuthError();
                setEmail(e.target.value);
              }}
              placeholder="you@mananwellness.com"
              className="studio-input h-10 w-full rounded-lg border px-3 text-sm"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
                Password
              </label>
              <button
                type="button"
                aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {showPassword ? (
                  <>
                    <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                    <span>Show</span>
                  </>
                )}
              </button>
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
              enterKeyHint="done"
              required
              value={password}
              onChange={(e) => {
                clearAuthError();
                setPassword(e.target.value);
              }}
              className="studio-input h-10 w-full rounded-lg border px-3 text-sm"
            />
          </div>

          {authError ? (
            <div
              role="alert"
              aria-live="polite"
              className="studio-raised rounded-lg border border-l-4 px-3 py-2 text-xs text-[var(--danger)]"
              style={{ borderLeftColor: "var(--danger)" }}
            >
              {authError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="studio-btn-accent flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium disabled:opacity-60"
          >
            <Lock className="h-4 w-4" strokeWidth={1.5} />
            <span>
              {submitting
                ? "Please wait"
                : mode === "signin"
                  ? "Sign in"
                  : "Create team account"}
            </span>
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-[var(--text-muted)]">
          {mode === "signin" ? (
            <>
              New to the team?{" "}
              <button
                type="button"
                onClick={() => {
                  clearAuthError();
                  setMode("signup");
                }}
                className="font-medium text-[var(--accent)] hover:underline"
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  clearAuthError();
                  setMode("signin");
                }}
                className="font-medium text-[var(--accent)] hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
