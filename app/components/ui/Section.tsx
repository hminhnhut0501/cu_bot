"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

import { tokens } from "@/app/theme";

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
  children: ReactNode;
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
}: SectionProps) {
  return (
    <Paper
      id={id}
      component="section"
      variant="outlined"
      sx={{
        p: padding,
        bgcolor: subtle ? "background.default" : "background.paper",
        borderColor: "divider",
        borderRadius: `${tokens.radius.md}px`,
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
            <Box sx={{ minWidth: 0 }}>
              {eyebrow ? (
                <Typography
                  variant="overline"
                  color="primary"
                  sx={{ display: "block", mb: 0.25 }}
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
            {actions ? <Box sx={{ flexShrink: 0 }}>{actions}</Box> : null}
          </Box>
        )}
        {children}
      </Stack>
    </Paper>
  );
}
