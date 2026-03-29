export type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "querycraft_theme_mode_v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function getStoredTheme(): ThemeMode | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  return raw === "dark" || raw === "light" ? raw : null;
}

export function getSystemTheme(): ThemeMode {
  if (!isBrowser()) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getResolvedTheme(): ThemeMode {
  return getStoredTheme() || getSystemTheme();
}

export function getCurrentTheme(): ThemeMode {
  if (!isBrowser()) return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyTheme(theme: ThemeMode) {
  if (!isBrowser()) return;

  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

// File use case:
// This file centralizes light/dark theme persistence and DOM class application.
// It ensures both landing and dashboard layouts use one consistent source of truth for theme behavior.
