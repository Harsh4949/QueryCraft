import { getApiBaseUrl } from "@/lib/appSettings";

type QueryResponse = {
  data?: unknown[];
  message?: string;
  schemaChanged?: boolean;
  error?: string;
};

type QueryOptions = {
  token?: string;
  baseUrl?: string;
};

type SchemaInfo = {
  databaseName: string;
  schemaName: string;
  totalTables: number;
  tableNames: string[];
};

async function executeSql(query: string, options?: QueryOptions): Promise<QueryResponse> {
  if (!query || !query.trim()) {
    throw new Error("Query is required");
  }

  const token = options?.token || localStorage.getItem("token");
  if (!token) {
    throw new Error("Token not found. Please login first.");
  }

  const response = await fetch(`${options?.baseUrl || getApiBaseUrl()}/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
  });

  const payload = (await response.json()) as QueryResponse;

  if (!response.ok) {
    throw new Error(payload.error || `Query failed with status ${response.status}`);
  }

  return payload;
}

declare global {
  interface Window {
    qcQuery: (sql: string, options?: QueryOptions) => Promise<QueryResponse>;
    qcSelectAll: (tableName: string, options?: QueryOptions) => Promise<QueryResponse>;
    qcSchemaInfo: (options?: QueryOptions) => Promise<SchemaInfo>;
  }
}

if (import.meta.env.DEV) {
  window.qcQuery = async (sql: string, options?: QueryOptions) => {
    try {
      const result = await executeSql(sql, options);
      console.log("[qcQuery] SQL:", sql);
      console.log("[qcQuery] Result:", result.data || []);
      console.log("[qcQuery] Message:", result.message || "Query executed");
      if (result.schemaChanged) {
        console.log("[qcQuery] Schema changed: true");
      }
      return result;
    } catch (error) {
      console.error("[qcQuery] Error:", error);
      throw error;
    }
  };

  window.qcSelectAll = (tableName: string, options?: QueryOptions) => {
    if (!tableName || !tableName.trim()) {
      throw new Error("tableName is required");
    }
    return window.qcQuery(`SELECT * FROM ${tableName.trim()};`, options);
  };

  window.qcSchemaInfo = async (options?: QueryOptions) => {
    try {
      const [dbResult, schemaResult, countResult, tablesResult] = await Promise.all([
        executeSql("SELECT current_database() AS database_name;", options),
        executeSql("SELECT current_schema() AS schema_name;", options),
        executeSql(
          "SELECT COUNT(*)::int AS total_tables FROM information_schema.tables WHERE table_schema = current_schema();",
          options,
        ),
        executeSql(
          "SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() ORDER BY table_name;",
          options,
        ),
      ]);

      const databaseName = String((dbResult.data?.[0] as { database_name?: string } | undefined)?.database_name || "unknown");
      const schemaName = String((schemaResult.data?.[0] as { schema_name?: string } | undefined)?.schema_name || "unknown");
      const totalTables = Number((countResult.data?.[0] as { total_tables?: number } | undefined)?.total_tables || 0);
      const tableNames = (tablesResult.data || []).map((row) => String((row as { table_name?: string }).table_name || "")).filter(Boolean);

      const summary: SchemaInfo = {
        databaseName,
        schemaName,
        totalTables,
        tableNames,
      };

      console.log("[qcSchemaInfo] Database:", summary.databaseName);
      console.log("[qcSchemaInfo] Schema:", summary.schemaName);
      console.log("[qcSchemaInfo] Total Tables:", summary.totalTables);
      console.log("[qcSchemaInfo] Tables:", summary.tableNames);

      return summary;
    } catch (error) {
      console.error("[qcSchemaInfo] Error:", error);
      throw error;
    }
  };

  console.log("[QueryCraft Dev] Console DB helpers ready:");
  console.log("- qcQuery(\"SELECT * FROM your_table;\")");
  console.log("- qcSelectAll(\"your_table\")");
  console.log("- qcSchemaInfo() // database + schema + table count + table names");
}

// File use case:
// This dev-only helper exposes browser console shortcuts for secure, token-based DB querying.
// It is intended for local debugging and quick database inspection during development.
// It also respects the API base URL configured by the user in Settings.
export {};
