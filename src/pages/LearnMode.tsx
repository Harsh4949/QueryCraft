import { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb, ArrowRight, AlertCircle, Table2 } from "@/components/icons";
import { DatabaseContext } from "@/context/DatabaseContext";
import { useNavigate } from "react-router";
import { recordProgressAttempt } from "@/lib/progress";
import { getApiBaseUrl, getAppSettings } from "@/lib/appSettings";

// const sampleResults = [
//   { id: 1, name: "Alice", email: "alice@example.com", age: 28 },
//   { id: 2, name: "Bob", email: "bob@example.com", age: 34 },
//   { id: 3, name: "Charlie", email: "charlie@example.com", age: 22 },
// ];

const LearnMode = () => {
  const [englishInput, setEnglishInput] = useState("");
  const [sqlOutput, setSqlOutput] = useState("");
  const [activeTab, setActiveTab] = useState<"sql" | "results">("sql");
  const [isConverting, setIsConverting] = useState(false);
  const [hasConverted, setHasConverted] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [aiMessage, setAiMessage] = useState("");
  const [isRunnable, setIsRunnable] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const tableSettings = getAppSettings();
  const navigate = useNavigate();

  const { refreshTables } = useContext(DatabaseContext);
  // const handleConvert = () => {
  //   if (!englishInput.trim()) return;
  //   setIsConverting(true);
  //   setTimeout(() => {
  //     setSqlOutput(`SELECT * FROM users\nWHERE age > 20\nORDER BY name ASC;`);
  //     setHasConverted(true);
  //     setIsConverting(false);
  //     setActiveTab("sql");
  //   }, 800);
  // };
// const handleConvert = async () => {
//   if (!englishInput.trim()) return;
//   // console.log("Converting English to SQL:", englishInput);

//   try {
//     setIsConverting(true);

//     const response = await fetch("http://localhost:3000/query", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ text: englishInput }),
//     });

//     if (!response.ok) {
//       throw new Error("Failed to generate SQL");
//     }

//     const data = await response.json();
//     console.log("Received from backend:", data);
//     setSqlOutput(data.generatedSQL );
//     setResults(data.data || []);
//     setHasConverted(true);
//     setActiveTab("sql");
//   } catch (error) {
//     console.error(error);
//   } finally {
//     setIsConverting(false);
//   }
// };

const handleConvert = async () => {
  if (!englishInput.trim()) return;
  const startedAt = Date.now();
  const currentSettings = getAppSettings();
  const baseUrl = getApiBaseUrl();

  try {
    setIsConverting(true);

    // Reset states before new request
    setHasConverted(false);
    setSqlOutput("");
    setResults([]);
    setAiMessage("");
    setIsRunnable(true);
    setStatusMessage("");

    const token = localStorage.getItem("token");
    if (!token) {
      setIsConverting(false);
      setHasConverted(true);
      setIsRunnable(false);
      setAiMessage("You must be logged in to use this feature.");
      return;
    }

    const response = await fetch(`${baseUrl}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({ text: englishInput }),
    });

    if(response.status === 401) {
        navigate("/login");
        return;
      }

    if (!response.ok) {
      throw new Error("Failed to generate SQL");
    }

    const data = await response.json();
    console.log("Received from backend:", data);

    setHasConverted(true);
    setActiveTab("sql");

    // 🔴 IF NOT RUNNABLE
    if (!data.runnable) {
      setIsRunnable(false);
      setAiMessage(data.message || "Invalid request.");
      recordProgressAttempt({
        mode: "learn",
        status: "failed",
        durationSec: Math.round((Date.now() - startedAt) / 1000),
        rowsReturned: 0,
        sourceText: englishInput,
      });
      setStatusMessage("Attempt tracked — clarify the prompt and try again.");
      return;
    }

    // 🟢 IF RUNNABLE
    setIsRunnable(true);
    setSqlOutput(data.generatedSQL);
    setResults((data.data || []).slice(0, currentSettings.resultRowLimit));

    // Refresh schema if table created/dropped
    if (data.schemaChanged) {
      refreshTables();
    }

    recordProgressAttempt({
      mode: "learn",
      status: "success",
      durationSec: Math.round((Date.now() - startedAt) / 1000),
      rowsReturned: (data.data || []).length,
      sourceText: data.generatedSQL || englishInput,
    });

    if (currentSettings.autoRunConvertedSql) {
      setStatusMessage("Attempt tracked. Redirecting to Test Mode...");
      navigate("/test", {
        state: { autoSQL: data.generatedSQL },
      });
      return;
    }

    setStatusMessage("Attempt tracked in Progress dashboard.");

  } catch (error) {
    console.error(error);
    setHasConverted(true);
    setIsRunnable(false);
    setAiMessage("Something went wrong while processing your request.");
    setStatusMessage("Attempt not completed due to error. Please try again.");
  } finally {
    setIsConverting(false);
  }
};


  return (
    <div className="h-full max-w-6xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground mb-1">Learn Mode</h1>
        <p className="text-sm text-muted-foreground">Type what you want in plain English, and we'll convert it to SQL.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 h-[calc(100%-5rem)]">
        {/* Left: English Input */}
        <div className="flex flex-col rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
            <Lightbulb className="w-4 h-4 text-primary" />
            <span className="text-sm font-heading font-semibold text-foreground">English Input</span>
          </div>
          <textarea
            value={englishInput}
            onChange={(e) => setEnglishInput(e.target.value)}
            placeholder="e.g., Show me all users older than 20, sorted by name"
            className="flex-1 p-4 bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none font-body text-sm leading-relaxed min-h-[200px]"
          />
          <div className="p-3 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Tip: Be specific about tables and conditions</p>
            <Button
              variant="accent"
              size="default"
              onClick={handleConvert}
              disabled={!englishInput.trim() || isConverting}
              className="gap-2"
            >
              {isConverting ? (
                <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              Convert
            </Button>
          </div>
        </div>

        {/* Right: Output */}
        <div className="flex flex-col rounded-xl border border-border bg-card shadow-card overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border bg-muted/50">
            <button
              onClick={() => setActiveTab("sql")}
              className={`
                flex-1 px-4 py-3 text-sm font-heading font-semibold transition-all duration-200 relative
                ${activeTab === "sql" ? "text-primary" : "text-muted-foreground hover:text-foreground"}
              `}
            >
              SQL Output
              {activeTab === "sql" && <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary" />}
            </button>
            <button
              onClick={() => setActiveTab("results")}
              className={`
                flex-1 px-4 py-3 text-sm font-heading font-semibold transition-all duration-200 relative
                ${activeTab === "results" ? "text-primary" : "text-muted-foreground hover:text-foreground"}
              `}
            >
              Result Table
              {activeTab === "results" && <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary" />}
            </button>
          </div>

          <div className="flex-1 p-4 min-h-[200px]">
            {activeTab === "sql" ? (
              <div className="h-full">
                {hasConverted ? (
                isRunnable ? (
                  <pre className="text-sm font-mono text-foreground bg-muted/50 rounded-lg p-4 animate-fade-in whitespace-pre-wrap">
                    {sqlOutput}
                  </pre>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-yellow-500 bg-yellow-500/10 p-4 rounded-lg animate-fade-in">
                    <AlertCircle className="w-4 h-4" />
                    {aiMessage}
                  </div>
                )
              ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Your SQL query will appear here
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full">
              {hasConverted ? (
                <>
                  <div className="max-h-[30rem] overflow-auto rounded-lg border border-border animate-fade-in">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr className="border-b border-border">
                          {results.length > 0 &&
                            Object.keys(results[0]).map((key) => (
                              <th
                                key={key}
                                className="sticky top-0 z-10 bg-muted/100 px-4 py-2 text-left font-heading font-semibold text-foreground text-xs uppercase tracking-wider"
                              >
                                {key}
                              </th>
                            ))}
                        </tr>
                      </thead>

                      <tbody>
                        {results.map((row) => (
                          <tr
                            key={row.id}
                            className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                          >
                            {Object.values(row).map((val, i) => (
                              <td
                                key={i}
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
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Showing first {tableSettings.resultRowLimit} rows based on your Settings.
                    </p>
                  )}
                </>
                ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  <Table2 className="w-5 h-5 mr-2" />
                  Results will appear after conversion
                </div>
              )}
            </div>
            )}
          </div>

          {/* Error area */}
          {hasConverted && (
            <div className="px-4 pb-3">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                  isRunnable ? "bg-accent/10 text-accent" : "bg-yellow-500/10 text-yellow-600"
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {isRunnable
                  ? `${statusMessage || "Attempt tracked."} ${results.length} row(s) returned.`
                  : statusMessage || aiMessage || "Please refine your input and retry."}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearnMode;

// File use case:
// LearnMode converts plain English into SQL and executes it through backend APIs.
// It now records each attempt so the Progress page reflects real user activity.
// This file also respects user settings for API URL, result table rendering, and optional auto-run flow.
// This file also respects user settings for API URL, result table rendering, and optional auto-run flow.
