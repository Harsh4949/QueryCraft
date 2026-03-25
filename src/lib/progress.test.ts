import { describe, expect, it } from "vitest";
import {
  buildProgressStats,
  buildTopicMastery,
  calculateAverageDuration,
  calculatePracticeMinutes,
  calculateSuccessRate,
  calculateStreaks,
  getWeakTopics,
  mapBackendProgressData,
  type ProgressAttempt,
} from "@/lib/progress";

const now = new Date();
const day = 24 * 60 * 60 * 1000;

const attempts: ProgressAttempt[] = [
  {
    id: "1",
    dateISO: now.toISOString(),
    mode: "learn",
    topic: "SELECT",
    status: "success",
    durationSec: 20,
    rowsReturned: 5,
  },
  {
    id: "2",
    dateISO: new Date(now.getTime() - day).toISOString(),
    mode: "test",
    topic: "JOIN",
    status: "failed",
    durationSec: 40,
    rowsReturned: 0,
  },
  {
    id: "3",
    dateISO: new Date(now.getTime() - 2 * day).toISOString(),
    mode: "test",
    topic: "SELECT",
    status: "success",
    durationSec: 60,
    rowsReturned: 2,
  },
];

describe("progress helpers", () => {
  it("calculates success rate safely", () => {
    expect(calculateSuccessRate(attempts)).toBe(67);
    expect(calculateSuccessRate([])).toBe(0);
  });

  it("calculates average duration and total practice minutes", () => {
    expect(calculateAverageDuration(attempts)).toBe(40);
    expect(calculatePracticeMinutes(attempts)).toBe(2);
  });

  it("calculates current and best streak", () => {
    const streaks = calculateStreaks(attempts);
    expect(streaks.bestStreak).toBeGreaterThanOrEqual(3);
    expect(streaks.currentStreak).toBeGreaterThanOrEqual(1);
  });

  it("builds topic mastery and weak topics", () => {
    const mastery = buildTopicMastery(attempts);
    expect(mastery.length).toBe(2);

    const weak = getWeakTopics(mastery, 70);
    expect(weak.some((item) => item.topic === "JOIN")).toBe(true);
  });

  it("maps unsafe backend payload into safe defaults", () => {
    const mapped = mapBackendProgressData({
      attempts: [{ id: 1, topic: null, durationSec: "bad" }],
      goals: { dailyAttemptTarget: 0, weeklyAttemptTarget: -5 },
      achievements: [{ title: "Starter", unlocked: 1 }],
    });

    expect(mapped.attempts[0].topic).toBe("General SQL");
    expect(mapped.attempts[0].durationSec).toBe(0);
    expect(mapped.goals.dailyAttemptTarget).toBe(1);
    expect(mapped.goals.weeklyAttemptTarget).toBe(1);
    expect(mapped.achievements[0].unlocked).toBe(true);
  });

  it("builds aggregate progress stats", () => {
    const stats = buildProgressStats({
      attempts,
      dailyTrend: [],
      goals: {
        dailyAttemptTarget: 5,
        dailyAttemptsCompleted: 3,
        weeklyAttemptTarget: 20,
        weeklyAttemptsCompleted: 11,
      },
      achievements: [],
      lastUpdatedISO: now.toISOString(),
    });

    expect(stats.totalAttempts).toBe(3);
    expect(stats.successRate).toBe(67);
    expect(stats.avgDurationSec).toBe(40);
  });
});
