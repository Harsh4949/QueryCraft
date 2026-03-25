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

const DEFAULT_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || "https://sql-ai-backend-hosted.onrender.com";

async function executeSql(query: string, options?: QueryOptions): Promise<QueryResponse> {
  if (!query || !query.trim()) {
    throw new Error("Query is required");
  }

  const token = options?.token || localStorage.getItem("token");
  if (!token) {
    throw new Error("Token not found. Please login first.");
  }

  const response = await fetch(`${options?.baseUrl || DEFAULT_BASE_URL}/execute`, {
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

  console.log("[QueryCraft Dev] Console DB helpers ready:");
  console.log("- qcQuery(\"SELECT * FROM your_table;\")");
  console.log("- qcSelectAll(\"your_table\")");
}

export {};
