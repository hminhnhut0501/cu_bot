"use client";

import { Box, Button as MuiButton, InputAdornment, Paper, Stack, TextField, Typography } from "@mui/material";
import { Search } from "lucide-react";
import type { ChangeEvent, ReactNode } from "react";

export type CommandItem = {
  title: string;
  hint: string;
  action: () => void;
};

export type CommandPaletteProps = {
  open: boolean;
  search: string;
  setSearch: (value: string) => void;
  items: CommandItem[];
  onClose: () => void;
  onRun: (action: () => void) => void;
};

export default function CommandPalette(props: CommandPaletteProps) {
  if (!props.open) return null;
  return (
    <Box
      onClick={props.onClose}
      sx={{
        position: "fixed",
        inset: 0,
        bgcolor: "rgba(15, 23, 42, 0.45)",
        zIndex: 1300,
        display: "grid",
        placeItems: "start center",
        p: { xs: 2, md: 6 },
        overflow: "auto",
      }}
    >
      <Paper
        onClick={(event) => event.stopPropagation()}
        sx={{ width: "100%", maxWidth: 640, bgcolor: "background.paper", overflow: "hidden" }}
        variant="outlined"
      >
        <Stack spacing={0}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ p: 1.5, alignItems: "center", borderBottom: "1px solid", borderColor: "divider" }}
          >
            <Search size={18} />
            <TextField
              variant="standard"
              fullWidth
              autoFocus
              value={props.search}
              onChange={(event: ChangeEvent<HTMLInputElement>) => props.setSearch(event.target.value)}
              placeholder="Gõ command: bật anti spam, mở logs, áp dụng preset..."
              slotProps={{ input: { disableUnderline: true } }}
            />
            <Typography variant="caption" color="text.secondary">⌘K</Typography>
          </Stack>

          <Box sx={{ maxHeight: 480, overflow: "auto", p: 1 }}>
            {props.items.length ? (
              <Stack spacing={0.5}>
                {props.items.map((item) => (
                  <MuiButton
                    key={item.title}
                    onClick={() => props.onRun(item.action)}
                    sx={{ justifyContent: "flex-start", alignItems: "flex-start", textAlign: "left", py: 1 }}
                  >
                    <Stack spacing={0.25} sx={{ alignItems: "flex-start" }}>
                      <Typography variant="subtitle2">{item.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.hint}</Typography>
                    </Stack>
                  </MuiButton>
                ))}
              </Stack>
            ) : (
              <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
                <Typography variant="body2">Không tìm thấy command.</Typography>
              </Box>
            )}
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
