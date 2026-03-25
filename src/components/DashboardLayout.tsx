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
  GraduationCap
} from "@/components/icons";
import { useState, useEffect, useRef } from "react";
import { DatabaseContext } from "@/context/DatabaseContext";
import { getApiBaseUrl } from "@/lib/appSettings";

const sidebarItems = [
  { icon: Database, label: "Dashboard", path: "/dashboard" },
  { icon: BookOpen, label: "Learn Mode", path: "/learn" },
  { icon: FlaskConical, label: "Test Mode", path: "/test" },
  { icon: Terminal, label: "Developer Mode", path: "/developer" },
  { icon: GraduationCap, label: "Tutorials", path: "/tutorials" },
  { icon: BarChart3, label: "My Progress", path: "/progress" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLElement | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const[userName, setUserName] = useState<string | null>(null);
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Fetch tables response:", res);
      if(res.status === 401) {
        navigate("/login");
        return;
      }
      const data = await res.json();
      setTables(data);
    } catch (err) {
      console.error("Failed to fetch tables", err);
    }
  };

  // ✅ Load schema on first mount
  useEffect(() => {
    fetchTables();
  }, []);

  //Extract username from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      console.log("Token payload:", payload);
      setUserName( payload.username );
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
      <div className="min-h-screen bg-muted/30 flex flex-col">
        {/* Top Nav */}
        <header className="h-14 bg-background border-b border-border flex items-center justify-between px-4 shrink-0 z-40">
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
              to="/dashboard"
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
            <Button variant="ghost" size="icon" className="rounded-full">
              <p className="text-xs">{userName || "User"}</p>
              {/* <User className="w-4 h-4" /> */}
            </Button>

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
            <nav className="flex-1 p-3 space-y-1">
              {sidebarItems.map((item) => {
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-all duration-200
                      ${
                        isActive
                          ? "bg-primary/10 text-primary shadow-soft"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
                Database
              </h3>

              <div className="space-y-1">
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