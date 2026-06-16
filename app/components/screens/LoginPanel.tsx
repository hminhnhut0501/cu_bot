"use client";

import { Box, Button as MuiButton, Paper, Stack, TextField, Typography } from "@mui/material";
import { Check, Database } from "lucide-react";
import type { FormEvent } from "react";

export type LoginPanelProps = {
  password: string;
  setPassword: (value: string) => void;
  unlock: (event: FormEvent) => void;
};

export default function LoginPanel({ password, setPassword, unlock }: LoginPanelProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Paper
        variant="outlined"
        component="form"
        onSubmit={unlock}
        sx={{ p: 4, maxWidth: 420, width: "100%", textAlign: "center", bgcolor: "background.paper" }}
      >
        <Stack spacing={2} sx={{ alignItems: "center" }}>
          <Box sx={{ color: "primary.main" }}>
            <Database size={32} />
          </Box>
          <Typography variant="h5">Cu Bot CP</Typography>
          <Typography variant="body2" color="text.secondary">
            Nhập mật khẩu admin đã cấu hình trong Vercel.
          </Typography>
          <TextField
            type="password"
            fullWidth
            size="small"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="CP_ADMIN_PASSWORD"
            autoFocus
          />
          <MuiButton
            type="submit"
            variant="contained"
            fullWidth
            startIcon={<Check size={17} />}
          >
            Đăng nhập
          </MuiButton>
        </Stack>
      </Paper>
    </Box>
  );
}
