"use client";

import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

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
}: PageHeaderProps) {
  return (
    <Box
      component="header"
      sx={{
        px: { xs: 2, md: 3 },
        py: 2,
        borderBottom: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
        }}
        component="div"
      >
        <Box sx={{ minWidth: 0, display: "flex", alignItems: "center", gap: 1.5 }}>
          {icon ? (
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1,
                display: "grid",
                placeItems: "center",
                backgroundColor: "rgba(15, 118, 110, 0.08)",
                color: "primary.main",
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
                color="primary"
                sx={{ display: "block", lineHeight: 1.2 }}
              >
                {eyebrow}
              </Typography>
            ) : null}
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, lineHeight: 1.2 }}
              noWrap
            >
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        </Box>
        {actions ? (
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}
            component="div"
          >
            {actions}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}
