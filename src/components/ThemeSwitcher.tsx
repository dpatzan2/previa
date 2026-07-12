"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
      if (savedTheme) {
        setTheme(savedTheme);
      }
    } catch (e) {
      console.warn("localStorage is not accessible:", e);
    }
  }, []);

  const applyTheme = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    try {
      if (newTheme === "system") {
        try {
          localStorage.removeItem("theme");
        } catch (e) {}
        const systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (systemDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } else {
        try {
          localStorage.setItem("theme", newTheme);
        } catch (e) {}
        if (newTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    } catch (e) {
      console.warn("Error applying theme:", e);
    }
  };

  // Listen to system color scheme changes if set to system
  useEffect(() => {
    if (theme !== "system") return;

    try {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } catch (e) {
      console.warn("matchMedia listener error:", e);
    }
  }, [theme]);

  // Don't render icons until mounted on client to prevent server/client HTML mismatch
  if (!mounted) {
    return (
      <div className="theme-switcher-placeholder" style={{ minWidth: "96px", height: "34px" }} />
    );
  }

  return (
    <div className="theme-switcher">
      <button
        type="button"
        className={`theme-btn ${theme === "light" ? "active" : ""}`}
        onClick={() => applyTheme("light")}
        title="Tema claro"
        aria-label="Tema claro"
      >
        <Sun size={15} />
      </button>
      <button
        type="button"
        className={`theme-btn ${theme === "dark" ? "active" : ""}`}
        onClick={() => applyTheme("dark")}
        title="Tema oscuro"
        aria-label="Tema oscuro"
      >
        <Moon size={15} />
      </button>
      <button
        type="button"
        className={`theme-btn ${theme === "system" ? "active" : ""}`}
        onClick={() => applyTheme("system")}
        title="Tema del sistema"
        aria-label="Tema del sistema"
      >
        <Monitor size={15} />
      </button>
    </div>
  );
}
