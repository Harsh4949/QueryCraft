const ACTIVE_WORKSPACE_STORAGE_KEY = "querycraft_active_workspace_id_v1";
export const WORKSPACE_CHANGED_EVENT = "querycraft:workspace-changed";

export function getActiveWorkspaceId(): number | null {
  try {
    const raw = localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function setActiveWorkspaceId(workspaceId: number | null) {
  try {
    if (typeof window === "undefined") return;

    if (!workspaceId || workspaceId <= 0) {
      localStorage.removeItem(ACTIVE_WORKSPACE_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(WORKSPACE_CHANGED_EVENT, { detail: { workspaceId: null } }));
      return;
    }

    localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, String(workspaceId));
    window.dispatchEvent(new CustomEvent(WORKSPACE_CHANGED_EVENT, { detail: { workspaceId } }));
  } catch {
    // Ignore localStorage write errors.
  }
}

export function buildWorkspaceHeaders(token: string, includeJsonContentType = false): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }

  const workspaceId = getActiveWorkspaceId();
  if (workspaceId) {
    headers["x-workspace-id"] = String(workspaceId);
  }

  return headers;
}

// File use case:
// Workspace utility centralizes active workspace persistence and request header construction.
// Query/schema APIs use these helpers so role-based access applies to the selected team workspace.
