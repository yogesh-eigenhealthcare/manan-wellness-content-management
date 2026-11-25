"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemePreference = "system" | "light" | "dark";

interface ThemeContextValue {
  preference: ThemePreference;
  systemScheme: "light" | "dark";
  resolvedScheme: "light" | "dark";
  setThemePreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "color-scheme";

function syncMetaTag(pref: ThemePreference) {
  if (typeof document === "undefined") return;
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) {
    meta.setAttribute("content", pref === "system" ? "light dark" : pref);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [systemScheme, setSystemScheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        setPreference(stored);
        syncMetaTag(stored);
      } else {
        setPreference("system");
        syncMetaTag("system");
      }
    } catch {
      // Ignore storage failures
    }

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemScheme(mq.matches ? "dark" : "light");

    const onMediaChange = (e: MediaQueryListEvent) => {
      setSystemScheme(e.matches ? "dark" : "light");
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next =
        e.newValue === "light" || e.newValue === "dark" ? e.newValue : "system";
      setPreference(next);
      syncMetaTag(next);
    };

    mq.addEventListener("change", onMediaChange);
    window.addEventListener("storage", onStorage);
    return () => {
      mq.removeEventListener("change", onMediaChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setThemePreference = (next: ThemePreference) => {
    setPreference(next);
    syncMetaTag(next);
    try {
      if (next === "system") {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, next);
      }
    } catch {
      // Ignore storage failures
    }
  };

  const resolvedScheme = preference === "system" ? systemScheme : preference;

  return (
    <ThemeContext.Provider
      value={{ preference, systemScheme, resolvedScheme, setThemePreference }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
