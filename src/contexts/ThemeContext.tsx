import { useState, useEffect, type ReactNode } from "react";
import { applyTheme, getStoredTheme, getTheme } from "../lib/themes";
import { ThemeContext } from "./theme-context";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const storedTheme = getStoredTheme();
  const [variant, setVariant] = useState(storedTheme.variant);
  const [mode, setMode] = useState(storedTheme.mode);

  useEffect(() => {
    applyTheme(variant, mode);
  }, [variant, mode]);

  const setTheme = (newVariant: typeof variant, newMode: typeof mode) => {
    setVariant(newVariant);
    setMode(newMode);
  };

  const toggleMode = () => {
    const newMode = mode === "dark" ? "light" : "dark";
    setMode(newMode);
  };

  const currentTheme = getTheme(variant, mode);

  return (
    <ThemeContext.Provider
      value={{
        variant,
        mode,
        theme: currentTheme,
        setTheme,
        toggleMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
