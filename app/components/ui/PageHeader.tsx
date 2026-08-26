"use client";

import { alpha } from "@mui/material/styles";
import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

import { moduleAccents } from "@/app/theme";

export type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  /** Right-aligned actions (typically a row of buttons) */
  actions?: ReactNode;
  /** Slot for breadcrumbs above the title */
  breadcrumbs?: ReactNode;
  /** Optional decorative icon on the left */
  icon?: ReactNode;
  /** Sub-content rendered below the title row (e.g. tab bars, filter rows) */
  children?: ReactNode;
  /** Optional color tone for module-specific hero/header styling */
  tone?: keyof typeof moduleAccents;
};

/**
 * Top of a screen. Replaces `.topbar`, `.brand`, `.bot-context`,
 * `.bot-context-copy`, `.scope-bar`, `.scope-breadcrumb`,
 * `.scope-summary`.
 */
export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  breadcrumbs,
  icon,
  children,
  tone = "main",
}: PageHeaderProps) {
  const accent = moduleAccents[tone];
  return (
    <Box
      component="header"
      sx={{
        px: { xs: 1.5, md: 3 },
        py: { xs: 1.5, md: 2 },
        borderBottom: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        backgroundImage: `linear-gradient(135deg, ${alpha(accent.color, 0.08)}, ${alpha(accent.color, 0.02)} 42%, transparent 72%)`,
        backdropFilter: "saturate(140%) blur(8px)",
      }}
    >
      <Stack spacing={{ xs: 1.25, md: 1.5 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.25}
          sx={{
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
          }}
          component="div"
        >
        <Box sx={{ minWidth: 0, display: "flex", alignItems: "center", gap: 1.25 }}>
          {icon ? (
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1,
                display: "grid",
                placeItems: "center",
                backgroundColor: accent.tint,
                color: accent.color,
                border: `1px solid ${accent.line}`,
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          ) : null}
          <Box sx={{ minWidth: 0 }}>
            {breadcrumbs ? (
              <Box sx={{ mb: 0.25, color: "text.secondary", fontSize: "0.75rem" }}>
                {breadcrumbs}
              </Box>
            ) : null}
            {eyebrow ? (
              <Typography
                variant="overline"
                sx={{ color: accent.color, display: "block", lineHeight: 1.2, letterSpacing: "0.10em" }}
              >
                {eyebrow}
              </Typography>
            ) : null}
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, lineHeight: 1.18, fontSize: { xs: "1.15rem", sm: "1.35rem", md: "1.5rem" } }}
              noWrap
            >
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, maxWidth: 760 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        </Box>
        {actions ? (
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", flexShrink: 0, flexWrap: "wrap", justifyContent: { xs: "flex-start", sm: "flex-end" }, width: { xs: "100%", sm: "auto" } }}
            component="div"
          >
            {actions}
          </Stack>
        ) : null}
        </Stack>
        {children}
      </Stack>
    </Box>
  );
}
