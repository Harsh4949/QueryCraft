import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CheckCircle2, Code2, Database, Lightbulb, Table2, Terminal } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

type Blueprint = {
  id: string;
  name: string;
  description: string;
  tables: string[];
  schemaSql: string[];
  coreQueries: string[];
};

type ProjectConnection = {
  id: string;
  name: string;
  blueprintId: string;
  apiLink: string;
  notes: string;
};

const connectionsStorageKey = "querycraft_developer_connections_v1";

const helperCommands = [
  "qcQuery(\"SELECT * FROM your_table;\")",
  "qcSelectAll(\"your_table\")",
  "qcSchemaInfo()",
];

const blueprints: Blueprint[] = [
  {
    id: "ecommerce",
    name: "E-commerce App",
    description: "Ideal for shopping platforms with products, cart, and order flows.",
    tables: ["users", "products", "categories", "orders", "order_items", "payments"],
    schemaSql: [
      "CREATE TABLE users (id SERIAL PRIMARY KEY, full_name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, created_at TIMESTAMP DEFAULT NOW());",
      "CREATE TABLE products (id SERIAL PRIMARY KEY, category_id INT REFERENCES categories(id), title TEXT NOT NULL, price NUMERIC(10,2) NOT NULL, stock INT DEFAULT 0);",
      "CREATE TABLE orders (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), status TEXT NOT NULL, total NUMERIC(10,2) NOT NULL, created_at TIMESTAMP DEFAULT NOW());",
      "CREATE TABLE order_items (id SERIAL PRIMARY KEY, order_id INT REFERENCES orders(id), product_id INT REFERENCES products(id), quantity INT NOT NULL, item_price NUMERIC(10,2) NOT NULL);",
    ],
    coreQueries: [
      "SELECT p.title, SUM(oi.quantity) AS sold_units FROM order_items oi JOIN products p ON p.id = oi.product_id GROUP BY p.title ORDER BY sold_units DESC LIMIT 10;",
      "SELECT DATE(created_at) AS day, COUNT(*) AS orders_count FROM orders GROUP BY DATE(created_at) ORDER BY day DESC;",
    ],
  },
  {
    id: "learning",
    name: "Learning Platform",
    description: "Great for LMS, coding bootcamp, or course-selling projects.",
    tables: ["students", "instructors", "courses", "lessons", "enrollments", "progress"],
    schemaSql: [
      "CREATE TABLE students (id SERIAL PRIMARY KEY, full_name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, joined_at TIMESTAMP DEFAULT NOW());",
      "CREATE TABLE courses (id SERIAL PRIMARY KEY, title TEXT NOT NULL, level TEXT, instructor_id INT REFERENCES instructors(id));",
      "CREATE TABLE enrollments (id SERIAL PRIMARY KEY, student_id INT REFERENCES students(id), course_id INT REFERENCES courses(id), enrolled_at TIMESTAMP DEFAULT NOW());",
      "CREATE TABLE progress (id SERIAL PRIMARY KEY, enrollment_id INT REFERENCES enrollments(id), lesson_id INT REFERENCES lessons(id), completed BOOLEAN DEFAULT FALSE, updated_at TIMESTAMP DEFAULT NOW());",
    ],
    coreQueries: [
      "SELECT c.title, COUNT(e.id) AS total_enrollments FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id GROUP BY c.title ORDER BY total_enrollments DESC;",
      "SELECT s.full_name, ROUND(100.0 * SUM(CASE WHEN p.completed THEN 1 ELSE 0 END) / NULLIF(COUNT(p.id), 0), 2) AS completion_percent FROM students s JOIN enrollments e ON e.student_id = s.id JOIN progress p ON p.enrollment_id = e.id GROUP BY s.full_name;",
    ],
  },
  {
    id: "social",
    name: "Social/Community App",
    description: "Useful for social projects with user profiles, posts, comments, and likes.",
    tables: ["users", "profiles", "posts", "comments", "likes", "follows"],
    schemaSql: [
      "CREATE TABLE posts (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), content TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW());",
      "CREATE TABLE comments (id SERIAL PRIMARY KEY, post_id INT REFERENCES posts(id), user_id INT REFERENCES users(id), comment_text TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW());",
      "CREATE TABLE likes (id SERIAL PRIMARY KEY, post_id INT REFERENCES posts(id), user_id INT REFERENCES users(id), created_at TIMESTAMP DEFAULT NOW(), UNIQUE(post_id, user_id));",
    ],
    coreQueries: [
      "SELECT p.id, p.content, COUNT(l.id) AS likes_count FROM posts p LEFT JOIN likes l ON l.post_id = p.id GROUP BY p.id, p.content ORDER BY likes_count DESC;",
      "SELECT u.full_name, COUNT(f.followed_user_id) AS following_count FROM users u LEFT JOIN follows f ON f.user_id = u.id GROUP BY u.full_name ORDER BY following_count DESC;",
    ],
  },
];

