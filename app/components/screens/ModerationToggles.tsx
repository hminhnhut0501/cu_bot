"use client";

import { Box, MenuItem, Paper, Stack, Switch, TextField, Typography } from "@mui/material";
import { Wrench } from "lucide-react";

import Section from "@/app/components/ui/Section";

export type ModerationTogglesProps = {
  scanTextLink: boolean;
  scanTextMention: boolean;
  allowInGroupMentions: boolean;
  hiddenLinkAction: string;
  toggleScanTextLink: () => void;
  toggleScanTextMention: () => void;
  toggleAllowInGroupMentions: () => void;
  changeHiddenLinkAction: (value: string) => void;
};

export default function ModerationToggles(props: ModerationTogglesProps) {
  return (
    <Section
      eyebrow="Cài đặt kiểm duyệt tự động"
      title="Quét link ẩn và mention"
      tone="security"
      icon={<Wrench size={20} />}
    >
      <Stack
        spacing={1.5}
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
        }}
      >
        <ToggleRow
          label="Chặn text_link"
          checked={props.scanTextLink}
          onToggle={props.toggleScanTextLink}
        />
        <ToggleRow
          label="Chặn text_mention"
          checked={props.scanTextMention}
          onToggle={props.toggleScanTextMention}
        />
        <ToggleRow
          label="Cho phép @user trong group"
          checked={props.allowInGroupMentions}
          onToggle={props.toggleAllowInGroupMentions}
        />
        <TextField
          select
          size="small"
          label="Cách xử lý"
          value={props.hiddenLinkAction}
          slotProps={{
            select: {
              MenuProps: {
                disablePortal: true,
                slotProps: {
                  paper: {
                    sx: { maxHeight: 320, zIndex: 2000 },
                  },
                },
              },
            },
          }}
          onChange={(event) => props.changeHiddenLinkAction(event.target.value)}
        >
          <MenuItem value="warn">Warn</MenuItem>
          <MenuItem value="delete">Delete</MenuItem>
          <MenuItem value="restrict">Restrict</MenuItem>
          <MenuItem value="ban">Ban</MenuItem>
        </TextField>
      </Stack>
    </Section>
  );
}

function ToggleRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.paper" }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="body2">{label}</Typography>
        <Switch checked={checked} onChange={onToggle} />
      </Stack>
    </Paper>
  );
}
