"use client";

import { createTheme, alpha, type ThemeOptions } from "@mui/material/styles";

/**
 * Design system — clean-light, neutral, single-accent.
 *
 * The accent is `primary = #0f766e` (Tailwind teal-700).
 *
 *   Why teal and not blue?
 *   - "Sạch, sáng, ít màu" favours a non-default hue that does not look
 *     like a SaaS blue / Bootstrap. Teal reads professional and unique.
 *   - Teal sits between blue and green, so it pairs with a green
 *     "success" without fighting it; blue is too close to MUI's default
 *     `info` and would require a custom `info` to keep status colors
 *     distinguishable.
 *   - The previous dark theme already used teal (`#00b8d9`); keeping
 *     the same hue family (just muted/darker) gives continuity between
 *     this reset and any future "dark mode" sibling theme.
 *
 * Secondary is intentionally grey (not a second hue) so the surface
 * palette stays neutral. Status colors use MUI defaults with one
 * small saturation nudge so they read on a light background.
 */

export const tokens = {
  color: {
    bg: "#f6f8fb",
    paper: "#ffffff",
    surface: "#f1f4f9",
    surfaceMuted: "#f8fafc",
    line: "#e5e7eb",
    lineSoft: "#eef0f4",
    text: "#0f172a",
    textMuted: "#475569",
    textSubtle: "#64748b",
    primary: "#0f766e",
    primaryDark: "#115e59",
    primarySoft: "#ccfbf1",
    primaryOnSoft: "#0f766e",
    accent: "#1d4ed8",
    success: "#16a34a",
    warning: "#d97706",
    danger: "#dc2626",
    info: "#2563eb",
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    pill: 999,
  },
  shadow: {
    sm: "0 1px 2px rgba(15, 23, 42, 0.05), 0 1px 1px rgba(15, 23, 42, 0.03)",
    md: "0 4px 12px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
    lg: "0 16px 40px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)",
    none: "none",
  },
  spacing: (n: number) => `${n * 4}px`,
  font: {
    family: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
} as const;

const themeOptions: ThemeOptions = {
  palette: {
    mode: "light",
    primary: {
      main: tokens.color.primary,
      dark: tokens.color.primaryDark,
      light: "#14b8a6",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#475569",
      light: "#64748b",
      dark: "#334155",
      contrastText: "#ffffff",
    },
    success: { main: tokens.color.success, light: "#4ade80", dark: "#15803d" },
    warning: { main: tokens.color.warning, light: "#fbbf24", dark: "#b45309" },
    error: { main: tokens.color.danger, light: "#f87171", dark: "#b91c1c" },
    info: { main: tokens.color.info, light: "#60a5fa", dark: "#1d4ed8" },
    background: {
      default: tokens.color.bg,
      paper: tokens.color.paper,
    },
    text: {
      primary: tokens.color.text,
      secondary: tokens.color.textMuted,
      disabled: tokens.color.textSubtle,
    },
    divider: tokens.color.line,
    grey: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
  },
  shape: {
    borderRadius: tokens.radius.md,
  },
  typography: {
    fontFamily: tokens.font.family,
    fontSize: 14,
    htmlFontSize: 16,
    h1: { fontWeight: 700, fontSize: "2rem", lineHeight: 1.2, letterSpacing: "-0.02em" },
    h2: { fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.25, letterSpacing: "-0.015em" },
    h3: { fontWeight: 700, fontSize: "1.25rem", lineHeight: 1.3, letterSpacing: "-0.01em" },
    h4: { fontWeight: 700, fontSize: "1.125rem", lineHeight: 1.35 },
    h5: { fontWeight: 600, fontSize: "1rem", lineHeight: 1.4 },
    h6: { fontWeight: 600, fontSize: "0.9375rem", lineHeight: 1.4 },
    subtitle1: { fontWeight: 600, fontSize: "0.9375rem", lineHeight: 1.45 },
    subtitle2: { fontWeight: 600, fontSize: "0.8125rem", lineHeight: 1.4 },
    body1: { fontWeight: 400, fontSize: "0.875rem", lineHeight: 1.55 },
    body2: { fontWeight: 400, fontSize: "0.8125rem", lineHeight: 1.55 },
    button: { fontWeight: 600, fontSize: "0.8125rem", lineHeight: 1.4, textTransform: "none", letterSpacing: 0 },
    caption: { fontWeight: 400, fontSize: "0.75rem", lineHeight: 1.4, color: tokens.color.textMuted },
    overline: { fontWeight: 600, fontSize: "0.6875rem", lineHeight: 1.4, letterSpacing: "0.08em", textTransform: "uppercase" },
  },
  shadows: [
    tokens.shadow.none,
    tokens.shadow.sm,
    tokens.shadow.sm,
    tokens.shadow.sm,
    tokens.shadow.md,
    tokens.shadow.md,
    tokens.shadow.md,
    tokens.shadow.md,
    tokens.shadow.md,
    tokens.shadow.md,
    tokens.shadow.md,
    tokens.shadow.md,
    tokens.shadow.md,
    tokens.shadow.md,
    tokens.shadow.md,
    tokens.shadow.md,
    tokens.shadow.lg,
    tokens.shadow.lg,
    tokens.shadow.lg,
    tokens.shadow.lg,
    tokens.shadow.lg,
    tokens.shadow.lg,
    tokens.shadow.lg,
    tokens.shadow.lg,
    tokens.shadow.lg,
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: tokens.color.bg,
          color: tokens.color.text,
          fontFamily: tokens.font.family,
        },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: false,
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        disableRipple: false,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: tokens.radius.sm,
          paddingInline: 14,
          paddingBlock: 6,
          minHeight: 34,
          letterSpacing: 0,
          "&:focus-visible": {
            outline: `2px solid ${alpha(tokens.color.primary, 0.35)}`,
            outlineOffset: 2,
          },
        },
        sizeSmall: { minHeight: 28, paddingInline: 10, paddingBlock: 4, fontSize: "0.75rem" },
        sizeLarge: { minHeight: 40, paddingInline: 18, paddingBlock: 8, fontSize: "0.875rem" },
        contained: {
          boxShadow: "none",
        },
        outlined: {
          borderColor: tokens.color.line,
          color: tokens.color.text,
          backgroundColor: tokens.color.paper,
          "&:hover": {
            backgroundColor: tokens.color.surfaceMuted,
            borderColor: tokens.color.line,
          },
        },
        text: {
          color: tokens.color.textMuted,
          "&:hover": { backgroundColor: tokens.color.surface, color: tokens.color.text },
        },
      },
    },
    MuiIconButton: {
      defaultProps: { size: "small" },
      styleOverrides: {
        root: {
          color: tokens.color.textMuted,
          borderRadius: tokens.radius.sm,
          "&:hover": { backgroundColor: tokens.color.surface, color: tokens.color.text },
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: tokens.color.paper,
          border: `1px solid ${tokens.color.line}`,
          borderRadius: tokens.radius.md,
        },
        outlined: { border: `1px solid ${tokens.color.line}` },
        elevation0: { boxShadow: tokens.shadow.none },
        elevation1: { boxShadow: tokens.shadow.sm },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0, variant: "outlined" },
      styleOverrides: {
        root: {
          border: `1px solid ${tokens.color.line}`,
          borderRadius: 12,
          backgroundColor: tokens.color.paper,
          backgroundImage: "none",
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: { padding: 16, "&:last-child": { paddingBottom: 16 } },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.sm,
          backgroundColor: tokens.color.paper,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: tokens.color.line },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: tokens.color.textSubtle },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: tokens.color.primary, borderWidth: 1 },
        },
        input: { padding: "8px 12px", fontSize: "0.875rem" },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "0.8125rem",
          color: tokens.color.textMuted,
          "&.Mui-focused": { color: tokens.color.primary },
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small", variant: "outlined" },
    },
    MuiSelect: {
      defaultProps: { size: "small" },
    },
    MuiFormControl: {
      defaultProps: { size: "small" },
    },
    MuiChip: {
      defaultProps: { size: "small", variant: "filled" },
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.sm,
          fontWeight: 600,
          height: 24,
          fontSize: "0.75rem",
        },
        colorPrimary: {
          backgroundColor: tokens.color.primarySoft,
          color: tokens.color.primaryOnSoft,
        },
        colorSuccess: { backgroundColor: "#dcfce7", color: "#166534" },
        colorWarning: { backgroundColor: "#fef3c7", color: "#92400e" },
        colorError: { backgroundColor: "#fee2e2", color: "#991b1b" },
        colorInfo: { backgroundColor: "#dbeafe", color: "#1e40af" },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: { borderCollapse: "separate", borderSpacing: 0 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${tokens.color.lineSoft}`,
          fontSize: "0.8125rem",
          padding: "10px 12px",
        },
        head: {
          backgroundColor: tokens.color.surfaceMuted,
          color: tokens.color.textMuted,
          fontWeight: 600,
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-child .MuiTableCell-body": { borderBottom: "none" },
          "&:hover": { backgroundColor: tokens.color.surfaceMuted },
        },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: false },
      styleOverrides: {
        tooltip: {
          backgroundColor: tokens.color.text,
          color: tokens.color.paper,
          fontSize: "0.75rem",
          fontWeight: 500,
          padding: "6px 8px",
          borderRadius: tokens.radius.sm,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
          border: `1px solid ${tokens.color.line}`,
          backgroundImage: "none",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: tokens.color.paper,
          borderColor: tokens.color.line,
          backgroundImage: "none",
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 36 },
        indicator: { backgroundColor: tokens.color.primary, height: 2, borderRadius: 1 },
      },
    },
    MuiTab: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          textTransform: "none",
          minHeight: 36,
          fontWeight: 600,
          fontSize: "0.8125rem",
          color: tokens.color.textMuted,
          "&.Mui-selected": { color: tokens.color.primary },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          padding: 6,
          width: 36,
          height: 22,
        },
        track: {
          borderRadius: 11,
          backgroundColor: tokens.color.line,
          opacity: 1,
        },
        thumb: {
          boxShadow: "none",
          width: 16,
          height: 16,
        },
        switchBase: {
          padding: 5,
          "&.Mui-checked": {
            transform: "translateX(14px)",
            color: tokens.color.paper,
            "& + .MuiSwitch-track": { backgroundColor: tokens.color.primary, opacity: 1 },
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: tokens.color.line,
          padding: 6,
          "&.Mui-checked": { color: tokens.color.primary },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: tokens.color.lineSoft },
      },
    },
    MuiList: {
      styleOverrides: {
        root: { padding: 4 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.sm,
          "&.Mui-selected": {
            backgroundColor: alpha(tokens.color.primary, 0.08),
            color: tokens.color.primary,
            "& .MuiListItemIcon-root": { color: tokens.color.primary },
            "&:hover": { backgroundColor: alpha(tokens.color.primary, 0.12) },
          },
        },
      },
    },
    MuiAlert: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: { borderRadius: tokens.radius.sm, fontSize: "0.8125rem" },
        colorError: { backgroundColor: "#fef2f2", color: "#991b1b", borderColor: "#fecaca" },
        colorSuccess: { backgroundColor: "#f0fdf4", color: "#166534", borderColor: "#bbf7d0" },
        colorWarning: { backgroundColor: "#fffbeb", color: "#92400e", borderColor: "#fde68a" },
        colorInfo: { backgroundColor: "#eff6ff", color: "#1e40af", borderColor: "#bfdbfe" },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "default" },
      styleOverrides: {
        root: {
          backgroundColor: tokens.color.paper,
          backgroundImage: "none",
          borderBottom: `1px solid ${tokens.color.line}`,
          color: tokens.color.text,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 6, borderRadius: tokens.radius.pill, backgroundColor: tokens.color.surface },
        bar: { backgroundColor: tokens.color.primary, borderRadius: tokens.radius.pill },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: { color: tokens.color.primary },
      },
    },
  },
};

const theme = createTheme(themeOptions);

export default theme;
