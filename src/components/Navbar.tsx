import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Database, BookOpen, FlaskConical, User, LogOut, Menu } from "@/components/icons";
import { useEffect, useState } from "react";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getApiBaseUrl } from "@/lib/appSettings";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Dashboard", path: "/dashboard" },
  { label: "Learn SQL", path: "/learn" },
  { label: "Practice", path: "/test" },
  { label: "Developer", path: "/developer" },
];

const Navbar = () => {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  // Keep auth user visible on landing navbar and hide login/signup after authentication.
  useEffect(() => {
    const syncUserFromToken = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUserName(null);
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split(".")[1] || ""));
        const fallbackName = payload.username || payload.name || payload.email || "User";
        setUserName(fallbackName);

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
            setUserName(profile.display_name || fallbackName);
            setAvatarUrl(profile.avatar_url || "");
          })
          .catch(() => {
            // Keep fallback token identity when profile request fails.
          });
      } catch {
        setUserName("User");
      }
    };

    syncUserFromToken();
    window.addEventListener("storage", syncUserFromToken);

    return () => {
      window.removeEventListener("storage", syncUserFromToken);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUserName(null);
    setAvatarUrl("");
    setMobileOpen(false);
  };

  if (!isLanding) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/80 shadow-soft/20">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2 font-heading font-bold text-xl">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Database className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-foreground">Query<span className="text-primary">Craft</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(`${item.path}/`));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggleButton />
          {userName ? (
            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <Avatar className="w-5 h-5">
                <AvatarImage src={avatarUrl} alt={userName} />
                <AvatarFallback className="text-[10px] font-semibold bg-primary/20 text-primary">
                  {(userName || "U").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[150px] truncate">{userName}</span>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Log In</Link>
              </Button>
              <Button variant="hero" size="sm" asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggleButton />
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          <div className="flex flex-col p-4 gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(`${item.path}/`));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}

            {userName ? (
              <div className="mt-2 space-y-2">
                <div className="inline-flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={avatarUrl} alt={userName} />
                    <AvatarFallback className="text-[10px] font-semibold bg-primary/20 text-primary">
                      {(userName || "U").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{userName}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                  Log Out
                </Button>
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login" onClick={() => setMobileOpen(false)}>Log In</Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/register" onClick={() => setMobileOpen(false)}>Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

// File use case:
// Navbar controls landing-page top navigation and authentication actions.
// It conditionally hides login/signup when the user is authenticated and shows the current username instead.
