"use client";

import { CssBaseline, ThemeProvider } from "@mui/material";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { createAppTheme, type ThemeMode } from "./theme";

const THEME_STORAGE_KEY = "cu-bot-theme-mode";

type ThemeModeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeModeContext = createContext<ThemeModeState | null>(null);

export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error("useThemeMode must be used inside ThemeRegistry.");
  }
  return context;
}

/**
 * Client-side MUI provider. Lives outside `app/layout.tsx` so that the
 * layout file can stay a server component and keep `export const metadata`.
 * MUI v9 + Next 14 need ThemeProvider / CssBaseline in a client boundary
 * (CssBaseline reads `useMediaQuery`).
 */
export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    const systemPrefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
    const nextMode = stored === "dark" || stored === "light" ? stored : systemPrefersDark ? "dark" : "light";
    setModeState(nextMode);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeModeContext.Provider
      value={{
        mode,
        setMode: setModeState,
        toggleMode: () => setModeState((current) => (current === "dark" ? "light" : "dark")),
      }}
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
