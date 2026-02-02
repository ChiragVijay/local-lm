export type ThemeVariant = "system" | "pro";
export type ThemeMode = "light" | "dark";

export interface ThemeConfig {
  id: string;
  variant: ThemeVariant;
  mode: ThemeMode;
  name: string;
  description: string;
}

export const themes: ThemeConfig[] = [
  {
    id: "system-light",
    variant: "system",
    mode: "light",
    name: "Sherwood",
    description: "Clean & Editorial",
  },
  {
    id: "system-dark",
    variant: "system",
    mode: "dark",
    name: "Sherwood",
    description: "Dark Editorial",
  },
  {
    id: "pro-light",
    variant: "pro",
    mode: "light",
    name: "Pro",
    description: "Natural Titanium",
  },
  {
    id: "pro-dark",
    variant: "pro",
    mode: "dark",
    name: "Pro",
    description: "Deep Space",
  },
];

export const themeVariants: {
  id: ThemeVariant;
  name: string;
  description: string;
}[] = [
  { id: "system", name: "Sherwood", description: "Clean, high contrast" },
  { id: "pro", name: "Pro", description: "iPhone Titanium" },
];

export function getTheme(variant: ThemeVariant, mode: ThemeMode): ThemeConfig {
  return themes.find((t) => t.variant === variant && t.mode === mode)!;
}

export function applyTheme(variant: ThemeVariant, mode: ThemeMode) {
  const root = document.documentElement;
  // Map "system" variant to "sherwood" for CSS
  const themeAttribute = variant === "system" ? "sherwood" : variant;
  root.setAttribute("data-theme", themeAttribute);
  root.classList.toggle("dark", mode === "dark");

  localStorage.setItem("theme-variant", variant);
  localStorage.setItem("theme-mode", mode);
}

export function getStoredTheme(): { variant: ThemeVariant; mode: ThemeMode } {
  const variant = (localStorage.getItem("theme-variant") as ThemeVariant) || "system";
  const mode = (localStorage.getItem("theme-mode") as ThemeMode) || "dark";
  return { variant, mode };
}
