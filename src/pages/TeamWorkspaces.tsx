import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Plus, Users, RefreshCw, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { getApiBaseUrl } from "@/lib/appSettings";
import { getActiveWorkspaceId, setActiveWorkspaceId } from "@/lib/workspace";

type WorkspaceRole = "owner" | "editor" | "viewer";

type Workspace = {
  id: number;
  name: string;
  schema_name: string;
  owner_user_id: number;
  role: WorkspaceRole;
  created_at: string;
  updated_at: string;
};

type WorkspaceMember = {
  user_id: number;
  username: string;
  role: WorkspaceRole;
  joined_at: string;
};

async function readApiPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return { error: text };
}

function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    const raw = String((payload as { error?: unknown }).error || "").trim();
    if (raw.startsWith("<!DOCTYPE") || raw.startsWith("<html")) {
      return `Configured backend (${getApiBaseUrl()}) does not expose Team Workspaces API yet.`;
    }
    return raw || fallback;
  }

  return fallback;
}

function getReadableErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    if (error.message === "Failed to fetch") {
      return `Cannot connect to backend at ${getApiBaseUrl()}. Start backend server and refresh.`;
    }
    return error.message;
  }

  return fallback;
}

function normalizeWorkspaceId(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

const TeamWorkspaces = () => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [memberUsername, setMemberUsername] = useState("");
  const [memberRole, setMemberRole] = useState<WorkspaceRole>("viewer");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(getActiveWorkspaceId());

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) || null,
    [workspaces, selectedWorkspaceId],
  );

  const token = localStorage.getItem("token");

  const authHeaders = (includeJson = false): HeadersInit => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token || ""}`,
    };
    if (includeJson) headers["Content-Type"] = "application/json";
    return headers;
  };

  const loadWorkspaces = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${getApiBaseUrl()}/workspaces`, {
        headers: authHeaders(),
      });

      const payload = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Failed to load workspaces"));
      }

      const rows = (Array.isArray(payload) ? payload : [])
        .map((workspace) => {
          const workspaceId = normalizeWorkspaceId((workspace as { id?: unknown }).id);
          if (!workspaceId) return null;
          return {
            ...workspace,
            id: workspaceId,
          } as Workspace;
        })
        .filter((workspace): workspace is Workspace => workspace !== null);

      setWorkspaces(rows);

      const storedActiveId = normalizeWorkspaceId(getActiveWorkspaceId());
      const currentSelectedId = normalizeWorkspaceId(selectedWorkspaceId);
      const preferredId = storedActiveId ?? currentSelectedId;
      const matchingPreferredId = preferredId ? rows.find((workspace) => workspace.id === preferredId)?.id || null : null;
      const nextSelected = matchingPreferredId ?? rows[0]?.id ?? null;

      setSelectedWorkspaceId(nextSelected);
      setActiveWorkspaceId(nextSelected);
    } catch (error) {
      toast({
        title: "Workspace load failed",
        description: getReadableErrorMessage(error, "Unable to load workspaces"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMembers = async (workspaceId: number) => {
    if (!token) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/workspaces/${workspaceId}/members`, {
        headers: authHeaders(),
      });
      const payload = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Failed to load workspace members"));
      }
      setMembers(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setMembers([]);
      toast({
        title: "Member load failed",
        description: getReadableErrorMessage(error, "Unable to load workspace members"),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (!selectedWorkspaceId) {
      setMembers([]);
      return;
    }
    loadMembers(selectedWorkspaceId);
  }, [selectedWorkspaceId]);

  const handleSelectWorkspace = (workspaceId: number) => {
    setSelectedWorkspaceId(workspaceId);
    setActiveWorkspaceId(workspaceId);
    toast({
      title: "Workspace switched",
      description: "Schema/query operations now use the selected workspace.",
    });
  };

  const handleStartWorking = () => {
    if (!selectedWorkspaceId) {
      toast({
        title: "Select a workspace",
        description: "Choose a workspace first to start working.",
        variant: "destructive",
      });
      return;
    }

    setActiveWorkspaceId(selectedWorkspaceId);
    toast({
      title: "Workspace activated",
      description: "You're now working in the selected workspace.",
    });
    navigate("/learn");
  };

  const handleStartPractice = () => {
    if (!selectedWorkspaceId) {
      toast({
        title: "Select a workspace",
        description: "Choose a workspace first to start practicing.",
        variant: "destructive",
      });
      return;
    }

    setActiveWorkspaceId(selectedWorkspaceId);
    toast({
      title: "Workspace activated",
      description: "Practice mode is now using the selected workspace.",
    });
    navigate("/test");
  };

  const handleRefreshWorkspaceData = async () => {
    await loadWorkspaces();
    if (selectedWorkspaceId) {
      await loadMembers(selectedWorkspaceId);
    }

    toast({
      title: "Workspace data refreshed",
      description: "Latest workspaces and members are loaded.",
    });
  };

  const handleCreateWorkspace = async () => {
    if (!token) return;

    const name = workspaceName.trim();
    if (!name) {
      toast({
        title: "Workspace name required",
        description: "Enter a workspace name before creating.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch(`${getApiBaseUrl()}/workspaces`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ name }),
      });

      const payload = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Failed to create workspace"));
      }

      const createdWorkspaceId = normalizeWorkspaceId((payload as { id?: unknown }).id);
      if (!createdWorkspaceId) {
        throw new Error("Workspace created but response id is invalid");
      }

      const createdWorkspace = {
        ...(payload as Workspace),
        id: createdWorkspaceId,
      };

      setWorkspaceName("");
      setWorkspaces((prev) => [createdWorkspace, ...prev]);
      setSelectedWorkspaceId(createdWorkspaceId);
      setActiveWorkspaceId(createdWorkspaceId);
      toast({ title: "Workspace created", description: `${createdWorkspace.name} is ready.` });
      await loadMembers(createdWorkspaceId);
    } catch (error) {
      toast({
        title: "Create failed",
        description: getReadableErrorMessage(error, "Failed to create workspace"),
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddMember = async () => {
    if (!token || !selectedWorkspace) return;

    const username = memberUsername.trim();
    if (!username) {
      toast({ title: "Username required", description: "Enter username to add a member.", variant: "destructive" });
      return;
    }

    try {
      setIsAddingMember(true);
      const response = await fetch(`${getApiBaseUrl()}/workspaces/${selectedWorkspace.id}/members`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ username, role: memberRole }),
      });

      const payload = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Failed to add member"));
      }

      setMemberUsername("");
      toast({ title: "Member updated", description: `${payload.username} is now ${payload.role}.` });
      await loadMembers(selectedWorkspace.id);
    } catch (error) {
      toast({
        title: "Member update failed",
        description: getReadableErrorMessage(error, "Unable to update member role"),
        variant: "destructive",
      });
    } finally {
      setIsAddingMember(false);
    }
  };

  if (!token) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Please login to manage team workspaces.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Team Workspaces</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Collaborate on shared schemas/projects with role-based access: owner, editor, viewer.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Accessible Workspaces</p>
            <p className="text-2xl font-heading font-bold text-foreground">{workspaces.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active Workspace</p>
            <p className="text-sm font-semibold text-primary mt-1 truncate">{selectedWorkspace?.name || "None"}</p>
            {selectedWorkspace?.schema_name ? (
              <p className="text-[11px] text-muted-foreground mt-1 truncate">Schema: {selectedWorkspace.schema_name}</p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Your Role</p>
            <p className="text-sm font-semibold text-secondary mt-1 uppercase">{selectedWorkspace?.role || "-"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading">Create Workspace</CardTitle>
            <CardDescription>Create a shared schema/project owned by you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="Workspace name (e.g., Team Analytics)"
            />
            <Button onClick={handleCreateWorkspace} disabled={isCreating} className="gap-2">
              <Plus className="w-4 h-4" />
              {isCreating ? "Creating..." : "Create Workspace"}
            </Button>

            <div className="pt-2 space-y-2 max-h-[360px] overflow-auto pr-1">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading workspaces...</p>
              ) : workspaces.length ? (
                workspaces.map((workspace) => {
                  const isActive = workspace.id === selectedWorkspaceId;
                  return (
                    <button
                      key={workspace.id}
                      onClick={() => handleSelectWorkspace(workspace.id)}
                      className={`w-full text-left rounded-lg border p-3 transition-all ${
                        isActive ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm text-foreground truncate">{workspace.name}</p>
                        <Badge variant={workspace.role === "owner" ? "default" : workspace.role === "editor" ? "secondary" : "outline"}>
                          {workspace.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">Schema: {workspace.schema_name}</p>
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No workspaces yet. Create one to start collaborating.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-heading">Workspace Members</CardTitle>
                <CardDescription>Manage member roles for the selected workspace.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefreshWorkspaceData} className="gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedWorkspace ? (
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Select a workspace to view members and permissions.
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-sm font-semibold text-foreground">{selectedWorkspace.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">Role-based access applies to schema/query endpoints.</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">Schema: {selectedWorkspace.schema_name}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={handleStartWorking} className="w-fit gap-1.5">
                    <Play className="w-4 h-4" />
                    Start Learning
                  </Button>
                  <Button onClick={handleStartPractice} variant="secondary" className="w-fit gap-1.5">
                    <Play className="w-4 h-4" />
                    Start Practice
                  </Button>
                </div>

                {selectedWorkspace.role === "owner" ? (
                  <div className="grid md:grid-cols-[1fr_170px_auto] gap-2">
                    <Input
                      value={memberUsername}
                      onChange={(event) => setMemberUsername(event.target.value)}
                      placeholder="Username"
                    />
                    <Select value={memberRole} onValueChange={(value) => setMemberRole(value as WorkspaceRole)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddMember} disabled={isAddingMember} className="gap-1.5">
                      <Users className="w-4 h-4" />
                      Add
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-primary/5 p-3 text-xs text-muted-foreground">
                    Only workspace owners can add or change members.
                  </div>
                )}

                <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                  {members.length ? (
                    members.map((member) => (
                      <div key={member.user_id} className="rounded-lg border border-border bg-background p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{member.username}</p>
                          <p className="text-xs text-muted-foreground">Joined {new Date(member.joined_at).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={member.role === "owner" ? "default" : member.role === "editor" ? "secondary" : "outline"}>
                          {member.role}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                      No members found.
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5" />
                  Viewer role is read-only. Editor and owner can run mutating SQL.
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamWorkspaces;

// File use case:
// TeamWorkspaces manages shared schemas/projects and role-based membership.
// It supports creating workspaces, selecting active workspace, and assigning member roles.
// Active workspace selection controls schema/query endpoints via x-workspace-id headers.
