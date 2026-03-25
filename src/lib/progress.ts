export type ProgressMode = "learn" | "test";
export type AttemptStatus = "success" | "failed";

export interface ProgressAttempt {
  id: string;
  dateISO: string;
  mode: ProgressMode;
  topic: string;
  status: AttemptStatus;
  durationSec: number;
  rowsReturned: number;
}

export interface DailyTrendPoint {
  dateLabel: string;
  attempts: number;
  accuracy: number;
}

export interface ProgressGoals {
  dailyAttemptTarget: number;
  dailyAttemptsCompleted: number;
  weeklyAttemptTarget: number;
  weeklyAttemptsCompleted: number;
}

export interface ProgressAchievement {
  id: string;
  title: string;
  unlocked: boolean;
}

export interface ProgressData {
  attempts: ProgressAttempt[];
  dailyTrend: DailyTrendPoint[];
  goals: ProgressGoals;
  achievements: ProgressAchievement[];
  lastUpdatedISO: string;
}

export interface ProgressStats {
  totalAttempts: number;
  successRate: number;
  avgDurationSec: number;
  practiceMinutes: number;
  currentStreak: number;
  bestStreak: number;
}

export interface RecordProgressAttemptInput {
  mode: ProgressMode;
  status: AttemptStatus;
  durationSec: number;
  rowsReturned: number;
  topicHint?: string;
  sourceText?: string;
}

const PROGRESS_STORAGE_KEY = "querycraft_progress_attempts_v1";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function safeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseStatus(value: unknown): AttemptStatus {
  return value === "success" ? "success" : "failed";
}

function parseMode(value: unknown): ProgressMode {
  return value === "test" ? "test" : "learn";
}

export function mapBackendProgressData(raw: unknown): ProgressData {
  const payload = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const attemptsSource = Array.isArray(payload.attempts) ? payload.attempts : [];

  const attempts: ProgressAttempt[] = attemptsSource.map((item, index) => {
    const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      id: String(row.id ?? `attempt-${index + 1}`),
      dateISO: String(row.dateISO ?? new Date().toISOString()),
      mode: parseMode(row.mode),
      topic: String(row.topic ?? "General SQL"),
      status: parseStatus(row.status),
      durationSec: clamp(safeNumber(row.durationSec, 0), 0, 86_400),
      rowsReturned: clamp(safeNumber(row.rowsReturned, 0), 0, 10_000),
    };
  });

  const trendSource = Array.isArray(payload.dailyTrend) ? payload.dailyTrend : [];
  const dailyTrend: DailyTrendPoint[] = trendSource.map((item, index) => {
    const point = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      dateLabel: String(point.dateLabel ?? `D${index + 1}`),
      attempts: clamp(safeNumber(point.attempts, 0), 0, 10_000),
      accuracy: clamp(safeNumber(point.accuracy, 0), 0, 100),
    };
  });

  const goalsRaw = (payload.goals && typeof payload.goals === "object" ? payload.goals : {}) as Record<string, unknown>;

  const goals: ProgressGoals = {
    dailyAttemptTarget: clamp(safeNumber(goalsRaw.dailyAttemptTarget, 10), 1, 500),
    dailyAttemptsCompleted: clamp(safeNumber(goalsRaw.dailyAttemptsCompleted, 0), 0, 500),
    weeklyAttemptTarget: clamp(safeNumber(goalsRaw.weeklyAttemptTarget, 60), 1, 5_000),
    weeklyAttemptsCompleted: clamp(safeNumber(goalsRaw.weeklyAttemptsCompleted, 0), 0, 5_000),
  };

  const achievementsRaw = Array.isArray(payload.achievements) ? payload.achievements : [];
  const achievements: ProgressAchievement[] = achievementsRaw.map((item, index) => {
    const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      id: String(row.id ?? `achievement-${index + 1}`),
      title: String(row.title ?? "Achievement"),
      unlocked: Boolean(row.unlocked),
    };
  });

  return {
    attempts,
    dailyTrend,
    goals,
    achievements,
    lastUpdatedISO: String(payload.lastUpdatedISO ?? new Date().toISOString()),
  };
}

