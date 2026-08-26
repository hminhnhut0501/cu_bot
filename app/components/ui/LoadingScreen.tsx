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
        backgroundImage: "radial-gradient(circle at top, rgba(15, 118, 110, 0.08), transparent 38%), linear-gradient(180deg, rgba(255,255,255,0.9), transparent 100%)",
        color: "text.secondary",
      }}
    >
      <Stack spacing={1.5} sx={{ alignItems: "center" }} component="div">
        <CircularProgress size={30} thickness={4} />
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700, letterSpacing: "-0.01em" }}>
          {label}
        </Typography>
        {hint ? (
          <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 360, textAlign: "center", lineHeight: 1.65 }}>
            {hint}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}
