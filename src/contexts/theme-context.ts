import { createContext, useContext } from "react";
import type { ThemeVariant, ThemeMode, ThemeConfig } from "../lib/themes";

export interface ThemeContextValue {
  variant: ThemeVariant;
  mode: ThemeMode;
  theme: ThemeConfig;
  setTheme: (variant: ThemeVariant, mode: ThemeMode) => void;
  toggleMode: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
