import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Clock3, Mail, Save, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { getApiBaseUrl } from "@/lib/appSettings";

type ProfilePayload = {
  user_id: number;
  username: string;
  schema: string;
  display_name: string;
  email: string;
  bio: string;
  avatar_url: string;
};

type ProfileForm = {
  displayName: string;
  email: string;
  bio: string;
  avatarUrl: string;
};

const emptyForm: ProfileForm = {
  displayName: "",
  email: "",
  bio: "",
  avatarUrl: "",
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
    const message = String((payload as { error?: unknown }).error || "").trim();
    if (message.startsWith("<!DOCTYPE") || message.startsWith("<html")) {
      return `Configured backend (${getApiBaseUrl()}) does not expose profile API yet.`;
    }
    return message || fallback;
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

const Profile = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [username, setUsername] = useState("");
  const [schemaName, setSchemaName] = useState("");
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [updatedAtLabel, setUpdatedAtLabel] = useState("");

  const avatarInitial = useMemo(() => {
    const source = form.displayName || username || "U";
    return source.slice(0, 1).toUpperCase();
  }, [form.displayName, username]);

  const getAuthToken = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return null;
    }
    return token;
  };

  const loadProfile = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${getApiBaseUrl()}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      const payload = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Failed to load profile"));
      }

      const data = payload as ProfilePayload;
      setUsername(data.username || "");
      setSchemaName(data.schema || "");
      setUpdatedAtLabel(new Date().toLocaleString());
      setForm({
        displayName: data.display_name || data.username || "",
        email: data.email || "",
        bio: data.bio || "",
        avatarUrl: data.avatar_url || "",
      });
    } catch (error) {
      toast({
        title: "Profile load failed",
        description: getReadableErrorMessage(error, "Unable to load profile"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async () => {
    const token = getAuthToken();
    if (!token) return;

    const payload = {
      displayName: form.displayName.trim(),
      email: form.email.trim(),
      bio: form.bio.trim(),
      avatarUrl: form.avatarUrl.trim(),
    };

    if (!payload.displayName) {
      toast({
        title: "Display name required",
        description: "Please enter a display name before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(`${getApiBaseUrl()}/me`, {
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

      const body = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(body, "Failed to update profile"));
      }

      const profile = body as { display_name: string; email: string; bio: string; avatar_url: string };
      setForm({
        displayName: profile.display_name || payload.displayName,
        email: profile.email || payload.email,
        bio: profile.bio || payload.bio,
        avatarUrl: profile.avatar_url || payload.avatarUrl,
      });
      setUpdatedAtLabel(new Date().toLocaleString());

      toast({
        title: "Profile updated",
        description: "Your profile and avatar were saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: getReadableErrorMessage(error, "Failed to update profile"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">User Profile & Avatar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your public display details and avatar used across QueryCraft.
        </p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Profile Overview</CardTitle>
            <CardDescription>Preview how your identity appears in the app shell.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
              <Avatar className="w-16 h-16 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                <AvatarImage src={form.avatarUrl} alt={form.displayName || username || "User"} />
                <AvatarFallback className="text-lg font-semibold bg-primary/15 text-primary">
                  {avatarInitial}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="text-base font-semibold text-foreground truncate">{form.displayName || "Unnamed User"}</p>
                <p className="text-xs text-muted-foreground truncate">@{username || "user"}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <User className="w-3.5 h-3.5" />
                Username: <span className="text-foreground font-medium">{username || "-"}</span>
              </div>
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <Mail className="w-3.5 h-3.5" />
                Email: <span className="text-foreground font-medium truncate max-w-[180px]">{form.email || "Not set"}</span>
              </div>
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <Clock3 className="w-3.5 h-3.5" />
                Updated: <span className="text-foreground font-medium">{updatedAtLabel || "-"}</span>
              </div>
              <p className="text-muted-foreground">Schema: <span className="text-foreground font-medium">{schemaName || "-"}</span></p>
            </div>

            <div className="rounded-lg border border-border bg-primary/5 p-3 text-xs text-muted-foreground flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 text-primary" />
              Use a public image URL for avatar. If empty, initials are shown automatically.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Edit Profile</CardTitle>
            <CardDescription>Keep your learning identity clear and consistent across pages.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-10 rounded-lg bg-muted animate-pulse" />
                <div className="h-10 rounded-lg bg-muted animate-pulse" />
                <div className="h-24 rounded-lg bg-muted animate-pulse" />
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-3">
                  <Input
                    value={form.displayName}
                    onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
                    placeholder="Display name"
                  />
                  <Input
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="Email (optional)"
                  />
                </div>

                <Input
                  value={form.avatarUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, avatarUrl: event.target.value }))}
                  placeholder="Avatar URL (e.g., https://example.com/avatar.png)"
                />

                <Textarea
                  value={form.bio}
                  onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
                  placeholder="Short bio (optional)"
                  className="min-h-[130px]"
                />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Bio helps personalize your dashboard context.</span>
                  <span>{form.bio.length}/500</span>
                </div>

                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                  <Save className="w-4 h-4" />
                  {isSaving ? "Saving Profile..." : "Save Profile"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;

// File use case:
// Profile page lets authenticated users view and update account profile details.
// It persists display name, email, bio, and avatar URL via backend /me endpoints.
// The avatar preview and header identity reflect saved profile data.
