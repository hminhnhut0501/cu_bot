"use client";

import { alpha, createTheme, type ThemeOptions } from "@mui/material/styles";

export type ThemeMode = "light" | "dark";

const lightColors = {
  bg: "#f6f7fb",
  bgTint: "#f3f7ff",
  paper: "#ffffff",
  surface: "#f4f7fb",
  surfaceMuted: "#f8fafc",
  surfaceVariant: "#e8edf7",
  surfaceContainerLow: "#f9fbff",
  surfaceContainer: "#f4f7fb",
  surfaceContainerHigh: "#eef2f9",
  line: "#dde4ef",
  lineSoft: "#edf1f7",
  text: "#0f172a",
  textMuted: "#475569",
  textSubtle: "#64748b",
  primary: "#0f766e",
  primaryDark: "#115e59",
  primarySoft: "#ccfbf1",
  primaryOnSoft: "#0f766e",
  secondary: "#4f46e5",
  secondarySoft: "#e0e7ff",
  secondaryOnSoft: "#4338ca",
  tertiary: "#d946ef",
  tertiarySoft: "#fae8ff",
  tertiaryOnSoft: "#a21caf",
  accent: "#1d4ed8",
  accentSoft: "#dbeafe",
  accentOnSoft: "#1e40af",
  success: "#16a34a",
  successSoft: "#dcfce7",
  successOnSoft: "#166534",
  warning: "#d97706",
  warningSoft: "#fef3c7",
  warningOnSoft: "#92400e",
  danger: "#dc2626",
  dangerSoft: "#fee2e2",
  dangerOnSoft: "#991b1b",
  info: "#2563eb",
  infoSoft: "#dbeafe",
  infoOnSoft: "#1e40af",
} as const;

const darkColors = {
  bg: "#0b1020",
  bgTint: "#0f172a",
  paper: "#111827",
  surface: "#111827",
  surfaceMuted: "#0f172a",
  surfaceVariant: "#1f2937",
  surfaceContainerLow: "#111827",
  surfaceContainer: "#131b2d",
  surfaceContainerHigh: "#172033",
  line: "#263246",
  lineSoft: "#1c2435",
  text: "#e5eefb",
  textMuted: "#c4d0e3",
  textSubtle: "#94a3b8",
  primary: "#2dd4bf",
  primaryDark: "#14b8a6",
  primarySoft: "#113530",
  primaryOnSoft: "#5eead4",
  secondary: "#818cf8",
  secondarySoft: "#1e2456",
  secondaryOnSoft: "#a5b4fc",
  tertiary: "#f472b6",
  tertiarySoft: "#4a1732",
  tertiaryOnSoft: "#f9a8d4",
  accent: "#60a5fa",
  accentSoft: "#102a52",
  accentOnSoft: "#93c5fd",
  success: "#4ade80",
  successSoft: "#102b1a",
  successOnSoft: "#86efac",
  warning: "#fbbf24",
  warningSoft: "#2f230c",
  warningOnSoft: "#fde68a",
  danger: "#f87171",
  dangerSoft: "#3b1313",
  dangerOnSoft: "#fca5a5",
  info: "#7dd3fc",
  infoSoft: "#10283d",
  infoOnSoft: "#bae6fd",
} as const;

const lightShadows = [
  "none",
  "0 1px 2px rgba(15, 23, 42, 0.05), 0 1px 1px rgba(15, 23, 42, 0.03)",
  "0 1px 2px rgba(15, 23, 42, 0.05), 0 1px 1px rgba(15, 23, 42, 0.03)",
  "0 1px 2px rgba(15, 23, 42, 0.05), 0 1px 1px rgba(15, 23, 42, 0.03)",
  "0 4px 12px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
  "0 4px 12px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
  "0 4px 12px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
  "0 4px 12px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
  "0 4px 12px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
  "0 4px 12px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
  "0 4px 12px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
  "0 4px 12px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
  "0 4px 12px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
  "0 4px 12px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
  "0 4px 12px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
  "0 4px 12px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
  "0 16px 40px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)",
  "0 16px 40px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)",
  "0 16px 40px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)",
  "0 16px 40px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)",
  "0 16px 40px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)",
  "0 16px 40px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)",
  "0 16px 40px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)",
  "0 16px 40px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)",
  "0 16px 40px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)",
] as const;

