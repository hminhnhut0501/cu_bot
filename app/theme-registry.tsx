"use client";

import { CssBaseline, ThemeProvider } from "@mui/material";

import theme from "./theme";

/**
 * Client-side MUI provider. Lives outside `app/layout.tsx` so that the
 * layout file can stay a server component and keep `export const metadata`.
 * MUI v9 + Next 14 need ThemeProvider / CssBaseline in a client boundary
 * (CssBaseline reads `useMediaQuery`).
 */
export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
