"use client";

import { Alert, AlertTitle, Box } from "@mui/material";
import { XCircle } from "lucide-react";
import type { ReactNode } from "react";

export type ErrorAlertProps = {
  title?: ReactNode;
  message?: ReactNode;
  action?: ReactNode;
  filled?: boolean;
  icon?: ReactNode;
  sx?: object;
};

/**
 * Inline error banner. Replaces `.alert`, `.advanced-warning`,
 * `.context-alert` when used in error state.
 */
export default function ErrorAlert({
  title,
  message,
  action,
  filled,
  icon,
  sx,
}: ErrorAlertProps) {
  return (
    <Alert
      severity="error"
      variant={filled ? "filled" : "outlined"}
      icon={icon ?? <XCircle size={18} />}
      action={action}
      sx={sx}
    >
      {title ? <AlertTitle sx={{ fontSize: "0.8125rem", mb: 0.25 }}>{title}</AlertTitle> : null}
      {message ? (
        <Box component="span" sx={{ fontSize: "0.8125rem" }}>
          {message}
        </Box>
      ) : null}
    </Alert>
  );
}
