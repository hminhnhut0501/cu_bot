"use client";

import { Box, Button as MuiButton, CircularProgress, MenuItem, Paper, Select, Stack, Switch, TextField, Typography } from "@mui/material";
import { Save, Sparkles } from "lucide-react";
import type { ChangeEvent } from "react";

import Section from "@/app/components/ui/Section";
import type { BulkRow, BulkDefaults } from "@/app/components/screens/types";

export type BulkPanelProps = {
  tableKey: string;
  bulkDefaults: BulkDefaults;
  updateBulkDefault: (key: keyof BulkDefaults, value: string | number | boolean) => void;
  bots: Array<{ bot_key?: string; id?: string | number; name?: string }>;
  bulkText: string;
  setBulkText: (value: string) => void;
  saving: boolean;
  parsedBulkRows: BulkRow[];
  saveBulk: () => void;
  bulkHint: (key: string) => string;
  titleFor: (row: BulkRow, table: { key: string }) => string;
  table: { key: string };
};

export default function BulkPanel(props: BulkPanelProps) {
  const { tableKey, bulkDefaults, updateBulkDefault, bots } = props;
  const isMessageOrVideo = ["messages", "video_messages"].includes(tableKey);
  const isKeywordLike = ["keywords", "domain_blacklist", "link_shorteners"].includes(tableKey);
  const isMatchSelector = ["keywords", "auto_replies"].includes(tableKey);
  const isDomain = tableKey === "domain_blacklist";
  const isScam = tableKey === "scam_entities";
  const isKeyword = tableKey === "keywords";

  return (
    <Section
      eyebrow="Nhập nhanh"
      title="Bulk import"
      subtitle={props.bulkHint(tableKey)}
      icon={<Sparkles size={20} />}
    >
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        <TextField
          select
          label="Bot"
          size="small"
          value={bulkDefaults.bot_key}
          onChange={(event: ChangeEvent<HTMLInputElement>) => updateBulkDefault("bot_key", event.target.value)}
        >
          {bots.map((bot) => (
            <MenuItem key={bot.bot_key || bot.id} value={bot.bot_key || ""}>
              {bot.name || bot.bot_key}
            </MenuItem>
          ))}
          {!bots.length ? <MenuItem value="main">main</MenuItem> : null}
        </TextField>

        {isMessageOrVideo ? (
          <>
            <TextField
              label="Nhóm nội dung"
              size="small"
              value={bulkDefaults.pool}
              onChange={(event: ChangeEvent<HTMLInputElement>) => updateBulkDefault("pool", event.target.value)}
              placeholder="Ví dụ: default, promo, rule"
            />
            <TextField
              label="Độ ưu tiên"
              type="number"
              size="small"
              value={bulkDefaults.weight}
              onChange={(event: ChangeEvent<HTMLInputElement>) => updateBulkDefault("weight", event.target.value)}
            />
          </>
        ) : null}

        {isKeywordLike ? (
          <TextField
            select
            label="Hành động mặc định"
            size="small"
            value={bulkDefaults.action}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateBulkDefault("action", event.target.value)}
          >
            <MenuItem value="delete">delete</MenuItem>
            <MenuItem value="warn">warn</MenuItem>
            <MenuItem value="mute">mute</MenuItem>
            <MenuItem value="kick">kick</MenuItem>
            <MenuItem value="ban">ban</MenuItem>
          </TextField>
        ) : null}

        {isMatchSelector ? (
          <TextField
            select
            label="Kiểu khớp"
            size="small"
            value={bulkDefaults.match}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateBulkDefault("match", event.target.value)}
          >
            {tableKey === "auto_replies" ? (
              <>
                <MenuItem value="smart">Smart (khuyên dùng)</MenuItem>
                <MenuItem value="exact">Trùng nguyên câu</MenuItem>
                <MenuItem value="contains">Có chứa cụm từ</MenuItem>
                <MenuItem value="regex">Nâng cao (regex)</MenuItem>
              </>
            ) : (
              <>
                <MenuItem value="contains">contains</MenuItem>
                <MenuItem value="regex">regex</MenuItem>
              </>
            )}
          </TextField>
        ) : null}

        {isKeyword || isScam ? (
          <TextField
            label="Lý do mặc định"
            size="small"
            value={bulkDefaults.reason}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateBulkDefault("reason", event.target.value)}
          />
        ) : null}

        {isDomain ? (
          <TextField
            select
            label="Loại rủi ro"
            size="small"
            value={bulkDefaults.risk}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateBulkDefault("risk", event.target.value)}
          >
            <MenuItem value="scam">scam</MenuItem>
            <MenuItem value="phishing">phishing</MenuItem>
            <MenuItem value="telegram_clone">telegram_clone</MenuItem>
            <MenuItem value="nsfw">nsfw</MenuItem>
          </TextField>
        ) : null}

        {isScam ? (
          <>
            <TextField
              select
              label="Mức rủi ro"
              size="small"
              value={bulkDefaults.risk_level}
              onChange={(event: ChangeEvent<HTMLInputElement>) => updateBulkDefault("risk_level", event.target.value)}
            >
              <MenuItem value="watch">watch</MenuItem>
              <MenuItem value="suspicious">suspicious</MenuItem>
              <MenuItem value="scam">scam</MenuItem>
              <MenuItem value="danger">danger</MenuItem>
            </TextField>
            <TextField
              select
              label="Trạng thái"
              size="small"
              value={bulkDefaults.status}
              onChange={(event: ChangeEvent<HTMLInputElement>) => updateBulkDefault("status", event.target.value)}
            >
              <MenuItem value="pending">pending</MenuItem>
              <MenuItem value="confirmed">confirmed</MenuItem>
              <MenuItem value="rejected">rejected</MenuItem>
            </TextField>
          </>
        ) : null}

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Switch
            checked={Boolean(bulkDefaults.enabled)}
            onChange={(event) => updateBulkDefault("enabled", event.target.checked)}
          />
          <Typography variant="body2">Bật sau khi nhập</Typography>
        </Stack>
      </Box>

      <TextField
        multiline
        minRows={6}
        value={props.bulkText}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => props.setBulkText(event.target.value)}
        placeholder={props.bulkHint(tableKey)}
        fullWidth
      />

      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <Typography variant="body2" color="text.secondary">
          Nhận diện được {props.parsedBulkRows.length} mục
        </Typography>
        <Stack direction="row" spacing={1}>
          <MuiButton variant="text" onClick={() => props.setBulkText("")}>
            Xóa nội dung
          </MuiButton>
          <MuiButton
            variant="contained"
            disabled={props.saving || !props.parsedBulkRows.length}
            onClick={props.saveBulk}
            startIcon={props.saving ? <CircularProgress size={16} color="inherit" /> : <Save size={17} />}
          >
            Lưu tất cả
          </MuiButton>
        </Stack>
      </Stack>

      {props.parsedBulkRows.length ? (
        <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
          <Stack spacing={0.5}>
            {props.parsedBulkRows.slice(0, 5).map((row, index) => (
              <Typography key={`${index}-${JSON.stringify(row)}`} variant="body2">
                {index + 1}. {props.titleFor(row, props.table)}
              </Typography>
            ))}
            {props.parsedBulkRows.length > 5 ? (
              <Typography variant="caption" color="text.secondary">
                ... và {props.parsedBulkRows.length - 5} mục khác
              </Typography>
            ) : null}
          </Stack>
        </Paper>
      ) : null}
    </Section>
  );
}
