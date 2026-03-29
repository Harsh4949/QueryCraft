import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Clock, FileText, Play, Star, Tag, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { getApiBaseUrl } from "@/lib/appSettings";

type SavedQuery = {
  id: number;
  name: string;
  query: string;
  description: string;
  tags: string[];
  is_favorite: boolean;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
};

const emptyForm = {
  id: 0,
  name: "",
  query: "",
  description: "",
  tagsInput: "",
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
      return `Configured backend (${getApiBaseUrl()}) does not expose Saved Queries API yet.`;
    }
    return raw || fallback;
  }

  return fallback;
}

const SavedQueries = () => {
  const navigate = useNavigate();
  const [queries, setQueries] = useState<SavedQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const selectedQuery = useMemo(
    () => queries.find((item) => item.id === selectedId) || null,
    [queries, selectedId],
  );

  const filteredQueries = useMemo(() => {
    const term = searchText.trim().toLowerCase();

    return queries.filter((item) => {
      const matchesFavorite = !showOnlyFavorites || item.is_favorite;
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.query.toLowerCase().includes(term) ||
        item.tags.some((tag) => tag.toLowerCase().includes(term));
      return matchesFavorite && matchesSearch;
    });
  }, [queries, searchText, showOnlyFavorites]);

  const parseTags = (raw: string) => {
    return raw
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 10);
  };

  const getAuthToken = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return null;
    }
    return token;
  };

  const loadSavedQueries = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${getApiBaseUrl()}/saved-queries`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      const data = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Failed to load saved queries"));
      }

      setQueries(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (error) {
      toast({
        title: "Load failed",
        description: error instanceof Error ? error.message : "Unable to fetch saved queries",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSavedQueries();
  }, []);

  useEffect(() => {
    if (!selectedQuery) {
      setForm(emptyForm);
      return;
    }

    setForm({
      id: selectedQuery.id,
      name: selectedQuery.name,
      query: selectedQuery.query,
      description: selectedQuery.description || "",
      tagsInput: (selectedQuery.tags || []).join(", "),
    });
  }, [selectedQuery]);

  const handleCreateNew = () => {
    setSelectedId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    const token = getAuthToken();
    if (!token) return;

    const name = form.name.trim();
    const queryText = form.query.trim();

    if (!name || !queryText) {
      toast({
        title: "Missing details",
        description: "Name and SQL query are required.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      name,
      query: queryText,
      description: form.description.trim(),
      tags: parseTags(form.tagsInput),
      isFavorite: selectedQuery?.is_favorite || false,
    };

    const isEditing = Boolean(selectedQuery);
    const endpoint = isEditing ? `${getApiBaseUrl()}/saved-queries/${selectedQuery?.id}` : `${getApiBaseUrl()}/saved-queries`;
    const method = isEditing ? "PUT" : "POST";

    try {
      setIsSaving(true);
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      const data = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Failed to save query"));
      }

      if (isEditing) {
        setQueries((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      } else {
        setQueries((prev) => [data, ...prev]);
      }

      setSelectedId(data.id);
      toast({
        title: isEditing ? "Updated" : "Saved",
        description: isEditing ? "Saved query updated." : "Saved query created.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Could not save query",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedQuery) return;

    const token = getAuthToken();
    if (!token) return;

    const approved = window.confirm(`Delete saved query "${selectedQuery.name}"?`);
    if (!approved) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/saved-queries/${selectedQuery.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      const data = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Failed to delete query"));
      }

      const next = queries.filter((item) => item.id !== selectedQuery.id);
      setQueries(next);
      setSelectedId(next[0]?.id || null);
      toast({ title: "Deleted", description: "Saved query deleted." });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Could not delete query",
        variant: "destructive",
      });
    }
  };

  const toggleFavorite = async (item: SavedQuery) => {
    const token = getAuthToken();
    if (!token) return;

    const payload = {
      name: item.name,
      query: item.query,
      description: item.description || "",
      tags: item.tags || [],
      isFavorite: !item.is_favorite,
    };

    try {
      const response = await fetch(`${getApiBaseUrl()}/saved-queries/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      const data = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Failed to update favorite status"));
      }

      setQueries((prev) => prev.map((row) => (row.id === item.id ? data : row)));
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Could not update favorite",
        variant: "destructive",
      });
    }
  };

  const runInTestMode = async (item: SavedQuery) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      await fetch(`${getApiBaseUrl()}/saved-queries/${item.id}/run`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Do not block query execution if usage tracking fails.
    }

    navigate("/test", { state: { autoSQL: item.query } });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Saved Query Library</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Save reusable SQL snippets, tag them by topic, and run them instantly in Test Mode.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Saved</p>
            <p className="text-2xl font-heading font-bold text-foreground">{queries.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Favorites</p>
            <p className="text-2xl font-heading font-bold text-primary">
              {queries.filter((item) => item.is_favorite).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Filtered Results</p>
            <p className="text-2xl font-heading font-bold text-secondary">{filteredQueries.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Your Queries</CardTitle>
            <CardDescription>Search, favorite, and select a query to edit.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search by name, SQL, or tag"
            />

            <div className="flex gap-2">
              <Button
                variant={showOnlyFavorites ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnlyFavorites((prev) => !prev)}
              >
                <Star className="w-3.5 h-3.5" />
                Favorites
              </Button>
              <Button variant="secondary" size="sm" onClick={handleCreateNew}>
                New
              </Button>
            </div>

            <div className="max-h-[420px] overflow-auto pr-1 space-y-2">
              {isLoading ? (
                <p className="text-sm text-muted-foreground py-4">Loading queries...</p>
              ) : filteredQueries.length ? (
                filteredQueries.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full text-left rounded-lg border p-3 transition-all ${
                      selectedId === item.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                      {item.is_favorite ? <Star className="w-4 h-4 text-primary shrink-0" /> : null}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 font-mono">{item.query}</p>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4">No saved queries found.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{selectedQuery ? "Edit Saved Query" : "Create Saved Query"}</CardTitle>
            <CardDescription>
              Store reusable SQL statements and launch them directly in Test Mode.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <Input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Query name (e.g., Top orders this week)"
              />
              <Input
                value={form.tagsInput}
                onChange={(event) => setForm((prev) => ({ ...prev, tagsInput: event.target.value }))}
                placeholder="Tags: analytics, joins, weekly"
              />
            </div>

            <Textarea
              value={form.query}
              onChange={(event) => setForm((prev) => ({ ...prev, query: event.target.value }))}
              className="min-h-[180px] font-mono text-xs"
              placeholder="SELECT * FROM orders ORDER BY created_at DESC LIMIT 20;"
            />

            <Textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              className="min-h-[90px]"
              placeholder="Optional: describe when to use this query"
            />

            {selectedQuery ? (
              <div className="flex flex-wrap gap-2 items-center">
                {(selectedQuery.tags || []).map((tag) => (
                  <Badge key={tag} variant="secondary" className="inline-flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {tag}
                  </Badge>
                ))}
                {!selectedQuery.tags?.length ? <span className="text-xs text-muted-foreground">No tags</span> : null}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleSave} disabled={isSaving}>
                <FileText className="w-4 h-4" />
                {selectedQuery ? "Update Query" : "Save Query"}
              </Button>

              {selectedQuery ? (
                <>
                  <Button variant="secondary" onClick={() => runInTestMode(selectedQuery)}>
                    <Play className="w-4 h-4" />
                    Run in Test Mode
                  </Button>

                  <Button variant="outline" onClick={() => toggleFavorite(selectedQuery)}>
                    <Star className="w-4 h-4" />
                    {selectedQuery.is_favorite ? "Unfavorite" : "Favorite"}
                  </Button>

                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </>
              ) : null}
            </div>

            {selectedQuery ? (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Updated {new Date(selectedQuery.updated_at).toLocaleString()}
                </span>
                {selectedQuery.last_run_at ? (
                  <span className="inline-flex items-center gap-1">
                    <Play className="w-3.5 h-3.5" />
                    Last run {new Date(selectedQuery.last_run_at).toLocaleString()}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Never run yet
                  </span>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SavedQueries;

// File use case:
// SavedQueries is a full-stack query library page.
// It lets users create, edit, favorite, delete, and search SQL snippets persisted in backend storage.
// Users can execute any saved query directly by launching it into Test Mode.
