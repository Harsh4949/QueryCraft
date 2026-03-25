import { Terminal, Code2, Database, Lightbulb } from "@/components/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const helperCommands = [
  "qcQuery(\"SELECT * FROM your_table;\")",
  "qcSelectAll(\"your_table\")",
  "qcSchemaInfo()",
];

const DeveloperMode = () => {
  return (
    <div className="max-w-5xl animate-fade-in space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground mb-1">Developer Mode</h1>
        <p className="text-sm text-muted-foreground">Use technical shortcuts, schema inspection helpers, and debugging references.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-border shadow-card">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Terminal className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Console Helpers</p>
            <p className="text-xs text-muted-foreground mt-1">Run DB operations quickly in browser DevTools.</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center mb-2">
              <Database className="w-4 h-4 text-secondary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Schema Insight</p>
            <p className="text-xs text-muted-foreground mt-1">Inspect database, schema, and tables from one place.</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mb-2">
              <Code2 className="w-4 h-4 text-accent" />
            </div>
            <p className="text-sm font-semibold text-foreground">Debug Friendly</p>
            <p className="text-xs text-muted-foreground mt-1">Safe references for query testing and backend endpoint checks.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-heading">Quick Commands</CardTitle>
          <CardDescription>Run these inside browser console (F12 → Console)</CardDescription>
        </CardHeader>
        <CardContent className="pt-2 space-y-2">
          {helperCommands.map((cmd) => (
            <div key={cmd} className="rounded-lg bg-muted/50 border border-border px-3 py-2 font-mono text-xs text-foreground">
              {cmd}
            </div>
          ))}
          <div className="rounded-lg border border-border bg-primary/5 p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-primary mt-0.5" />
            These commands use your login token and current backend API URL from Settings.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeveloperMode;

// File use case:
// DeveloperMode provides technical shortcuts and quick references for debugging QueryCraft.
// It surfaces console helper commands and schema inspection guidance for faster developer workflows.