const queryPlaybook = [
  {
    category: "Project Setup Queries",
    queries: [
      "CREATE DATABASE my_project_db;",
      "CREATE SCHEMA app_core;",
      "CREATE INDEX idx_orders_user_id ON orders(user_id);",
    ],
  },
  {
    category: "Daily Development Queries",
    queries: [
      "INSERT INTO users (full_name, email) VALUES ('Harsh User', 'harsh@example.com');",
      "UPDATE products SET stock = stock - 1 WHERE id = 4;",
      "DELETE FROM comments WHERE id = 10;",
    ],
  },
  {
    category: "Validation & Analytics",
    queries: [
      "SELECT COUNT(*) FROM users;",
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';",
      "EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 12;",
    ],
  },
];

function safeReadConnections(): ProjectConnection[] {
  try {
    const raw = localStorage.getItem(connectionsStorageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const record = item as Record<string, unknown>;
        return {
          id: String(record.id || ""),
          name: String(record.name || ""),
          blueprintId: String(record.blueprintId || ""),
          apiLink: String(record.apiLink || ""),
          notes: String(record.notes || ""),
        };
      })
      .filter((item): item is ProjectConnection => Boolean(item?.id && item?.name && item?.apiLink));
  } catch {
    return [];
  }
}

function safeWriteConnections(connections: ProjectConnection[]) {
  try {
    localStorage.setItem(connectionsStorageKey, JSON.stringify(connections));
  } catch {
    // No-op when local storage write is blocked.
  }
}

