import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  FlaskConical,
  ArrowRight,
  Code2,
  Clock,
  CheckCircle2,
  Database,
  Zap,
  AlertCircle,
  Terminal,
} from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { DatabaseContext } from "@/context/DatabaseContext";
import { getAppSettings } from "@/lib/appSettings";
import { buildProgressStats, buildTopicMastery, getProgressData, getWeakTopics, type ProgressData } from "@/lib/progress";

const formatLastSeen = (value?: string) => {
  if (!value) return "No activity yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No activity yet";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatMinutes = (minutes: number) => {
  if (!minutes || minutes <= 0) return "0m";
  if (minutes < 60) return `${minutes}m`;
  return `${(minutes / 60).toFixed(1)}h`;
};

const DashboardHome = () => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const { tables } = useContext(DatabaseContext);

  const defaultMode = useMemo(() => getAppSettings().defaultMode, []);
  const quickStartPath = defaultMode === "test" ? "/test" : "/learn";
  const quickStartTitle = defaultMode === "test" ? "Test Mode" : "Learn Mode";
  const quickStartDescription =
    defaultMode === "test"
      ? "Jump directly into SQL execution and validation."
      : "Convert English to SQL and inspect the output quickly.";

  useEffect(() => {
    let active = true;

    const loadDashboardData = async () => {
      try {
        setLoadingProgress(true);
        const data = await getProgressData();
        if (!active) return;
        setProgressData(data);
      } catch (error) {
        console.error("Failed to load dashboard progress", error);
      } finally {
        if (active) setLoadingProgress(false);
      }
    };

    loadDashboardData();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const progressStats = progressData
      ? buildProgressStats(progressData)
      : {
          totalAttempts: 0,
          successRate: 0,
          avgDurationSec: 0,
          practiceMinutes: 0,
          currentStreak: 0,
          bestStreak: 0,
        };

    return [
      {
        label: "Queries Run",
        value: String(progressStats.totalAttempts),
        icon: Code2,
        color: "text-primary",
        bg: "bg-primary/10",
      },
      {
        label: "Practice Time",
        value: formatMinutes(progressStats.practiceMinutes),
        icon: Clock,
        color: "text-accent",
        bg: "bg-accent/10",
      },
      {
        label: "Accuracy",
        value: `${progressStats.successRate}%`,
        icon: CheckCircle2,
        color: "text-secondary",
        bg: "bg-secondary/10",
      },
      {
        label: "Tables Explored",
        value: String((tables || []).length),
        icon: Database,
        color: "text-primary",
        bg: "bg-primary/10",
      },
    ];
  }, [progressData, tables]);

  const recentAttempts = useMemo(() => progressData?.attempts.slice(0, 4) ?? [], [progressData]);

  const focusTopic = useMemo(() => {
    if (!progressData) return null;
    const mastery = buildTopicMastery(progressData.attempts);
    const weak = getWeakTopics(mastery, 70);
    return weak[0] || null;
  }, [progressData]);

  const lastActivity = useMemo(() => progressData?.attempts[0]?.dateISO, [progressData]);

  return (
    <div className="max-w-6xl animate-fade-in space-y-5">
      <div className="mb-2 rounded-2xl border border-border/70 bg-gradient-to-r from-primary/10 via-background to-secondary/10 dark:from-primary/15 dark:to-secondary/15 p-5 md:p-6 shadow-soft">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-2">
          Welcome back! 👋
        </h1>
        <p className="text-muted-foreground">
          Ready to level up your SQL skills? Pick up where you left off.
        </p>
        <p className="text-xs text-muted-foreground mt-1">Last activity: {formatLastSeen(lastActivity)}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-card border border-border p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-hover">
            <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:shadow-hover">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="font-heading font-bold text-foreground">Focus Recommendation</h3>
          </div>
          {loadingProgress ? (
            <p className="text-sm text-muted-foreground">Loading recommendation...</p>
          ) : focusTopic ? (
            <>
              <p className="text-sm text-foreground">
                Improve <span className="font-semibold">{focusTopic.topic}</span> to boost your weekly score.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Current accuracy: {focusTopic.successRate}% • Attempts: {focusTopic.total}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Great consistency. No weak topic detected right now.</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:shadow-hover">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-secondary" />
            <h3 className="font-heading font-bold text-foreground">Recent Attempts</h3>
          </div>
          {recentAttempts.length ? (
            <div className="space-y-2">
              {recentAttempts.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div>
                    <p className="text-sm text-foreground font-medium">{item.topic}</p>
                    <p className="text-[11px] text-muted-foreground">{item.mode.toUpperCase()}</p>
                  </div>
                  <Badge variant={item.status === "success" ? "secondary" : "destructive"}>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No attempts yet. Start with Learn Mode.</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link to={quickStartPath} className="group">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-200 hover:shadow-hover hover:-translate-y-0.5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-foreground">{quickStartTitle}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{quickStartDescription}</p>
            <span className="inline-flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        <Link to="/test" className="group">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-200 hover:shadow-hover hover:-translate-y-0.5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="font-heading font-bold text-foreground">Test Mode</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Write SQL and validate your skills with instant feedback.</p>
            <span className="inline-flex items-center gap-1 text-secondary text-sm font-medium group-hover:gap-2 transition-all">
              Start Test <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        <Link to="/developer" className="group">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-200 hover:shadow-hover hover:-translate-y-0.5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Terminal className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-heading font-bold text-foreground">Developer Mode</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Run console helpers and inspect schema quickly.</p>
            <span className="inline-flex items-center gap-1 text-accent text-sm font-medium group-hover:gap-2 transition-all">
              Open Dev Tools <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default DashboardHome;

// File use case:
// DashboardHome is the post-login landing page showing high-level stats and quick actions.
// It adapts quick-start behavior based on user settings to reduce friction in daily usage.
// It now uses real progress + schema data for dynamic insights, recommendations, and recent activity.