export function calculateSuccessRate(attempts: ProgressAttempt[]): number {
  if (!attempts.length) return 0;
  const successCount = attempts.filter((entry) => entry.status === "success").length;
  return Math.round((successCount / attempts.length) * 100);
}

export function calculateAverageDuration(attempts: ProgressAttempt[]): number {
  if (!attempts.length) return 0;
  const totalDuration = attempts.reduce((sum, entry) => sum + safeNumber(entry.durationSec, 0), 0);
  return Math.round(totalDuration / attempts.length);
}

export function calculatePracticeMinutes(attempts: ProgressAttempt[]): number {
  if (!attempts.length) return 0;
  const totalDuration = attempts.reduce((sum, entry) => sum + safeNumber(entry.durationSec, 0), 0);
  return Math.round(totalDuration / 60);
}

function getConsecutiveDaysFromToday(uniqueDatesDesc: string[]): number {
  if (!uniqueDatesDesc.length) return 0;

  const dateSet = new Set(uniqueDatesDesc);
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (dateSet.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function calculateStreaks(attempts: ProgressAttempt[]): { currentStreak: number; bestStreak: number } {
  if (!attempts.length) return { currentStreak: 0, bestStreak: 0 };

  const uniqueDates = Array.from(new Set(attempts.map((entry) => entry.dateISO.slice(0, 10)).filter(Boolean)));
  const sortedAsc = uniqueDates.slice().sort((a, b) => a.localeCompare(b));
  const sortedDesc = sortedAsc.slice().reverse();

  let bestStreak = 1;
  let currentRun = 1;

  for (let index = 1; index < sortedAsc.length; index += 1) {
    const prev = new Date(sortedAsc[index - 1]);
    const current = new Date(sortedAsc[index]);
    const diffMs = current.getTime() - prev.getTime();
    const isNextDay = diffMs === 24 * 60 * 60 * 1000;

    if (isNextDay) {
      currentRun += 1;
      bestStreak = Math.max(bestStreak, currentRun);
    } else {
      currentRun = 1;
    }
  }

  const currentStreak = getConsecutiveDaysFromToday(sortedDesc);
  return { currentStreak, bestStreak };
}

export function buildTopicMastery(attempts: ProgressAttempt[]): Array<{ topic: string; total: number; successRate: number }> {
  const bucket = new Map<string, { total: number; success: number }>();

  attempts.forEach((entry) => {
    const key = entry.topic || "General SQL";
    const existing = bucket.get(key) ?? { total: 0, success: 0 };
    existing.total += 1;
    if (entry.status === "success") existing.success += 1;
    bucket.set(key, existing);
  });

  return Array.from(bucket.entries())
    .map(([topic, values]) => ({
      topic,
      total: values.total,
      successRate: values.total ? Math.round((values.success / values.total) * 100) : 0,
    }))
    .sort((a, b) => a.successRate - b.successRate);
}

export function getWeakTopics(
  topicMastery: Array<{ topic: string; total: number; successRate: number }>,
  threshold = 70,
): Array<{ topic: string; total: number; successRate: number }> {
  return topicMastery.filter((item) => item.successRate < threshold).slice(0, 3);
}

export function buildProgressStats(data: ProgressData): ProgressStats {
  const totalAttempts = data.attempts.length;
  const successRate = calculateSuccessRate(data.attempts);
  const avgDurationSec = calculateAverageDuration(data.attempts);
  const practiceMinutes = calculatePracticeMinutes(data.attempts);
  const { currentStreak, bestStreak } = calculateStreaks(data.attempts);

  return {
    totalAttempts,
    successRate,
    avgDurationSec,
    practiceMinutes,
    currentStreak,
    bestStreak,
  };
}

function formatDateLabel(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function safeReadStoredAttempts(): ProgressAttempt[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item, index) => {
        const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
        return {
          id: String(row.id ?? `stored-${index + 1}`),
          dateISO: String(row.dateISO ?? new Date().toISOString()),
          mode: parseMode(row.mode),
          topic: String(row.topic ?? "General SQL"),
          status: parseStatus(row.status),
          durationSec: clamp(safeNumber(row.durationSec, 0), 0, 86_400),
          rowsReturned: clamp(safeNumber(row.rowsReturned, 0), 0, 10_000),
        } as ProgressAttempt;
      })
      .sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  } catch {
    return [];
  }
}