const darkShadows = [
  "none",
  "0 1px 2px rgba(0, 0, 0, 0.28), 0 1px 1px rgba(0, 0, 0, 0.18)",
  "0 1px 2px rgba(0, 0, 0, 0.28), 0 1px 1px rgba(0, 0, 0, 0.18)",
  "0 1px 2px rgba(0, 0, 0, 0.28), 0 1px 1px rgba(0, 0, 0, 0.18)",
  "0 4px 12px rgba(0, 0, 0, 0.32), 0 1px 2px rgba(0, 0, 0, 0.2)",
  "0 4px 12px rgba(0, 0, 0, 0.32), 0 1px 2px rgba(0, 0, 0, 0.2)",
  "0 4px 12px rgba(0, 0, 0, 0.32), 0 1px 2px rgba(0, 0, 0, 0.2)",
  "0 4px 12px rgba(0, 0, 0, 0.32), 0 1px 2px rgba(0, 0, 0, 0.2)",
  "0 4px 12px rgba(0, 0, 0, 0.32), 0 1px 2px rgba(0, 0, 0, 0.2)",
  "0 4px 12px rgba(0, 0, 0, 0.32), 0 1px 2px rgba(0, 0, 0, 0.2)",
  "0 4px 12px rgba(0, 0, 0, 0.32), 0 1px 2px rgba(0, 0, 0, 0.2)",
  "0 4px 12px rgba(0, 0, 0, 0.32), 0 1px 2px rgba(0, 0, 0, 0.2)",
  "0 4px 12px rgba(0, 0, 0, 0.32), 0 1px 2px rgba(0, 0, 0, 0.2)",
  "0 4px 12px rgba(0, 0, 0, 0.32), 0 1px 2px rgba(0, 0, 0, 0.2)",
  "0 4px 12px rgba(0, 0, 0, 0.32), 0 1px 2px rgba(0, 0, 0, 0.2)",
  "0 4px 12px rgba(0, 0, 0, 0.32), 0 1px 2px rgba(0, 0, 0, 0.2)",
  "0 16px 40px rgba(0, 0, 0, 0.42), 0 2px 4px rgba(0, 0, 0, 0.24)",
  "0 16px 40px rgba(0, 0, 0, 0.42), 0 2px 4px rgba(0, 0, 0, 0.24)",
  "0 16px 40px rgba(0, 0, 0, 0.42), 0 2px 4px rgba(0, 0, 0, 0.24)",
  "0 16px 40px rgba(0, 0, 0, 0.42), 0 2px 4px rgba(0, 0, 0, 0.24)",
  "0 16px 40px rgba(0, 0, 0, 0.42), 0 2px 4px rgba(0, 0, 0, 0.24)",
  "0 16px 40px rgba(0, 0, 0, 0.42), 0 2px 4px rgba(0, 0, 0, 0.24)",
  "0 16px 40px rgba(0, 0, 0, 0.42), 0 2px 4px rgba(0, 0, 0, 0.24)",
  "0 16px 40px rgba(0, 0, 0, 0.42), 0 2px 4px rgba(0, 0, 0, 0.24)",
  "0 16px 40px rgba(0, 0, 0, 0.42), 0 2px 4px rgba(0, 0, 0, 0.24)",
] as const;

const sharedTokens = {
  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    pill: 999,
  },
  shadow: {
    sm: lightShadows[1],
    md: lightShadows[4],
    lg: lightShadows[16],
    none: "none",
  },
  spacing: (n: number) => `${n * 4}px`,
  font: {
    family:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
} as const;

export const tokens = {
  ...sharedTokens,
  color: lightColors,
} as const;

