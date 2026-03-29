import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Code2, AlertCircle, Table2 } from "@/components/icons";
import { useLocation, useNavigate} from "react-router-dom";
import { useEffect } from "react";
import { useContext } from "react";
import { DatabaseContext } from "@/context/DatabaseContext";
import { recordProgressAttempt } from "@/lib/progress";
import { getApiBaseUrl, getAppSettings } from "@/lib/appSettings";
import { buildWorkspaceHeaders, getActiveWorkspaceId, WORKSPACE_CHANGED_EVENT } from "@/lib/workspace";



const snippets = [
  { label: "SELECT", sql: "SELECT * FROM " },
  { label: "INSERT", sql: "INSERT INTO table_name (col1, col2) VALUES (val1, val2);" },
  { label: "UPDATE", sql: "UPDATE table_name SET col1 = val1 WHERE condition;" },
  { label: "DELETE", sql: "DELETE FROM table_name WHERE condition;" },
];

// const sampleResults = [
//   { id: 1, name: "Alice", department: "Engineering", salary: 95000 },
//   { id: 2, name: "Bob", department: "Design", salary: 87000 },
//   { id: 3, name: "Charlie", department: "Engineering", salary: 102000 },
// ];

const TestMode = () => {
  const [sqlInput, setSqlInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [runMessage, setRunMessage] = useState("");
  const [runError, setRunError] = useState(false);
  const [activeWorkspaceLabel, setActiveWorkspaceLabel] = useState("Personal workspace");
  const [activeWorkspaceRole, setActiveWorkspaceRole] = useState<string | null>(null);
  const tableSettings = getAppSettings();
  
  const { refreshTables } = useContext(DatabaseContext);
 const location = useLocation();
 const navigate = useNavigate();

 const loadActiveWorkspaceInfo = async () => {
  const workspaceId = getActiveWorkspaceId();
  if (!workspaceId) {
    setActiveWorkspaceLabel("Personal workspace");
    setActiveWorkspaceRole(null);
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    setActiveWorkspaceLabel(`Workspace #${workspaceId}`);
    setActiveWorkspaceRole(null);
    return;
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/workspaces`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      setActiveWorkspaceLabel(`Workspace #${workspaceId}`);
      setActiveWorkspaceRole(null);
      return;
    }

    const payload = await response.json();
    const rows = Array.isArray(payload) ? payload : [];
    const activeWorkspace = rows.find((workspace) => workspace.id === workspaceId);

    if (activeWorkspace) {
      setActiveWorkspaceLabel(activeWorkspace.name || `Workspace #${workspaceId}`);
      setActiveWorkspaceRole(activeWorkspace.role || null);
    } else {
      setActiveWorkspaceLabel(`Workspace #${workspaceId}`);
      setActiveWorkspaceRole(null);
    }
  } catch {
    setActiveWorkspaceLabel(`Workspace #${workspaceId}`);
    setActiveWorkspaceRole(null);
  }
 };

 useEffect(() => {
  loadActiveWorkspaceInfo();

  const handleWorkspaceChanged = () => {
    loadActiveWorkspaceInfo();
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === "querycraft_active_workspace_id_v1") {
      loadActiveWorkspaceInfo();
    }
  };

  window.addEventListener(WORKSPACE_CHANGED_EVENT, handleWorkspaceChanged);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(WORKSPACE_CHANGED_EVENT, handleWorkspaceChanged);
    window.removeEventListener("storage", handleStorage);
  };
 }, []);

 const isDangerousSql = (sql: string) => {
  const normalized = sql.trim().toLowerCase();
  return /\b(delete|drop|truncate|alter)\b/.test(normalized);
 };
  
  useEffect(() => {
  if (location.state?.autoSQL) {
    const autoSQL = location.state.autoSQL;

    const runAutoQuery = async () => {
      const startedAt = Date.now();
      const baseUrl = getApiBaseUrl();
      const settings = getAppSettings();
      try {
        setSqlInput(autoSQL);
        setIsRunning(true);
        setRunMessage("");
        setRunError(false);

        const token = localStorage.getItem("token");
        if (!token) {
          alert("You must be logged in to run this query.");
          setIsRunning(false);
          return;
        }

        if (settings.confirmDangerousQueries && isDangerousSql(autoSQL)) {
          const approved = window.confirm("This query looks destructive. Do you want to continue?");
          if (!approved) {
            setIsRunning(false);
            setRunError(true);
            setRunMessage("Execution canceled by user.");
            return;
          }
        }

        const response = await fetch(`${baseUrl}/execute`, {
          method: "POST",
          headers: buildWorkspaceHeaders(token, true),
          body: JSON.stringify({ query: autoSQL }),
        });
        if(response.status === 401) {
          navigate("/login");
        return;
      }
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to execute SQL query");
        }
        setResults((data.data || []).slice(0, settings.resultRowLimit));
        const executionDurationSec = Number.isFinite(Number(data.executionMs))
          ? Math.max(1, Math.round(Number(data.executionMs) / 1000))
          : Math.round((Date.now() - startedAt) / 1000);
        const rowsReturned = Number.isFinite(Number(data.rowCount))
          ? Number(data.rowCount)
          : (data.data || []).length;
        setHasRun(true);
        setRunMessage(
          data.slowQuery
            ? `Slow query warning: took ~${executionDurationSec}s. Logged in Performance Insights.`
            : "Attempt tracked in Progress dashboard.",
        );

        recordProgressAttempt({
          mode: "test",
          status: "success",
          durationSec: executionDurationSec,
          rowsReturned,
          sourceText: autoSQL,
        });
      } catch (error) {
        console.error(error);
        setHasRun(true);
        setResults([]);
        setRunError(true);
        setRunMessage("Execution failed. Please check SQL syntax and try again.");

        recordProgressAttempt({
          mode: "test",
          status: "failed",
          durationSec: Math.round((Date.now() - startedAt) / 1000),
          rowsReturned: 0,
          sourceText: autoSQL,
        });
      } finally {
        setIsRunning(false);
      }
    };

    runAutoQuery();
  }
}, [location.state]);


  // const handleRun = () => {
  //   if (!sqlInput.trim()) return;


  //   setIsRunning(true);
  //   setTimeout(() => {
  //     setHasRun(true);
  //     setIsRunning(false);
  //   }, 600);
  // };
  const handleRun = async () => {
  if (!sqlInput.trim()) return;
  const startedAt = Date.now();
  const baseUrl = getApiBaseUrl();
  const settings = getAppSettings();
  const token = localStorage.getItem("token");
  if (!token) {
    alert("You must be logged in to run this query.");
    return;
  }

  if (settings.confirmDangerousQueries && isDangerousSql(sqlInput)) {
    const approved = window.confirm("This query looks destructive. Do you want to continue?");
    if (!approved) {
      setRunError(true);
      setRunMessage("Execution canceled by user.");
      return;
    }
  }

  try {
    setIsRunning(true);
    setRunMessage("");
    setRunError(false);

    const response = await fetch(`${baseUrl}/execute`, {
      method: "POST",
      headers: buildWorkspaceHeaders(token, true),
      body: JSON.stringify({ query: sqlInput }),
    });
    if(response.status === 401) {
      navigate("/login");
      return;
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to execute SQL query");
    }

    setResults((data.data || []).slice(0, settings.resultRowLimit));
    const executionDurationSec = Number.isFinite(Number(data.executionMs))
      ? Math.max(1, Math.round(Number(data.executionMs) / 1000))
      : Math.round((Date.now() - startedAt) / 1000);
    const rowsReturned = Number.isFinite(Number(data.rowCount))
      ? Number(data.rowCount)
      : (data.data || []).length;
    setHasRun(true);
    setRunMessage(
      data.slowQuery
        ? `Slow query warning: took ~${executionDurationSec}s. Logged in Performance Insights.`
        : "Attempt tracked in Progress dashboard.",
    );
    console.log("Query results:", data);
    // 🔥 Refresh sidebar if schema changed
    if (data.schemaChanged) {
      refreshTables();
    }

    recordProgressAttempt({
      mode: "test",
      status: "success",
      durationSec: executionDurationSec,
      rowsReturned,
      sourceText: sqlInput,
    });

  } catch (error) {
    console.error(error);
    setHasRun(true);
    setResults([]);
    setRunError(true);
    setRunMessage("Execution failed. Please check SQL syntax and try again.");

    recordProgressAttempt({
      mode: "test",
      status: "failed",
      durationSec: Math.round((Date.now() - startedAt) / 1000),
      rowsReturned: 0,
      sourceText: sqlInput,
    });
  } finally {
    setIsRunning(false);
  }
};

  return (
    <div className="h-full max-w-5xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground mb-1">Test Mode</h1>
        <p className="text-sm text-muted-foreground">Write SQL queries, run them, and see the results instantly.</p>
        <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Workspace:</span>
          <span className="truncate max-w-[230px]">{activeWorkspaceLabel}</span>
          {activeWorkspaceRole ? <span className="uppercase text-[10px]">({activeWorkspaceRole})</span> : null}
        </div>
      </div>

      {/* Snippets */}
      <div className="flex flex-wrap gap-2 mb-4">
        {snippets.map((s) => (
          <button
            key={s.label}
            onClick={() => setSqlInput(s.sql)}
            className="px-3 py-1.5 rounded-lg bg-secondary/10 text-secondary text-xs font-semibold hover:bg-secondary/20 transition-colors duration-200"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden mb-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-secondary" />
            <span className="text-sm font-heading font-semibold text-foreground">SQL Editor</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRun}
            disabled={!sqlInput.trim() || isRunning}
            className="gap-2"
          >
            {isRunning ? (
              <div className="w-3.5 h-3.5 border-2 border-secondary-foreground/30 border-t-secondary-foreground rounded-full animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Run Query
          </Button>
        </div>
        <textarea
          value={sqlInput}
          onChange={(e) => setSqlInput(e.target.value)}
          placeholder="SELECT * FROM employees WHERE department = 'Engineering';"
          className="w-full p-4 bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none font-mono text-sm leading-relaxed min-h-[160px]"
          spellCheck={false}
        />
      </div>

      {/* Results */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
          <Table2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-heading font-semibold text-foreground">Results</span>
        </div>
        <div className="p-4">
          {hasRun ? (
            <div className="animate-fade-in">
              <div className="max-h-64 overflow-auto rounded-lg border border-border mb-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      {Object.keys(results[0] || {}).map((key) => (
                        <th key={key} className="px-4 py-2 text-left font-heading font-semibold text-foreground text-xs uppercase tracking-wider">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, i) => (
                      <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        {Object.values(row).map((val, j) => (
                          <td
                            key={j}
                            className={`text-foreground ${tableSettings.compactTable ? "px-3 py-1.5 text-xs" : "px-4 py-2.5"}`}
                          >
                            {val == null && tableSettings.showNullAsDash ? "-" : String(val ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {results.length >= tableSettings.resultRowLimit && (
                <p className="text-[11px] text-muted-foreground mb-2">
                  Showing first {tableSettings.resultRowLimit} rows based on your Settings.
                </p>
              )}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 text-accent text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {/* Query executed in 0.12s — 3 rows returned */}
                {runError
                  ? runMessage || "Query failed."
                  : `${runMessage || "Query executed."} ${results.length} row(s) returned`}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground text-sm">
              Run a query to see results here
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestMode;

// File use case:
// TestMode runs raw SQL queries and displays result sets for practice.
// It now logs each attempt to progress tracking for analytics and streak insights.
// This file also enforces query-safety confirmation and table display preferences from Settings.
