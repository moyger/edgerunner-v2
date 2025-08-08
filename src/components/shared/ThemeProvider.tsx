import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // 1) Prefer what the document already has (set by early script)
    try {
      const hasDarkClass = document.documentElement.classList.contains("dark");
      if (hasDarkClass) return "dark";
    } catch {}

    // 2) Fallback to saved preference
    try {
      const savedTheme = localStorage.getItem("edgerunner-theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        return savedTheme as Theme;
      }
    } catch {}

    // 3) Finally, use system preference
    try {
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    } catch {}

    return "light";
  });

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    const body = document.body;

    if (theme === "dark") {
      root.classList.add("dark");
      body.classList.add("dark");
    } else {
      root.classList.remove("dark");
      body.classList.remove("dark");
    }

    // Ensure immediate visual update and expose theme to CSS
    root.style.colorScheme = theme;
    root.setAttribute("data-theme", theme);

    // Save to localStorage
    localStorage.setItem("edgerunner-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={theme === "dark" ? "dark" : undefined}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}