export const moduleAccents = {
  main: {
    color: "#0f766e",
    soft: "#ccfbf1",
    line: "#5eead4",
    tint: "rgba(15, 118, 110, 0.08)",
  },
  content: {
    color: "#4f46e5",
    soft: "#e0e7ff",
    line: "#818cf8",
    tint: "rgba(79, 70, 229, 0.08)",
  },
  security: {
    color: "#2563eb",
    soft: "#dbeafe",
    line: "#93c5fd",
    tint: "rgba(37, 99, 235, 0.08)",
  },
  scam: {
    color: "#e11d48",
    soft: "#ffe4e6",
    line: "#f9a8d4",
    tint: "rgba(225, 29, 72, 0.08)",
  },
  fun: {
    color: "#d946ef",
    soft: "#fae8ff",
    line: "#f0abfc",
    tint: "rgba(217, 70, 239, 0.08)",
  },
  analytics: {
    color: "#0ea5e9",
    soft: "#e0f2fe",
    line: "#7dd3fc",
    tint: "rgba(14, 165, 233, 0.08)",
  },
  warning: {
    color: "#d97706",
    soft: "#fef3c7",
    line: "#fbbf24",
    tint: "rgba(217, 119, 6, 0.08)",
  },
} as const;

const buildThemeOptions = (mode: ThemeMode): ThemeOptions => {
  const colors = mode === "dark" ? darkColors : lightColors;
  const shadows = mode === "dark" ? darkShadows : lightShadows;

  return {
    palette: {
      mode,
      primary: {
        main: colors.primary,
        dark: colors.primaryDark,
        light: mode === "dark" ? "#5eead4" : "#14b8a6",
        contrastText: mode === "dark" ? "#06291f" : "#ffffff",
      },
      secondary: {
        main: colors.secondary,
        light: mode === "dark" ? "#a5b4fc" : "#818cf8",
        dark: mode === "dark" ? "#6366f1" : "#4338ca",
        contrastText: mode === "dark" ? "#101733" : "#ffffff",
      },
      success: {
        main: colors.success,
        light: mode === "dark" ? "#86efac" : "#4ade80",
        dark: mode === "dark" ? "#22c55e" : "#15803d",
        contrastText: mode === "dark" ? "#081b0f" : "#ffffff",
      },
      warning: {
        main: colors.warning,
        light: mode === "dark" ? "#fde68a" : "#fbbf24",
        dark: mode === "dark" ? "#f59e0b" : "#b45309",
        contrastText: mode === "dark" ? "#291800" : "#ffffff",
      },
      error: {
        main: colors.danger,
        light: mode === "dark" ? "#fca5a5" : "#f87171",
        dark: mode === "dark" ? "#ef4444" : "#b91c1c",
        contrastText: mode === "dark" ? "#2d0a0a" : "#ffffff",
      },
      info: {
        main: colors.info,
        light: mode === "dark" ? "#bae6fd" : "#60a5fa",
        dark: mode === "dark" ? "#38bdf8" : "#1d4ed8",
        contrastText: mode === "dark" ? "#071e2f" : "#ffffff",
      },
      background: {
        default: colors.bg,
        paper: colors.paper,
      },
      text: {
        primary: colors.text,
        secondary: colors.textMuted,
        disabled: colors.textSubtle,
      },
      divider: colors.line,
      grey: {
        50: mode === "dark" ? "#f8fafc" : "#f8fafc",
        100: mode === "dark" ? "#e2e8f0" : "#f1f5f9",
        200: mode === "dark" ? "#cbd5e1" : "#e2e8f0",
        300: mode === "dark" ? "#94a3b8" : "#cbd5e1",
        400: mode === "dark" ? "#64748b" : "#94a3b8",
        500: mode === "dark" ? "#475569" : "#64748b",
        600: mode === "dark" ? "#334155" : "#475569",
        700: mode === "dark" ? "#1e293b" : "#334155",
        800: mode === "dark" ? "#0f172a" : "#1e293b",
        900: mode === "dark" ? "#020617" : "#0f172a",
      },
    },
    shape: {
      borderRadius: sharedTokens.radius.md,
    },
    typography: {
      fontFamily: sharedTokens.font.family,
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
      caption: { fontWeight: 400, fontSize: "0.75rem", lineHeight: 1.4, color: colors.textMuted },
      overline: {
        fontWeight: 600,
        fontSize: "0.6875rem",
        lineHeight: 1.4,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      },
    },
    shadows: shadows as unknown as ThemeOptions["shadows"],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            colorScheme: mode,
          },
          body: {
            backgroundColor: colors.bg,
            color: colors.text,
            fontFamily: sharedTokens.font.family,
          },
          "*::selection": {
            backgroundColor: alpha(colors.primary, mode === "dark" ? 0.32 : 0.2),
            color: mode === "dark" ? "#041311" : colors.text,
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
            borderRadius: sharedTokens.radius.sm,
            paddingInline: 14,
            paddingBlock: 6,
            minHeight: 34,
            letterSpacing: 0,
            "&:focus-visible": {
              outline: `2px solid ${alpha(colors.primary, 0.35)}`,
              outlineOffset: 2,
            },
          },
          sizeSmall: { minHeight: 28, paddingInline: 10, paddingBlock: 4, fontSize: "0.75rem" },
          sizeLarge: { minHeight: 40, paddingInline: 18, paddingBlock: 8, fontSize: "0.875rem" },
          contained: {
            boxShadow: "none",
          },
          outlined: {
            borderColor: colors.line,
            color: colors.text,
            backgroundColor: colors.paper,
            "&:hover": {
              backgroundColor: colors.surfaceMuted,
              borderColor: colors.line,
            },
          },
          text: {
            color: colors.textMuted,
            "&:hover": { backgroundColor: colors.surface, color: colors.text },
          },
        },
      },
      MuiIconButton: {
        defaultProps: { size: "small" },
        styleOverrides: {
          root: {
            color: colors.textMuted,
            borderRadius: sharedTokens.radius.sm,
            "&:hover": { backgroundColor: colors.surface, color: colors.text },
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: colors.surfaceContainerLow,
            border: `1px solid ${colors.line}`,
            borderRadius: sharedTokens.radius.lg,
          },
          outlined: { border: `1px solid ${colors.line}` },
          elevation0: { boxShadow: "none" },
          elevation1: { boxShadow: shadows[1] },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0, variant: "outlined" },
        styleOverrides: {
          root: {
            border: `1px solid ${colors.line}`,
            borderRadius: 16,
            backgroundColor: colors.surfaceContainerLow,
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
            borderRadius: sharedTokens.radius.sm,
            backgroundColor: colors.paper,
            "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.line },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: colors.textSubtle },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: colors.primary,
              borderWidth: 1,
            },
          },
          input: { padding: "8px 12px", fontSize: "0.875rem" },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: "0.8125rem",
            color: colors.textMuted,
            "&.Mui-focused": { color: colors.primary },
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
            borderRadius: sharedTokens.radius.pill,
            fontWeight: 700,
            height: 26,
            fontSize: "0.75rem",
            border: `1px solid ${mode === "dark" ? alpha(colors.line, 0.9) : colors.lineSoft}`,
            backgroundColor: mode === "dark" ? colors.surfaceContainerHigh : colors.surfaceContainerHigh,
            color: colors.text,
          },
          filled: {
            backgroundColor: mode === "dark" ? colors.surfaceContainerHigh : colors.surfaceContainerHigh,
          },
          outlined: {
            backgroundColor: "transparent",
            borderColor: colors.line,
          },
          colorPrimary: {
            backgroundColor: alpha(colors.primary, mode === "dark" ? 0.22 : 0.12),
            color: mode === "dark" ? colors.primaryOnSoft : colors.primaryOnSoft,
            borderColor: alpha(colors.primary, mode === "dark" ? 0.35 : 0.18),
          },
          colorSuccess: {
            backgroundColor: alpha(colors.success, mode === "dark" ? 0.22 : 0.12),
            color: mode === "dark" ? colors.successOnSoft : colors.successOnSoft,
            borderColor: alpha(colors.success, mode === "dark" ? 0.35 : 0.18),
          },
          colorWarning: {
            backgroundColor: alpha(colors.warning, mode === "dark" ? 0.22 : 0.12),
            color: mode === "dark" ? colors.warningOnSoft : colors.warningOnSoft,
            borderColor: alpha(colors.warning, mode === "dark" ? 0.35 : 0.18),
          },
          colorError: {
            backgroundColor: alpha(colors.danger, mode === "dark" ? 0.22 : 0.12),
            color: mode === "dark" ? colors.dangerOnSoft : colors.dangerOnSoft,
            borderColor: alpha(colors.danger, mode === "dark" ? 0.35 : 0.18),
          },
          colorInfo: {
            backgroundColor: alpha(colors.info, mode === "dark" ? 0.22 : 0.12),
            color: mode === "dark" ? colors.infoOnSoft : colors.infoOnSoft,
            borderColor: alpha(colors.info, mode === "dark" ? 0.35 : 0.18),
          },
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
            borderBottom: `1px solid ${colors.lineSoft}`,
            fontSize: "0.8125rem",
            padding: "10px 12px",
          },
          head: {
            backgroundColor: colors.surfaceMuted,
            color: colors.textMuted,
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
            "&:hover": { backgroundColor: colors.surfaceMuted },
          },
        },
      },
      MuiTooltip: {
        defaultProps: { arrow: false },
        styleOverrides: {
          tooltip: {
            backgroundColor: colors.text,
            color: colors.paper,
            fontSize: "0.75rem",
            fontWeight: 500,
            padding: "6px 8px",
            borderRadius: sharedTokens.radius.sm,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 14,
            border: `1px solid ${colors.line}`,
            backgroundImage: "none",
            backgroundColor: colors.paper,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: colors.paper,
            borderColor: colors.line,
            backgroundImage: "none",
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 36 },
          indicator: {
            backgroundColor: colors.primary,
            height: 3,
            borderRadius: 999,
          },
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
            color: colors.textMuted,
            "&.Mui-selected": { color: colors.primary },
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
            backgroundColor: colors.line,
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
              color: colors.paper,
              "& + .MuiSwitch-track": { backgroundColor: colors.primary, opacity: 1 },
            },
          },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            color: colors.line,
            padding: 6,
            "&.Mui-checked": { color: colors.primary },
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: colors.lineSoft },
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
            borderRadius: sharedTokens.radius.sm,
            "&.Mui-selected": {
              backgroundColor: alpha(colors.primary, mode === "dark" ? 0.18 : 0.08),
              color: colors.primary,
              "& .MuiListItemIcon-root": { color: colors.primary },
              "&:hover": {
                backgroundColor: alpha(colors.primary, mode === "dark" ? 0.24 : 0.12),
              },
            },
          },
        },
      },
      MuiAlert: {
        defaultProps: { variant: "outlined" },
        styleOverrides: {
          root: {
            borderRadius: sharedTokens.radius.sm,
            fontSize: "0.8125rem",
          },
          colorError: {
            backgroundColor: mode === "dark" ? alpha(colors.danger, 0.12) : "#fef2f2",
            color: mode === "dark" ? colors.dangerOnSoft : "#991b1b",
            borderColor: alpha(colors.danger, mode === "dark" ? 0.28 : 0.18),
          },
          colorSuccess: {
            backgroundColor: mode === "dark" ? alpha(colors.success, 0.12) : "#f0fdf4",
            color: mode === "dark" ? colors.successOnSoft : "#166534",
            borderColor: alpha(colors.success, mode === "dark" ? 0.28 : 0.18),
          },
          colorWarning: {
            backgroundColor: mode === "dark" ? alpha(colors.warning, 0.12) : "#fffbeb",
            color: mode === "dark" ? colors.warningOnSoft : "#92400e",
            borderColor: alpha(colors.warning, mode === "dark" ? 0.28 : 0.18),
          },
          colorInfo: {
            backgroundColor: mode === "dark" ? alpha(colors.info, 0.12) : "#eff6ff",
            color: mode === "dark" ? colors.infoOnSoft : "#1e40af",
            borderColor: alpha(colors.info, mode === "dark" ? 0.28 : 0.18),
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: "default" },
        styleOverrides: {
          root: {
            backgroundColor: colors.paper,
            backgroundImage: "none",
            borderBottom: `1px solid ${colors.line}`,
            color: colors.text,
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { height: 6, borderRadius: sharedTokens.radius.pill, backgroundColor: colors.surface },
          bar: { backgroundColor: colors.primary, borderRadius: sharedTokens.radius.pill },
        },
      },
      MuiCircularProgress: {
        styleOverrides: {
          root: { color: colors.primary },
        },
      },
    },
  };
};

export function createAppTheme(mode: ThemeMode = "light") {
  return createTheme(buildThemeOptions(mode));
}

const theme = createAppTheme("light");

export default theme;
