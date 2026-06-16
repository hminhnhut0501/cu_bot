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
        py: 5,
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
          width: 44,
          height: 44,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          backgroundColor: "background.default",
          color: "text.secondary",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        {icon ?? <Inbox size={20} />}
      </Box>
      <Typography variant="subtitle2" color="text.primary">
        {title}
      </Typography>
      {body ? (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
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
        <Button variant="outlined" size="small" onClick={onAction} sx={{ mt: 1 }}>
          {actionLabel}
        </Button>
      ) : null}
    </Box>
  );
}
