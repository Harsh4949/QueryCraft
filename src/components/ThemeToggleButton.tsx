import { useEffect, useState } from "react";
import { Moon, Sun } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { applyTheme, getCurrentTheme, getResolvedTheme, type ThemeMode } from "@/lib/theme";

const THEME_EVENT = "querycraft-theme-changed";

const ThemeToggleButton = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => getResolvedTheme());

  useEffect(() => {
    applyTheme(theme);
  }, []);

  useEffect(() => {
    const syncTheme = () => {
      setTheme(getCurrentTheme());
    };

    window.addEventListener(THEME_EVENT, syncTheme);
    window.addEventListener("storage", syncTheme);

    return () => {
      window.removeEventListener(THEME_EVENT, syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  const handleToggle = () => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    setTheme(nextTheme);
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full"
      onClick={handleToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
};

export default ThemeToggleButton;

// File use case:
// This component provides a reusable light/dark mode toggle button across the app.
// It persists user preference and syncs theme state between landing and dashboard headers.
