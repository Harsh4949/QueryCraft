import { useMemo } from "react";
import { Link } from "react-router-dom";
import { BookOpen, FlaskConical, ArrowRight, Code2, Clock, CheckCircle2, Database } from "@/components/icons";
import { getAppSettings } from "@/lib/appSettings";

const stats = [
  { label: "Queries Run", value: "42", icon: Code2, color: "text-primary", bg: "bg-primary/10" },
  { label: "Time Learning", value: "3.5h", icon: Clock, color: "text-accent", bg: "bg-accent/10" },
  { label: "Exercises Done", value: "18", icon: CheckCircle2, color: "text-secondary", bg: "bg-secondary/10" },
  { label: "Tables Explored", value: "7", icon: Database, color: "text-primary", bg: "bg-primary/10" },
];

const DashboardHome = () => {
  const defaultMode = useMemo(() => getAppSettings().defaultMode, []);
  const quickStartPath = defaultMode === "test" ? "/test" : "/learn";
  const quickStartTitle = defaultMode === "test" ? "Test Mode" : "Learn Mode";
  const quickStartDescription =
    defaultMode === "test"
      ? "Jump directly into SQL execution and validation."
      : "Convert English to SQL and inspect the output quickly.";

  return (
    <div className="max-w-4xl animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-2">
          Welcome back! 👋
        </h1>
        <p className="text-muted-foreground">
          Ready to level up your SQL skills? Pick up where you left off.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-card border border-border p-4 shadow-card">
            <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
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
      </div>
    </div>
  );
};

export default DashboardHome;

// File use case:
// DashboardHome is the post-login landing page showing high-level stats and quick actions.
// It adapts quick-start behavior based on user settings to reduce friction in daily usage.
