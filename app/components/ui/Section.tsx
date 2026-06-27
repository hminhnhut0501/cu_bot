"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";

import { moduleAccents, tokens } from "@/app/theme";

export type SectionProps = {
  /** Section title rendered as `subtitle1` */
  title?: ReactNode;
  /** Short description rendered under the title in `body2 text.secondary` */
  subtitle?: ReactNode;
  /** Overline text (small uppercase) above the title */
  eyebrow?: ReactNode;
  /** Right-aligned buttons / chips / status */
  actions?: ReactNode;
  /** Body content */
  children?: ReactNode;
  /** Spacing between title row and body (default 2) */
  bodySpacing?: number;
  /** Outer padding (default 2) */
  padding?: number | string;
  /** Use `background.default` (subtle) instead of `paper` */
  subtle?: boolean;
  /** Custom sx override */
  sx?: object;
  /** Optional id for deep-linking */
  id?: string;
  /** Optional icon rendered next to the title */
  icon?: ReactNode;
  /** Optional color tone for the section header */
  tone?: keyof typeof moduleAccents;
};

/**
 * Clean-light wrapper for the legacy `<section className="audit-console">`,
 * `<section className="bulk-panel">`, `<section className="editor-panel">`,
 * `<section className="menu-policy-console">`, `<section className="config-center">`,
 * `<section className="scam-inbox">`, etc.
 *
 * - Replaces dozens of dark-`!important` selectors with a single Paper.
 * - Header row is two-column: title block on the left, `actions` on the
 *   right. Stacks vertically on small screens.
 * - `subtle` flips background to `background.default` for nested groups.
 */
export default function Section({
  title,
  subtitle,
  eyebrow,
  actions,
  children,
  bodySpacing = 2,
  padding = 2,
  subtle = false,
  sx,
  id,
  icon,
  tone = "main",
}: SectionProps) {
  const theme = useTheme();
  const accent = moduleAccents[tone];
  return (
    <Paper
      id={id}
      component="section"
      variant="outlined"
      sx={{
        p: padding,
        bgcolor: subtle ? "background.default" : "background.paper",
        borderColor: "divider",
        borderTop: `3px solid ${alpha(accent.color, theme.palette.mode === "dark" ? 0.72 : 0.64)}`,
        borderRadius: `${tokens.radius.md}px`,
        backgroundImage: subtle
          ? "none"
          : `linear-gradient(135deg, ${alpha(accent.color, theme.palette.mode === "dark" ? 0.12 : 0.05)}, transparent 48%)`,
        ...sx,
      }}
    >
      <Stack spacing={bodySpacing}>
        {(title || subtitle || eyebrow || actions) && (
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <Box sx={{ minWidth: 0, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              {icon ? (
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    display: "grid",
                    placeItems: "center",
                    color: accent.color,
                    backgroundColor: accent.tint,
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </Box>
              ) : null}
              <Box sx={{ minWidth: 0 }}>
                {eyebrow ? (
                  <Typography
                    variant="overline"
                    sx={{ display: "block", mb: 0.25, color: accent.color }}
                  >
                    {eyebrow}
                  </Typography>
                ) : null}
                {title ? (
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {title}
                  </Typography>
                ) : null}
                {subtitle ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    {subtitle}
                  </Typography>
                ) : null}
              </Box>
            </Box>
            {actions ? <Box sx={{ flexShrink: 0 }}>{actions}</Box> : null}
          </Box>
        )}
        {children}
      </Stack>
    </Paper>
  );
}
