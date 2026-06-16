"use client";

import { Alert, AlertTitle, Box } from "@mui/material";
import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

export type SuccessAlertProps = {
  title?: ReactNode;
  message?: ReactNode;
  action?: ReactNode;
  filled?: boolean;
  icon?: ReactNode;
  sx?: object;
};

/**
 * Inline success banner. Replaces `.alert` (success variant),
 * `.floating-toast` (success state).
 */
export default function SuccessAlert({
  title,
  message,
  action,
  filled,
  icon,
  sx,
}: SuccessAlertProps) {
  return (
    <Alert
      severity="success"
      variant={filled ? "filled" : "outlined"}
      icon={icon ?? <CheckCircle2 size={18} />}
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
