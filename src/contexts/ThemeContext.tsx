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

function syncTheme(pref: ThemePreference, resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) {
    meta.setAttribute("content", pref === "system" ? "light dark" : pref);
  }
  if (resolved === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [systemScheme, setSystemScheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const initialSystem = mq.matches ? "dark" : "light";
    setSystemScheme(initialSystem);

    let activePref: ThemePreference = "system";
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        activePref = stored;
      }
    } catch {
      // Ignore storage failures
    }
    setPreference(activePref);
    syncTheme(activePref, activePref === "system" ? initialSystem : activePref);

    const onMediaChange = (e: MediaQueryListEvent) => {
      const nextSys = e.matches ? "dark" : "light";
      setSystemScheme(nextSys);
      setPreference((currentPref) => {
        syncTheme(currentPref, currentPref === "system" ? nextSys : currentPref);
        return currentPref;
      });
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next =
        e.newValue === "light" || e.newValue === "dark" ? e.newValue : "system";
      setPreference(next);
      setSystemScheme((currentSys) => {
        syncTheme(next, next === "system" ? currentSys : next);
        return currentSys;
      });
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
    const resolved = next === "system" ? systemScheme : next;
    syncTheme(next, resolved);
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