function safeWriteStoredAttempts(attempts: ProgressAttempt[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(attempts.slice(0, 300)));
  } catch {
    // ignore storage write failure in private mode/quota limits
  }
}

function buildDailyTrendFromAttempts(attempts: ProgressAttempt[]): DailyTrendPoint[] {
  const points: DailyTrendPoint[] = [];

  for (let daysAgo = 6; daysAgo >= 0; daysAgo -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - daysAgo);
    const dateKey = date.toISOString().slice(0, 10);

    const dayAttempts = attempts.filter((entry) => entry.dateISO.slice(0, 10) === dateKey);
    const daySuccess = dayAttempts.filter((entry) => entry.status === "success").length;
    const accuracy = dayAttempts.length ? Math.round((daySuccess / dayAttempts.length) * 100) : 0;

    points.push({
      dateLabel: formatDateLabel(daysAgo),
      attempts: dayAttempts.length,
      accuracy,
    });
  }

  return points;
}

function buildGoalsFromAttempts(attempts: ProgressAttempt[]): ProgressGoals {
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayAttempts = attempts.filter((entry) => entry.dateISO.slice(0, 10) === todayKey).length;

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);

  const weekAttempts = attempts.filter((entry) => new Date(entry.dateISO) >= weekStart).length;

  return {
    dailyAttemptTarget: 8,
    dailyAttemptsCompleted: todayAttempts,
    weeklyAttemptTarget: 40,
    weeklyAttemptsCompleted: weekAttempts,
  };
}

function buildAchievements(attempts: ProgressAttempt[]): ProgressAchievement[] {
  const totalAttempts = attempts.length;
  const { bestStreak } = calculateStreaks(attempts);
  const accuracy = calculateSuccessRate(attempts);
  const joinAttempts = attempts.filter((entry) => entry.topic.toUpperCase().includes("JOIN")).length;

  return [
    { id: "a1", title: "First Query Run", unlocked: totalAttempts >= 1 },
    { id: "a2", title: "3-Day Streak", unlocked: bestStreak >= 3 },
    { id: "a3", title: "JOIN Explorer", unlocked: joinAttempts >= 5 },
    { id: "a4", title: "Accuracy 80%+", unlocked: accuracy >= 80 && totalAttempts >= 10 },
  ];
}

function detectTopicFromText(sourceText?: string): string {
  const text = (sourceText || "").toLowerCase();
  if (!text.trim()) return "General SQL";
  if (text.includes("join")) return "JOIN";
  if (text.includes("group by")) return "GROUP BY";
  if (text.includes("where")) return "WHERE";
  if (text.includes("subquery") || text.includes("nested")) return "SUBQUERY";
  if (text.includes("insert")) return "INSERT";
  if (text.includes("update")) return "UPDATE";
  if (text.includes("delete")) return "DELETE";
  if (text.includes("select")) return "SELECT";
  return "General SQL";
}

export function inferTopic(sourceText?: string, topicHint?: string): string {
  const topic = (topicHint || "").trim();
  if (topic) return topic.toUpperCase();
  return detectTopicFromText(sourceText);
}

