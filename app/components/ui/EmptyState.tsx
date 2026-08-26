"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export type EmptyStateProps = {
  title: string;
  body?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  /** Bullet points or step list rendered under the body */
  steps?: string[];
};

/**
 * Generic empty-state placeholder. Replaces `.empty-state`,
 * `.command-empty`, `.workbench-empty`, `.metrics-empty`,
 * `.overview-log-empty`, `.module-empty-focus`.
 */
export default function EmptyState({
  title,
  body,
  icon,
  actionLabel,
  onAction,
  steps,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        textAlign: "center",
        py: 5.5,
        px: 3,
        color: "text.secondary",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          backgroundColor: "background.paper",
          color: "primary.main",
          border: "1px solid",
          borderColor: "divider",
          backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(15, 118, 110, 0.03))",
          boxShadow: "0 10px 28px rgba(15, 23, 42, 0.05)",
        }}
      >
        {icon ?? <Inbox size={21} />}
      </Box>
      <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 800, letterSpacing: "-0.025em" }}>
        {title}
      </Typography>
      {body ? (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, lineHeight: 1.7 }}>
          {body}
        </Typography>
      ) : null}
      {steps && steps.length > 0 ? (
        <Stack
          component="ol"
          spacing={0.5}
          sx={{
            listStyle: "none",
            p: 0,
            m: 0,
            mt: 1,
            textAlign: "left",
            counterReset: "empty-step",
            "& li": {
              counterIncrement: "empty-step",
              fontSize: "0.8125rem",
              color: "text.secondary",
              pl: 3,
              position: "relative",
              lineHeight: 1.6,
            },
            "& li::before": {
              content: 'counter(empty-step) ". "',
              position: "absolute",
              left: 0,
              color: "text.disabled",
              fontWeight: 600,
            },
          }}
        >
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </Stack>
      ) : null}
      {actionLabel && onAction ? (
        <Button variant="outlined" size="small" onClick={onAction} sx={{ mt: 1, borderRadius: 999, px: 1.75, textTransform: "none", fontWeight: 700 }}>
          {actionLabel}
        </Button>
      ) : null}
    </Box>
  );
}
