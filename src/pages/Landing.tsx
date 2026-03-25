import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  Code2,
  Database,
  FlaskConical,
  Zap,
} from "@/components/icons";

const features = [
  {
    icon: BookOpen,
    title: "English to SQL",
    description: "Type natural English and watch it transform into clean SQL queries instantly.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: FlaskConical,
    title: "Test & Practice",
    description: "Hone your skills with interactive SQL practice, from SELECT to advanced JOINs.",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Run queries and view formatted output with quick feedback and error clarity.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Measure your consistency and growth with real-time learning insights.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

const quickStats = [
  { label: "Learning Modes", value: "2", icon: BookOpen },
  { label: "Built-in Tutorials", value: "10+", icon: Code2 },
  { label: "Practice Tracking", value: "Live", icon: BarChart3 },
  { label: "Start Time", value: "< 1 min", icon: Clock },
];

const steps = [
  {
    title: "Ask in plain English",
    description: "Type what data you need in normal language and start from intent, not syntax.",
  },
  {
    title: "Understand generated SQL",
    description: "Read the generated SQL and quickly learn patterns you can reuse in real tasks.",
  },
  {
    title: "Run, test, and improve",
    description: "Execute queries, validate output, and improve with guided practice in Test Mode.",
  },
];

const highlights = [
  "Natural language to SQL conversion",
  "Practice-focused Learn and Test modes",
  "Tutorials from beginner to advanced",
  "Progress analytics for consistent growth",
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative gradient-hero pt-32 pb-20 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-primary/10 text-primary text-sm font-medium animate-fade-in">
              <Zap className="w-4 h-4" />
              Smart SQL Learning Workspace
            </div>

            <h1 className="text-4xl md:text-6xl font-heading font-extrabold text-foreground leading-tight mb-6 animate-fade-in">
              Build real SQL skills with a
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"> modern practice-first platform</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto animate-fade-in">
              QueryCraft helps you move from beginner confusion to confident query writing with English-to-SQL guidance,
              hands-on practice, and progress insights in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
              <Button variant="hero" size="xl" asChild>
                <Link to="/register" className="flex items-center gap-2">
                  Start Free Learning
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="xl" asChild>
                <Link to="/tutorials">Explore Tutorials</Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-12 animate-fade-in">
              {quickStats.map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-card/70 backdrop-blur-sm p-4 text-left shadow-card">
                  <div className="inline-flex w-8 h-8 rounded-lg bg-primary/10 items-center justify-center mb-2">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xl font-heading font-bold text-foreground">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute top-20 left-10 w-20 h-20 rounded-2xl bg-primary/5 animate-float" />
          <div className="absolute top-40 right-16 w-14 h-14 rounded-xl bg-accent/10 animate-float" />
          <div className="absolute bottom-10 left-1/4 w-10 h-10 rounded-lg bg-secondary/10 animate-float" />
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="container mx-auto px-4 py-5">
          <div className="grid md:grid-cols-4 gap-3">
            {highlights.map((item) => (
              <div key={item} className="inline-flex items-center gap-2 text-sm text-muted-foreground rounded-lg px-3 py-2 bg-background/80 border border-border">
                <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">How learning works in QueryCraft</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A guided workflow designed for students: understand, practice, and improve continuously.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-border bg-card p-7 shadow-card relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-primary/5" />
              <div className="w-9 h-9 rounded-full gradient-primary text-primary-foreground font-heading font-bold text-sm flex items-center justify-center mb-4">
                {index + 1}
              </div>
              <h3 className="text-lg font-heading font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">Two focused modes to master SQL</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Choose your path — learn conceptually or practice like an interview.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Link to="/learn" className="group">
              <div className="relative rounded-2xl border border-border bg-card p-8 shadow-card transition-all duration-300 hover:shadow-hover hover:-translate-y-1 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 gradient-primary" />
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <BookOpen className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-heading font-bold text-foreground mb-2">Learn Mode</h3>
                <p className="text-muted-foreground mb-4">
                  Convert English prompts into SQL and understand query structure with real outputs.
                </p>
                <span className="inline-flex items-center gap-1 text-primary font-medium text-sm group-hover:gap-2 transition-all">
                  Start Learning <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>

            <Link to="/test" className="group">
              <div className="relative rounded-2xl border border-border bg-card p-8 shadow-card transition-all duration-300 hover:shadow-hover hover:-translate-y-1 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 gradient-accent" />
                <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-5">
                  <FlaskConical className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="text-xl font-heading font-bold text-foreground mb-2">Test Mode</h3>
                <p className="text-muted-foreground mb-4">
                  Write SQL directly, run on your schema, and sharpen confidence for real projects.
                </p>
                <span className="inline-flex items-center gap-1 text-secondary font-medium text-sm group-hover:gap-2 transition-all">
                  Practice Now <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">Everything you need in one workspace</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Built to support daily SQL learning, revision, and confidence building.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl bg-card border border-border p-7 shadow-card animate-fade-in">
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-heading font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto rounded-3xl border border-border bg-card shadow-hover p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 gradient-primary" />
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Ready to become confident in SQL?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Start with tutorials, practice in real modes, and track your growth every day.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button variant="hero" size="lg" asChild>
                <Link to="/register" className="inline-flex items-center gap-2">
                  Create Your Account
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-10 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center">
              <Database className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-foreground">
              Query<span className="text-primary">Craft</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 QueryCraft. Learn SQL with confidence.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

// File use case:
// This page delivers a rich marketing and onboarding experience for QueryCraft.
// It highlights value, learning workflow, modes, and calls-to-action to improve first-time user conversion.
// The layout is designed to feel modern while using existing design tokens and components.