const DeveloperMode = () => {
  const [activeBlueprintId, setActiveBlueprintId] = useState<string>(blueprints[0].id);
  const [projectName, setProjectName] = useState("");
  const [apiLink, setApiLink] = useState("");
  const [notes, setNotes] = useState("");
  const [connections, setConnections] = useState<ProjectConnection[]>(() => safeReadConnections());

  const activeBlueprint = useMemo(
    () => blueprints.find((item) => item.id === activeBlueprintId) || blueprints[0],
    [activeBlueprintId],
  );

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: "Copied", description: `${label} copied to clipboard.` });
    } catch {
      toast({ title: "Copy failed", description: "Please copy manually from the text box." });
    }
  };

  const saveConnection = () => {
    const normalizedName = projectName.trim();
    const normalizedLink = apiLink.trim();

    if (!normalizedName) {
      toast({ title: "Project name required", description: "Enter your project name before saving." });
      return;
    }

    if (!normalizedLink.startsWith("http://") && !normalizedLink.startsWith("https://")) {
      toast({ title: "Invalid link", description: "API link should start with http:// or https://" });
      return;
    }

    const nextRecord: ProjectConnection = {
      id: `${Date.now()}`,
      name: normalizedName,
      blueprintId: activeBlueprintId,
      apiLink: normalizedLink,
      notes: notes.trim(),
    };

    const nextConnections = [nextRecord, ...connections];
    setConnections(nextConnections);
    safeWriteConnections(nextConnections);

    setProjectName("");
    setApiLink("");
    setNotes("");
    toast({ title: "Saved", description: "Project API link saved in Developer Mode." });
  };

  const removeConnection = (id: string) => {
    const nextConnections = connections.filter((item) => item.id !== id);
    setConnections(nextConnections);
    safeWriteConnections(nextConnections);
    toast({ title: "Removed", description: "Project link removed." });
  };

  return (
    <div className="max-w-6xl animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-1">Developer Mode</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Build student projects faster with schema blueprints, project database setup guidance, and production-ready SQL query playbooks.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-border shadow-card">
          <CardContent className="p-4">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Table2 className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">1) Schema Design Help</p>
            <p className="text-xs text-muted-foreground mt-1">Choose a project blueprint and use starter table structure + schema SQL.</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardContent className="p-4">
            <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center mb-2">
              <Database className="w-4 h-4 text-secondary" />
            </div>
            <p className="text-sm font-semibold text-foreground">2) Project DB Link Setup</p>
            <p className="text-xs text-muted-foreground mt-1">Save your project API link and use it via Settings for execution on your own platform.</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardContent className="p-4">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center mb-2">
              <Code2 className="w-4 h-4 text-accent" />
            </div>
            <p className="text-sm font-semibold text-foreground">3) Required Query Packs</p>
            <p className="text-xs text-muted-foreground mt-1">Get essential SQL queries for setup, CRUD development, and analytics validation.</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="schema" className="w-full">
        <TabsList className="grid w-full md:w-[560px] grid-cols-3">
          <TabsTrigger value="schema">Schema Designer</TabsTrigger>
          <TabsTrigger value="setup">Project DB Setup</TabsTrigger>
          <TabsTrigger value="queries">Query Playbook</TabsTrigger>
        </TabsList>

        <TabsContent value="schema" className="space-y-4">
          <Card className="border-border shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-heading">Select Project Blueprint</CardTitle>
              <CardDescription>Pick a platform type and get schema starter for your college project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {blueprints.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveBlueprintId(item.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      activeBlueprintId === item.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="font-semibold text-foreground mb-1">{activeBlueprint.name}</p>
                <p className="text-xs text-muted-foreground mb-3">{activeBlueprint.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {activeBlueprint.tables.map((table) => (
                    <Badge key={table} variant="secondary">{table}</Badge>
                  ))}
                </div>

                <div className="space-y-2">
                  {activeBlueprint.schemaSql.map((sql, index) => (
                    <div key={`${activeBlueprint.id}-schema-${index}`} className="rounded-lg border border-border bg-background p-3">
                      <pre className="text-xs overflow-auto text-foreground font-mono whitespace-pre-wrap">{sql}</pre>
                      <div className="flex justify-end mt-2">
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(sql, "Schema SQL")}>
                          Copy
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup" className="space-y-4">
          <Card className="border-border shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-heading">Save Project API Link</CardTitle>
              <CardDescription>
                Add your project backend/API URL. Then set the same URL in Settings to run queries from Learn/Test mode.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Project Name (e.g., Shop Manager)"
              />
              <Input
                value={apiLink}
                onChange={(event) => setApiLink(event.target.value)}
                placeholder="Project API Link (e.g., https://my-api.onrender.com)"
              />
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional notes (platform, DB type, auth details)"
                className="min-h-[90px]"
              />

              <div className="flex flex-wrap gap-2">
                <Button variant="hero" onClick={saveConnection}>Save Link</Button>
                <Button variant="outline" asChild>
                  <Link to="/settings">Open Settings</Link>
                </Button>
              </div>

              <div className="rounded-lg border border-border bg-primary/5 p-3 text-xs text-muted-foreground flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-primary mt-0.5" />
                QueryCraft executes SQL through your configured backend API URL. For external projects, update that URL in Settings first.
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-heading">Saved Project Links</CardTitle>
              <CardDescription>Quickly reuse your API endpoints across multiple student projects.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {connections.length ? (
                connections.map((item) => {
                  const blueprintName = blueprints.find((blueprint) => blueprint.id === item.blueprintId)?.name || "Custom Project";

                  return (
                    <div key={item.id} className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{blueprintName}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => copyToClipboard(item.apiLink, "API link")}>Copy Link</Button>
                          <Button variant="ghost" size="sm" onClick={() => removeConnection(item.id)}>Remove</Button>
                        </div>
                      </div>
                      <a href={item.apiLink} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline break-all mt-2 inline-block">
                        {item.apiLink}
                      </a>
                      {item.notes ? <p className="text-xs text-muted-foreground mt-2">{item.notes}</p> : null}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No saved links yet. Add one above to manage project environments.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queries" className="space-y-4">
          <Card className="border-border shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-heading">Essential SQL Query Packs</CardTitle>
              <CardDescription>Use these as starter queries for building and validating your project database layer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {queryPlaybook.map((pack) => (
                <div key={pack.category} className="rounded-xl border border-border p-4 bg-muted/20">
                  <h3 className="font-semibold text-sm text-foreground mb-2">{pack.category}</h3>
                  <div className="space-y-2">
                    {pack.queries.map((query, index) => (
                      <div key={`${pack.category}-${index}`} className="rounded-lg border border-border bg-background p-3">
                        <pre className="text-xs overflow-auto text-foreground font-mono whitespace-pre-wrap">{query}</pre>
                        <div className="flex justify-end mt-2">
                          <Button variant="outline" size="sm" onClick={() => copyToClipboard(query, "Query")}>Copy</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-heading">Quick Console Commands</CardTitle>
              <CardDescription>Run these inside browser console (F12 → Console)</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 space-y-2">
              {helperCommands.map((cmd) => (
                <div key={cmd} className="rounded-lg bg-muted/50 border border-border px-3 py-2 font-mono text-xs text-foreground">
                  {cmd}
                </div>
              ))}

              <div className="rounded-lg border border-border bg-primary/5 p-3 text-xs text-muted-foreground flex items-start gap-2">
                <Terminal className="w-4 h-4 text-primary mt-0.5" />
                These commands use your login token and currently selected backend API URL from Settings.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-border shadow-card bg-muted/30">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="font-semibold text-foreground">Recommended next step for students</p>
            <p className="text-sm text-muted-foreground">After schema setup, jump to Learn Mode for prompt-based SQL and Test Mode for direct query validation.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/learn" className="inline-flex items-center gap-1">
                Learn Mode
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="accent" asChild>
              <Link to="/test" className="inline-flex items-center gap-1">
                Test Mode
                <BookOpen className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border bg-secondary/10 p-3 text-xs text-muted-foreground flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-secondary mt-0.5" />
        If you want, next enhancement can be AI-generated schema from your project idea text (e.g., “build food delivery app”) directly in this page.
      </div>
    </div>
  );
};

export default DeveloperMode;

// File use case:
// DeveloperMode acts as a full student project SQL assistant.
// It provides schema blueprints, project API link management, and essential query packs for development workflows.
// It also bridges students to Learn/Test modes so they can execute and validate SQL during project building.
