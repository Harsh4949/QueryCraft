import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Code2, AlertCircle, Table2 } from "@/components/icons";
import { useLocation, useNavigate} from "react-router-dom";
import { useEffect } from "react";
import { useContext } from "react";
import { DatabaseContext } from "@/context/DatabaseContext";



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
  
  const { refreshTables } = useContext(DatabaseContext);
 const location = useLocation();
 const navigate = useNavigate();
  
  useEffect(() => {
  if (location.state?.autoSQL) {
    const autoSQL = location.state.autoSQL;

    const runAutoQuery = async () => {
      try {
        setSqlInput(autoSQL);
        setIsRunning(true);

        const token = localStorage.getItem("token");
        if (!token) {
          alert("You must be logged in to run this query.");
          setIsRunning(false);
          return;
        }

        const response = await fetch("https://sql-ai-backend-hosted.onrender.com/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ query: autoSQL }),
        });
        if(response.status === 401) {
          navigate("/login");
        return;
      }
        const data = await response.json();
        setResults(data.data || []);
        setHasRun(true);
      } catch (error) {
        console.error(error);
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
  const token = localStorage.getItem("token");
  if (!token) {
    alert("You must be logged in to run this query.");
    return;
  }
  try {
    setIsRunning(true);

    const response = await fetch("https://sql-ai-backend-hosted.onrender.com/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query: sqlInput }),
    });
    if(response.status === 401) {
      navigate("/login");
      return;
    }

    const data = await response.json();

    setResults(data.data || []);
    setHasRun(true);
    console.log("Query results:", data);
    // 🔥 Refresh sidebar if schema changed
    if (data.schemaChanged) {
      refreshTables();
    }

  } catch (error) {
    console.error(error);
  } finally {
    setIsRunning(false);
  }
};

  return (
    <div className="h-full max-w-5xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground mb-1">Test Mode</h1>
        <p className="text-sm text-muted-foreground">Write SQL queries, run them, and see the results instantly.</p>
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
                          <td key={j} className="px-4 py-2.5 text-foreground">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 text-accent text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {/* Query executed in 0.12s — 3 rows returned */}
                Query executed— {results.length} rows returned
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
