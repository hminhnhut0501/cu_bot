"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";

import { moduleAccents } from "@/app/theme";

export type StatCardProps = {
  /** Top label, e.g. "Bot hoạt động" */
  label: ReactNode;
  /** Main value (number, text, chip) */
  value: ReactNode;
  /** Optional caption below value */
  hint?: ReactNode;
  /** Optional icon rendered top-right or top-left */
  icon?: ReactNode;
  /** Color of the icon container */
  tone?: "primary" | "neutral" | "success" | "warning" | "danger" | "info" | "secondary" | "tertiary" | "main" | "content" | "security" | "scam" | "fun" | "analytics";
  /** Trend line ("+12 hôm nay", "-3 lỗi") */
  trend?: ReactNode;
  /** Compact mode reduces padding */
  compact?: boolean;
  /** Click handler — when set the card becomes a button */
  onClick?: () => void;
};

const TONE_BG: Record<NonNullable<StatCardProps["tone"]>, string> = {
  primary: "rgba(15, 118, 110, 0.08)",
  neutral: "rgba(15, 23, 42, 0.04)",
  success: "rgba(22, 163, 74, 0.10)",
  warning: "rgba(217, 119, 6, 0.10)",
  danger: "rgba(220, 38, 38, 0.10)",
  info: "rgba(37, 99, 235, 0.10)",
  secondary: moduleAccents.content.tint,
  tertiary: moduleAccents.fun.tint,
  main: moduleAccents.main.tint,
  content: moduleAccents.content.tint,
  security: moduleAccents.security.tint,
  scam: moduleAccents.scam.tint,
  fun: moduleAccents.fun.tint,
  analytics: moduleAccents.analytics.tint,
};

const TONE_COLOR: Record<NonNullable<StatCardProps["tone"]>, string> = {
  primary: "#0f766e",
  neutral: "#475569",
  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  info: "#2563eb",
  secondary: moduleAccents.content.color,
  tertiary: moduleAccents.fun.color,
  main: moduleAccents.main.color,
  content: moduleAccents.content.color,
  security: moduleAccents.security.color,
  scam: moduleAccents.scam.color,
  fun: moduleAccents.fun.color,
  analytics: moduleAccents.analytics.color,
};

/**
 * Compact numeric / status card. Replaces `.metric-card`, `.metric-group`,
 * `.status-card`, `.compact-value`, the `article` elements inside
 * `.overview-compact`, `.overview-work-grid`, and the inline `<span>` rows
 * inside `.audit-console-stats` / `.scam-inbox-stats`.
 */
export default function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  trend,
  compact = false,
  onClick,
}: StatCardProps) {
  const theme = useTheme();
  const toneBg = TONE_BG[tone];
  const toneColor = TONE_COLOR[tone];
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      sx={{
        p: compact ? 1.5 : 2,
        bgcolor: theme.palette.mode === "dark" ? alpha(toneColor, 0.08) : alpha(toneColor, 0.03),
        borderColor: alpha(toneColor, theme.palette.mode === "dark" ? 0.18 : 0.09),
        borderTopWidth: 1,
        borderTopStyle: "solid",
        borderTopColor: alpha(toneColor, theme.palette.mode === "dark" ? 0.34 : 0.22),
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease",
        "&:hover": onClick ? { borderColor: toneColor, boxShadow: 1, transform: "translateY(-1px)" } : undefined,
      }}
    >
      <Stack spacing={compact ? 0.5 : 1}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ lineHeight: 1.2, letterSpacing: "0.09em" }}
          >
            {label}
          </Typography>
          {icon ? (
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: 1,
                display: "grid",
                placeItems: "center",
                color: toneColor,
                backgroundColor: theme.palette.mode === "dark" ? alpha(toneColor, 0.16) : alpha(toneColor, 0.08),
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          ) : null}
        </Box>
        <Typography
          variant={compact ? "h6" : "h5"}
          sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1.1, letterSpacing: "-0.03em" }}
        >
          {value}
        </Typography>
        {hint ? (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        ) : null}
        {trend ? (
          <Typography variant="caption" sx={{ color: toneColor, fontWeight: 600 }}>
            {trend}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}
