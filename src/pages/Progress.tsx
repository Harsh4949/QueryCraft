import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BarChart3, CheckCircle2, Clock, Code2, Tag, Zap } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  buildProgressStats,
  buildTopicMastery,
  getProgressData,
  getWeakTopics,
  type ProgressData,
  type ProgressMode,
} from "@/lib/progress";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const chartConfig = {
  attempts: {
    label: "Attempts",
    color: "hsl(var(--primary))",
  },
  accuracy: {
    label: "Accuracy %",
    color: "hsl(var(--secondary))",
  },
};

const modeVariant: Record<ProgressMode, "secondary" | "outline"> = {
  learn: "secondary",
  test: "outline",
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
};

const getGoalPercent = (completed: number, target: number) => {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((completed / target) * 100));
};

const ProgressPageSkeleton = () => (
  <div className="max-w-6xl animate-fade-in space-y-4">
    <div className="h-7 w-56 rounded bg-muted animate-pulse" />
    <div className="h-4 w-80 rounded bg-muted animate-pulse" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-28 rounded-xl border border-border bg-card animate-pulse" />
      ))}
    </div>
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 h-72 rounded-xl border border-border bg-card animate-pulse" />
      <div className="h-72 rounded-xl border border-border bg-card animate-pulse" />
    </div>
  </div>
);

