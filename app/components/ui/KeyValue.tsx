"use client";

import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

export type KeyValueProps = {
  /** Bold label */
  label: ReactNode;
  /** Value text or any node (e.g. a Chip) */
  value: ReactNode;
  /** Optional helper line under value */
  hint?: ReactNode;
  /** Stacked (label on top of value) vs inline (label : value) */
  layout?: "stacked" | "inline";
  /** Highlight the value */
  emphasis?: boolean;
  /** Force mono font for the value (good for IDs, raw json) */
  mono?: boolean;
  sx?: object;
};

/**
 * A single labelled field row.
 *
 * Replaces the recurring `<div><b>label</b>value</div>` pattern in:
 * - `.inspector-grid span`
 * - `.setting-tile`
 * - `.config-section`
 * - `.meta-grid`
 * - `.diagnostic-grid span`
 */
export default function KeyValue({
  label,
  value,
  hint,
  layout = "stacked",
  emphasis = false,
  mono = false,
  sx,
}: KeyValueProps) {
  if (layout === "inline") {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "baseline",
          gap: 1,
          minWidth: 0,
          ...sx,
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: 500, flexShrink: 0 }}
        >
          {label}:
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: emphasis ? "primary.main" : "text.primary",
            fontFamily: mono ? "ui-monospace, monospace" : undefined,
            fontWeight: emphasis ? 600 : 400,
            wordBreak: "break-word",
            minWidth: 0,
          }}
        >
          {value}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 0, ...sx }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          mt: 0.25,
          color: emphasis ? "primary.main" : "text.primary",
          fontFamily: mono ? "ui-monospace, monospace" : undefined,
          fontWeight: emphasis ? 600 : 500,
          wordBreak: "break-word",
        }}
      >
        {value}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.25 }}>
          {hint}
        </Typography>
      ) : null}
    </Box>
  );
}
