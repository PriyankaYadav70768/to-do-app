"use client";

import React, { useEffect } from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={true}
      disableTransitionOnChange={false}
      storageKey="pulsetask_theme"
    >
      <ThemeDatabaseSync />
      {children}
    </NextThemesProvider>
  );
}

// Background sync with database preferences for authenticated users
function ThemeDatabaseSync() {
  const { theme, setTheme } = useNextTheme();

  // On initial mount, fetch user preference from DB if present
  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((data) => {
        if (data.preferences?.theme) {
          const dbTheme = data.preferences.theme;
          // Only update if not already explicitly set locally
          const local = localStorage.getItem("pulsetask_theme");
          if (!local) {
            setTheme(dbTheme);
          }
        }
      })
      .catch(() => {});
  }, [setTheme]);

  // Sync back to DB on change
  useEffect(() => {
    if (theme) {
      fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      }).catch(() => {});
    }
  }, [theme]);

  return null;
}

export function useTheme() {
  const { theme, resolvedTheme, setTheme, systemTheme } = useNextTheme();

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return {
    theme: (theme || "dark") as "light" | "dark" | "system",
    resolvedTheme: (resolvedTheme || "dark") as "light" | "dark",
    setTheme,
    toggleTheme,
    systemTheme,
  };
}
