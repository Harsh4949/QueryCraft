import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Database,
  Terminal,
  BookOpen,
  FlaskConical,
  BarChart3,
  Settings,
  LogOut,
  User,
  Menu,
  GraduationCap,
  FileText,
  Users
} from "@/components/icons";
import { useState, useEffect, useRef } from "react";
import { DatabaseContext } from "@/context/DatabaseContext";
import { getApiBaseUrl } from "@/lib/appSettings";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { buildWorkspaceHeaders, WORKSPACE_CHANGED_EVENT } from "@/lib/workspace";

const sidebarItems = [
  { icon: Database, label: "Dashboard", path: "/dashboard" },
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Users, label: "Team Workspaces", path: "/workspaces" },
  { icon: BookOpen, label: "Learn SQL", path: "/learn" },
  { icon: FlaskConical, label: "Practice SQL", path: "/test" },
  { icon: Terminal, label: "Developer Hub", path: "/developer" },
  { icon: FileText, label: "Saved Queries", path: "/saved-queries" },
  { icon: GraduationCap, label: "Tutorials", path: "/tutorials" },
  { icon: BarChart3, label: "Progress", path: "/progress" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLElement | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const[userName, setUserName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [tables, setTables] = useState<any[]>([]);

  // ✅ Fetch tables function (shared globally)
  const fetchTables = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const res = await fetch(`${getApiBaseUrl()}/schema`, {
        headers: buildWorkspaceHeaders(token),
      });
      console.log("Fetch tables response:", res);
      if(res.status === 401) {
        navigate("/login");
        return;
      }
      const data = await res.json();
      setTables(Array.isArray(data) ? data : (data.tables || []));
    } catch (err) {
      console.error("Failed to fetch tables", err);
      toast({
        title: "Table load failed",
        description: `Cannot connect to backend at ${getApiBaseUrl()}. Start backend server and refresh.`,
        variant: "destructive",
      });
    }
  };

  // ✅ Load schema on first mount
  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    const handleWorkspaceChanged = () => {
      fetchTables();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "querycraft_active_workspace_id_v1") {
        fetchTables();
      }
    };

    window.addEventListener(WORKSPACE_CHANGED_EVENT, handleWorkspaceChanged);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(WORKSPACE_CHANGED_EVENT, handleWorkspaceChanged);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Extract username from token and hydrate profile data when available.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      console.log("Token payload:", payload);
      setUserName( payload.username );

      fetch(`${getApiBaseUrl()}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(async (res) => {
          if (!res.ok) return null;
          const data = await res.json();
          return data;
        })
        .then((profile) => {
          if (!profile) return;
          setUserName(profile.display_name || payload.username || "User");
          setAvatarUrl(profile.avatar_url || "");
        })
        .catch(() => {
          // Ignore profile read failures and keep JWT fallback name.
        });
    } catch (err) {
      console.error("Failed to parse token", err);
    }
  }, []);

  // Ensure route navigation always starts at the top of dashboard content.
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    if (location.hash) {
      const id = location.hash.replace("#", "");
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }

    container.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search, location.hash]);

  // ✅ Handle table click
  const handleTableClick = (tableName: string) => {
    const sql = `SELECT * FROM ${tableName};`;

    navigate("/test", {
      state: { autoSQL: sql },
    });

    setSidebarOpen(false);
  };

  const handleLogOut = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <DatabaseContext.Provider
      value={{ tables, refreshTables: fetchTables }}
    >
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 dark:to-muted/10 flex flex-col">
        {/* Top Nav */}
        <header className="h-14 bg-background/90 backdrop-blur-md border-b border-border/80 flex items-center justify-between px-4 shrink-0 z-40">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            <Link
              to="/"
              className="flex items-center gap-2 font-heading font-bold text-lg"
            >
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                <Database className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="text-foreground">
                Query<span className="text-primary">Craft</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/tutorials"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/70 transition"
              >
                Tutorials
              </Link>
              <Link
                to="/developer"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition"
              >
                Developer Hub
              </Link>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
              <Avatar className="w-5 h-5 ring-1 ring-primary/40 ring-offset-1 ring-offset-background">
                <AvatarImage src={avatarUrl} alt={userName || "User"} />
                <AvatarFallback className="text-[10px] font-semibold bg-primary/20 text-primary">
                  {(userName || "U").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Link to="/profile" className="text-xs font-semibold max-w-[120px] truncate hover:underline">
                {userName || "User"}
              </Link>
            </div>

            <ThemeToggleButton />

            <Button variant="ghost" size="icon" className="rounded-full" onClick={handleLogOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside
            className={`
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
              lg:translate-x-0
              fixed lg:static inset-y-14 left-0 z-30
              w-60 bg-background border-r border-border
              transition-transform duration-200 ease-out
              flex flex-col
            `}
          >
            <nav className="flex-1 p-3 space-y-1.5">
              <p className="px-2 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Workspace
              </p>
              {sidebarItems.map((item) => {
                const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-200
                      ${
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/20 shadow-soft"
                          : "text-muted-foreground border border-transparent hover:bg-muted hover:text-foreground"
                      }
                    `}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* ✅ Database Section */}
            <div className="border-t border-border p-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Database Tables
              </h3>

              {tables.length ? (
                <div className="space-y-1 max-h-48 overflow-auto pr-1">
                  {tables.map((table) => (
                    <button
                      key={table.table_name}
                      onClick={() => handleTableClick(table.table_name)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                    >
                      {table.table_name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground px-1 py-2">No tables loaded yet.</p>
              )}
            </div>
          </aside>

          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-foreground/20 z-20 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <main ref={contentRef} className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </DatabaseContext.Provider>
  );
};

export default DashboardLayout;

// File use case:
// DashboardLayout provides the authenticated shell for all main pages.
// It handles app navigation, user identity display, and database table sidebar loading.
// API calls in this file respect the configurable backend base URL from Settings.
// It now also provides a direct light/dark theme toggle in the dashboard header.