const Progress = () => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadProgress = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const data = await getProgressData();
        if (!active) return;
        setProgressData(data);
      } catch (error) {
        if (!active) return;
        console.error("Failed to load progress", error);
        setErrorMessage("Unable to load progress right now. Please try again.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadProgress();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    if (!progressData) {
      return {
        totalAttempts: 0,
        successRate: 0,
        avgDurationSec: 0,
        practiceMinutes: 0,
        currentStreak: 0,
        bestStreak: 0,
      };
    }
    return buildProgressStats(progressData);
  }, [progressData]);

  const topicMastery = useMemo(() => {
    if (!progressData) return [];
    return buildTopicMastery(progressData.attempts);
  }, [progressData]);

  const weakTopics = useMemo(() => getWeakTopics(topicMastery), [topicMastery]);
  const recentAttempts = useMemo(() => progressData?.attempts.slice(0, 8) ?? [], [progressData]);

  if (isLoading) {
    return <ProgressPageSkeleton />;
  }

  if (errorMessage) {
    return (
      <div className="max-w-4xl animate-fade-in">
        <h1 className="text-2xl font-heading font-bold text-foreground mb-2">My Progress</h1>
        <p className="text-muted-foreground mb-8">Track your SQL learning journey.</p>
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {errorMessage}
        </div>
      </div>
    );
  }

  if (!progressData || !progressData.attempts.length) {
    return (
      <div className="max-w-4xl animate-fade-in">
        <h1 className="text-2xl font-heading font-bold text-foreground mb-2">My Progress</h1>
        <p className="text-muted-foreground mb-8">Track your SQL learning journey.</p>
        <div className="rounded-xl border border-border bg-card p-10 shadow-card text-center">
          <p className="text-muted-foreground">No progress data yet. Start from Learn or Test Mode to generate insights.</p>
        </div>
      </div>
    );
  }

  const dailyGoalPercent = getGoalPercent(progressData.goals.dailyAttemptsCompleted, progressData.goals.dailyAttemptTarget);
  const weeklyGoalPercent = getGoalPercent(progressData.goals.weeklyAttemptsCompleted, progressData.goals.weeklyAttemptTarget);

  return (
    <div className="max-w-6xl animate-fade-in space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground mb-1">My Progress</h1>
        <p className="text-sm text-muted-foreground">
          Track your SQL learning journey and identify where to improve next.
        </p>
        <p className="text-xs text-muted-foreground mt-1">Last updated: {formatDate(progressData.lastUpdatedISO)}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border shadow-card">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Code2 className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{stats.totalAttempts}</p>
            <p className="text-xs text-muted-foreground">Total Attempts</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-4 h-4 text-secondary" />
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{stats.successRate}%</p>
            <p className="text-xs text-muted-foreground">Accuracy</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
              <Clock className="w-4 h-4 text-accent" />
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{formatDuration(stats.avgDurationSec)}</p>
            <p className="text-xs text-muted-foreground">Avg Query Time</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{stats.currentStreak}d</p>
            <p className="text-xs text-muted-foreground">Current Streak</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading">7-Day Trend</CardTitle>
            <CardDescription>Daily attempts and accuracy</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {progressData.dailyTrend.length ? (
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <LineChart data={progressData.dailyTrend}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="dateLabel" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="attempts"
                    stroke="var(--color-attempts)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="accuracy"
                    stroke="var(--color-accuracy)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Trend data not available yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading">Goals & Streaks</CardTitle>
            <CardDescription>Stay consistent every day</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div>
              <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                <span>Daily Goal</span>
                <span>
                  {progressData.goals.dailyAttemptsCompleted}/{progressData.goals.dailyAttemptTarget}
                </span>
              </div>
              <ProgressBar value={dailyGoalPercent} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                <span>Weekly Goal</span>
                <span>
                  {progressData.goals.weeklyAttemptsCompleted}/{progressData.goals.weeklyAttemptTarget}
                </span>
              </div>
              <ProgressBar value={weeklyGoalPercent} className="h-2" />
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
              <p className="text-sm text-foreground font-medium">Best Streak: {stats.bestStreak} days</p>
              <p className="text-xs text-muted-foreground">Practice Time: {stats.practiceMinutes} minutes total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-border shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading">Topic Mastery</CardTitle>
            <CardDescription>Performance by SQL topic</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {topicMastery.length ? (
              topicMastery.map((topic) => (
                <div key={topic.topic}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm text-foreground font-medium">{topic.topic}</p>
                    <p className="text-xs text-muted-foreground">{topic.successRate}%</p>
                  </div>
                  <ProgressBar value={topic.successRate} className="h-2" />
                  <p className="text-[11px] text-muted-foreground mt-1">{topic.total} attempt(s)</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No topic data available.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading">Weak Areas</CardTitle>
            <CardDescription>Recommended next practice topics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {weakTopics.length ? (
              weakTopics.map((topic) => (
                <div key={topic.topic} className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{topic.topic}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Accuracy: {topic.successRate}% • Attempts: {topic.total}
                      </p>
                    </div>
                    <Badge variant="outline">Practice</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Try 5 focused questions in this topic this week.</p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-sm text-foreground font-medium">Great consistency</p>
                <p className="text-xs text-muted-foreground mt-1">No weak topics detected right now.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading">Recent Activity</CardTitle>
            <CardDescription>Your latest SQL attempts</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2">
              {recentAttempts.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={modeVariant[entry.mode]}>{entry.mode.toUpperCase()}</Badge>
                      <span className="text-sm text-foreground font-medium">{entry.topic}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(entry.dateISO)} • {formatDuration(entry.durationSec)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={entry.status === "success" ? "secondary" : "destructive"}>
                      {entry.status === "success" ? "Success" : "Failed"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Rows: {entry.rowsReturned}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading">Achievements</CardTitle>
            <CardDescription>Milestones unlocked</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            {progressData.achievements.map((achievement) => (
              <div key={achievement.id} className="rounded-lg border border-border bg-muted/40 p-3 flex items-start gap-2">
                {achievement.unlocked ? (
                  <CheckCircle2 className="w-4 h-4 text-secondary mt-0.5" />
                ) : (
                  <Tag className="w-4 h-4 text-muted-foreground mt-0.5" />
                )}
                <div>
                  <p className="text-sm text-foreground font-medium">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">{achievement.unlocked ? "Unlocked" : "Locked"}</p>
                </div>
              </div>
            ))}
            <div className="rounded-lg border border-border bg-primary/5 p-3">
              <p className="text-sm text-foreground font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Next milestone target
              </p>
              <p className="text-xs text-muted-foreground mt-1">Reach 80%+ weekly accuracy to unlock the next badge.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Progress;
