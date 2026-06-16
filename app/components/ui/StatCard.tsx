"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

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
  tone?: "primary" | "neutral" | "success" | "warning" | "danger" | "info";
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
};

const TONE_COLOR: Record<NonNullable<StatCardProps["tone"]>, string> = {
  primary: "#0f766e",
  neutral: "#475569",
  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  info: "#2563eb",
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
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      sx={{
        p: compact ? 1.5 : 2,
        bgcolor: "background.paper",
        borderColor: "divider",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 120ms ease, box-shadow 120ms ease",
        "&:hover": onClick ? { borderColor: "primary.main", boxShadow: 1 } : undefined,
      }}
    >
      <Stack spacing={compact ? 0.5 : 1}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ lineHeight: 1.2 }}
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
                color: TONE_COLOR[tone],
                backgroundColor: TONE_BG[tone],
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          ) : null}
        </Box>
        <Typography
          variant={compact ? "h6" : "h5"}
          sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.2 }}
        >
          {value}
        </Typography>
        {hint ? (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        ) : null}
        {trend ? (
          <Typography variant="caption" sx={{ color: TONE_COLOR[tone], fontWeight: 600 }}>
            {trend}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}
