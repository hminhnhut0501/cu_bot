"use client";

import { Stack, Typography } from "@mui/material";
import { AlertTriangle, Wrench } from "lucide-react";

import ErrorAlert from "@/app/components/ui/ErrorAlert";
import SuccessAlert from "@/app/components/ui/SuccessAlert";
import type { ToastState } from "@/app/components/screens/types";

export type BannersProps = {
  error: string | null;
  notice: string | null;
  toast: ToastState | null;
};

export default function Banners({ error, notice, toast }: BannersProps) {
  if (!error && !notice && !toast) return null;
  return (
    <Stack spacing={1}>
      {error ? <ErrorAlert title="Có lỗi xảy ra" message={error} /> : null}
      {notice ? <SuccessAlert title="Đã ghi nhận" message={notice} /> : null}
      {toast ? (
        toast.type === "success" ? (
          <SuccessAlert message={toast.message} />
        ) : toast.type === "error" ? (
          <ErrorAlert message={toast.message} />
        ) : (
          <ErrorAlert message={toast.message} />
        )
      ) : null}
    </Stack>
  );
}
