export type DefaultMode = "learn" | "test";

export interface AppSettings {
  defaultMode: DefaultMode;
  autoRunConvertedSql: boolean;
  confirmDangerousQueries: boolean;
  resultRowLimit: number;
  weeklyGoalTarget: number;
  compactTable: boolean;
  showNullAsDash: boolean;
  apiBaseUrl: string;
}

const SETTINGS_STORAGE_KEY = "querycraft_app_settings_v1";

const FALLBACK_API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:3000";

const DEFAULT_SETTINGS: AppSettings = {
  defaultMode: "learn",
  autoRunConvertedSql: false,
  confirmDangerousQueries: true,
  resultRowLimit: 50,
  weeklyGoalTarget: 40,
  compactTable: false,
  showNullAsDash: true,
  apiBaseUrl: FALLBACK_API_BASE_URL,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeApiBaseUrl(value: unknown, fallback: string): string {
  const candidate = String(value || "").trim();
  const normalized = candidate.replace(/\/+$/, "");
  if (normalized) return normalized;
  return fallback.replace(/\/+$/, "");
}

function sanitizeSettings(value: unknown): AppSettings {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;

  const defaultMode = raw.defaultMode === "test" ? "test" : "learn";
  const apiBaseUrl = normalizeApiBaseUrl(raw.apiBaseUrl, DEFAULT_SETTINGS.apiBaseUrl);

  return {
    defaultMode,
    autoRunConvertedSql: toBoolean(raw.autoRunConvertedSql, DEFAULT_SETTINGS.autoRunConvertedSql),
    confirmDangerousQueries: toBoolean(raw.confirmDangerousQueries, DEFAULT_SETTINGS.confirmDangerousQueries),
    resultRowLimit: clamp(Number(raw.resultRowLimit) || DEFAULT_SETTINGS.resultRowLimit, 10, 500),
    weeklyGoalTarget: clamp(Number(raw.weeklyGoalTarget) || DEFAULT_SETTINGS.weeklyGoalTarget, 5, 500),
    compactTable: toBoolean(raw.compactTable, DEFAULT_SETTINGS.compactTable),
    showNullAsDash: toBoolean(raw.showNullAsDash, DEFAULT_SETTINGS.showNullAsDash),
    apiBaseUrl: apiBaseUrl || DEFAULT_SETTINGS.apiBaseUrl,
  };
}

export function getDefaultSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS };
}

export function getAppSettings(): AppSettings {
  if (typeof window === "undefined") return getDefaultSettings();

  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return getDefaultSettings();
    const parsed = JSON.parse(raw) as unknown;
    return sanitizeSettings(parsed);
  } catch {
    return getDefaultSettings();
  }
}

export function saveAppSettings(partial: Partial<AppSettings>): AppSettings {
  const current = getAppSettings();
  const next = sanitizeSettings({ ...current, ...partial });

  if (typeof window !== "undefined") {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
  }

  return next;
}

export function resetAppSettings(): AppSettings {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  }

  return getDefaultSettings();
}

export function getApiBaseUrl(): string {
  const settings = getAppSettings();
  return normalizeApiBaseUrl(settings.apiBaseUrl, DEFAULT_SETTINGS.apiBaseUrl);
}

// File use case:
// This file is the single source of truth for frontend user settings in QueryCraft.
// It defines settings schema, safe defaults, persistence helpers, sanitization, and API base URL resolution.
// Any page that needs user preferences should read/write via these functions to keep behavior consistent.