export function recordProgressAttempt(input: RecordProgressAttemptInput): ProgressAttempt {
  const attempts = safeReadStoredAttempts();

  const attempt: ProgressAttempt = {
    id: `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    dateISO: new Date().toISOString(),
    mode: input.mode,
    topic: inferTopic(input.sourceText, input.topicHint),
    status: input.status,
    durationSec: clamp(Math.round(input.durationSec || 0), 0, 86_400),
    rowsReturned: clamp(Math.round(input.rowsReturned || 0), 0, 10_000),
  };

  safeWriteStoredAttempts([attempt, ...attempts]);
  return attempt;
}

export function clearTrackedProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROGRESS_STORAGE_KEY);
}

export function getDemoProgressData(): ProgressData {
  const now = new Date();

  const attempts: ProgressAttempt[] = [
    { id: "1", dateISO: now.toISOString(), mode: "learn", topic: "SELECT", status: "success", durationSec: 28, rowsReturned: 10 },
    { id: "2", dateISO: now.toISOString(), mode: "test", topic: "JOIN", status: "failed", durationSec: 72, rowsReturned: 0 },
    { id: "3", dateISO: now.toISOString(), mode: "test", topic: "GROUP BY", status: "success", durationSec: 50, rowsReturned: 6 },
    { id: "4", dateISO: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), mode: "learn", topic: "WHERE", status: "success", durationSec: 35, rowsReturned: 8 },
    { id: "5", dateISO: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), mode: "test", topic: "SUBQUERY", status: "failed", durationSec: 88, rowsReturned: 0 },
    { id: "6", dateISO: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), mode: "learn", topic: "JOIN", status: "success", durationSec: 42, rowsReturned: 12 },
    { id: "7", dateISO: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), mode: "test", topic: "INSERT", status: "success", durationSec: 46, rowsReturned: 1 },
    { id: "8", dateISO: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(), mode: "learn", topic: "UPDATE", status: "failed", durationSec: 74, rowsReturned: 0 },
    { id: "9", dateISO: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), mode: "test", topic: "DELETE", status: "success", durationSec: 39, rowsReturned: 1 },
    { id: "10", dateISO: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(), mode: "learn", topic: "GROUP BY", status: "success", durationSec: 44, rowsReturned: 4 },
    { id: "11", dateISO: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), mode: "test", topic: "JOIN", status: "failed", durationSec: 91, rowsReturned: 0 },
    { id: "12", dateISO: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(), mode: "learn", topic: "SELECT", status: "success", durationSec: 31, rowsReturned: 14 },
  ];

  return {
    attempts,
    dailyTrend: [
      { dateLabel: formatDateLabel(6), attempts: 4, accuracy: 62 },
      { dateLabel: formatDateLabel(5), attempts: 5, accuracy: 70 },
      { dateLabel: formatDateLabel(4), attempts: 6, accuracy: 66 },
      { dateLabel: formatDateLabel(3), attempts: 4, accuracy: 75 },
      { dateLabel: formatDateLabel(2), attempts: 7, accuracy: 71 },
      { dateLabel: formatDateLabel(1), attempts: 8, accuracy: 78 },
      { dateLabel: formatDateLabel(0), attempts: 5, accuracy: 80 },
    ],
    goals: {
      dailyAttemptTarget: 8,
      dailyAttemptsCompleted: 5,
      weeklyAttemptTarget: 40,
      weeklyAttemptsCompleted: 29,
    },
    achievements: [
      { id: "a1", title: "First Query Run", unlocked: true },
      { id: "a2", title: "3-Day Streak", unlocked: true },
      { id: "a3", title: "JOIN Explorer", unlocked: false },
      { id: "a4", title: "Accuracy 80%+", unlocked: false },
    ],
    lastUpdatedISO: now.toISOString(),
  };
}

export async function getProgressData(): Promise<ProgressData> {
  const trackedAttempts = safeReadStoredAttempts();

  if (!trackedAttempts.length) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(getDemoProgressData()), 250);
    });
  }

  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve({
          attempts: trackedAttempts,
          dailyTrend: buildDailyTrendFromAttempts(trackedAttempts),
          goals: buildGoalsFromAttempts(trackedAttempts),
          achievements: buildAchievements(trackedAttempts),
          lastUpdatedISO: new Date().toISOString(),
        }),
      200,
    );
  });
}

// File use case:
// This module powers Progress analytics and persistence for QueryCraft.
// It stores user attempts safely in localStorage and computes dashboard insights.
