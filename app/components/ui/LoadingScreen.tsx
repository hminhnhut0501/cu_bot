"use client";

import { Box, CircularProgress, Stack, Typography } from "@mui/material";

export type LoadingScreenProps = {
  /** Heading text (default "Đang tải…") */
  label?: string;
  /** Optional helper line under the spinner */
  hint?: string;
  /** Cover the full viewport (default true) */
  fullPage?: boolean;
};

/**
 * Full-screen or in-section loading indicator.
 * Replaces `.loading` (which used `min-height: 100vh`).
 */
export default function LoadingScreen({
  label = "Đang tải…",
  hint,
  fullPage = true,
}: LoadingScreenProps) {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        minHeight: fullPage ? "100vh" : 240,
        display: "grid",
        placeItems: "center",
        backgroundColor: "background.default",
        color: "text.secondary",
      }}
    >
      <Stack spacing={1.5} sx={{ alignItems: "center" }} component="div">
        <CircularProgress size={28} thickness={4} />
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        {hint ? (
          <Typography variant="caption" color="text.disabled">
            {hint}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}
