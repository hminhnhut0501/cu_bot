"use client";

import {
  Box,
  Button as MuiButton,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { CalendarClock, Eye, Plus, Save, Send, Trash2, X } from "lucide-react";
import type { ChangeEvent } from "react";

export type ChannelComposerDraft = {
  id?: string | number;
  bot_key?: string;
  target_chat_id?: string;
  title?: string;
  content?: string;
  scheduled_at?: string;
  delete_at?: string;
  disable_web_page_preview?: boolean;
};

export type ChannelButtonDraft = { label: string; url: string; row: number };

export type ChannelComposerProps = {
  open: boolean;
  composer: ChannelComposerDraft;
  setComposer: (updater: (current: ChannelComposerDraft) => ChannelComposerDraft) => void;
  buttons: ChannelButtonDraft[];
  setButtons: (updater: (current: ChannelButtonDraft[]) => ChannelButtonDraft[]) => void;
  updateButton: (index: number, values: Partial<ChannelButtonDraft>) => void;
  bots: Array<{ bot_key?: string; id?: string | number; name?: string }>;
  groups: Array<{ bot_key?: string; group_id?: string; chat_id?: string; id?: string | number; group_name?: string }>;
  selectedBot: string;
  saving: boolean;
  onClose: () => void;
  saveDraft: () => void;
  schedulePost: () => void;
  sendNow: () => void;
};

export default function ChannelComposer(props: ChannelComposerProps) {
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
        placeItems: "center",
        p: 2,
        overflow: "auto",
      }}
    >
      <Paper
        variant="outlined"
        role="dialog"
        aria-label="Soạn bài đăng channel"
        onClick={(event) => event.stopPropagation()}
        sx={{ width: "100%", maxWidth: 1100, maxHeight: "95vh", overflow: "auto", p: 0, bgcolor: "background.paper" }}
      >
        <Stack spacing={0}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ p: 2, alignItems: "flex-start", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider" }}
          >
            <Box>
              <Typography variant="overline" color="primary">Đăng channel · Giờ Việt Nam GMT+7</Typography>
              <Typography variant="h6">{props.composer.id ? "Sửa bài đăng" : "Soạn bài mới"}</Typography>
            </Box>
            <IconButton size="small" onClick={props.onClose}>
              <X size={18} />
            </IconButton>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              p: 2,
              gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.4fr) minmax(0, 1fr)" },
            }}
          >
            <Stack spacing={1.5}>
              <TextField
                select
                label="Gửi bằng bot"
                size="small"
                value={props.composer.bot_key || props.selectedBot || "main"}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  props.setComposer((current) => ({ ...current, bot_key: event.target.value }))
                }
              >
                {props.bots.map((bot) => (
                  <MenuItem key={bot.bot_key || bot.id} value={bot.bot_key}>
                    {bot.name || bot.bot_key}
                  </MenuItem>
                ))}
                {!props.bots.length ? <MenuItem value="main">main</MenuItem> : null}
              </TextField>

              <TextField
                select
                label="Channel/Group nhận bài"
                size="small"
                value={props.composer.target_chat_id || ""}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  props.setComposer((current) => ({ ...current, target_chat_id: event.target.value }))
                }
              >
                <MenuItem value="">Chọn channel/group</MenuItem>
                {props.groups
                  .filter((group) => !props.composer.bot_key || !group.bot_key || group.bot_key === props.composer.bot_key)
                  .map((group) => {
                    const groupId = group.group_id || group.chat_id || "";
                    return (
                      <MenuItem key={groupId || group.id} value={groupId}>
                        {group.group_name || groupId}
                      </MenuItem>
                    );
                  })}
              </TextField>

              <TextField
                label="Tên nội bộ"
                size="small"
                value={props.composer.title || ""}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  props.setComposer((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Ví dụ: Xác nhận tham gia"
              />

              <TextField
                multiline
                minRows={9}
                label="Nội dung bài đăng"
                value={props.composer.content || ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  props.setComposer((current) => ({ ...current, content: event.target.value }))
                }
                placeholder="Soạn nội dung sẽ hiển thị trên Telegram..."
              />

              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="subtitle2">Nút inline</Typography>
                  <MuiButton
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      props.setButtons((current) => [
                        ...current,
                        {
                          label: "",
                          url: "",
                          row: current.length ? Math.max(...current.map((button) => button.row)) + 1 : 0,
                        },
                      ])
                    }
                    startIcon={<Plus size={14} />}
                  >
                    Thêm nút
                  </MuiButton>
                </Stack>
                <Stack spacing={1}>
                  {props.buttons.map((button, index) => (
                    <Stack key={`${index}-${button.row}`} direction={{ xs: "column", md: "row" }} spacing={1} sx={{ alignItems: { md: "center" } }}>
                      <TextField
                        size="small"
                        placeholder="Tên nút"
                        value={button.label}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          props.updateButton(index, { label: event.target.value })
                        }
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        size="small"
                        placeholder="https://..."
                        value={button.url}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          props.updateButton(index, { url: event.target.value })
                        }
                        sx={{ flex: 1.4 }}
                      />
                      <TextField
                        select
                        size="small"
                        value={button.row}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          props.updateButton(index, { row: Number(event.target.value) })
                        }
                        sx={{ width: 120 }}
                      >
                        {Array.from({ length: Math.max(props.buttons.length, 1) }, (_, row) => (
                          <MenuItem key={row} value={row}>Hàng {row + 1}</MenuItem>
                        ))}
                      </TextField>
                      <IconButton
                        size="small"
                        title="Xóa nút"
                        onClick={() =>
                          props.setButtons((current) => current.filter((_, buttonIndex) => buttonIndex !== index))
                        }
                      >
                        <Trash2 size={15} />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              </Paper>

              <Box
                sx={{
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                }}
              >
                <TextField
                  type="datetime-local"
                  label="Hẹn giờ gửi"
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={props.composer.scheduled_at || ""}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    props.setComposer((current) => ({ ...current, scheduled_at: event.target.value }))
                  }
                  helperText="Để trống nếu muốn gửi ngay. Thời gian được hiểu là giờ Việt Nam."
                />
                <TextField
                  type="datetime-local"
                  label="Tự động xóa bài"
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={props.composer.delete_at || ""}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    props.setComposer((current) => ({ ...current, delete_at: event.target.value }))
                  }
                  helperText="Để trống nếu muốn giữ bài trên Telegram."
                />
              </Box>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(props.composer.disable_web_page_preview)}
                    onChange={(event) =>
                      props.setComposer((current) => ({ ...current, disable_web_page_preview: event.target.checked }))
                    }
                  />
                }
                label="Ẩn preview đường dẫn"
              />
            </Stack>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Eye size={17} />
                  <Typography variant="subtitle1">Xem trước Telegram</Typography>
                </Stack>
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    p: 1.5,
                    bgcolor: "background.paper",
                  }}
                >
                  <Typography variant="subtitle2">{props.composer.title || "Bài đăng mới"}</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
                    {props.composer.content || "Nội dung bài đăng sẽ xuất hiện tại đây."}
                  </Typography>
                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    {Array.from(new Set(props.buttons.map((button) => button.row)))
                      .sort()
                      .map((row) => (
                        <Stack key={row} direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                          {props.buttons
                            .filter((button) => button.row === row && button.label)
                            .map((button, index) => (
                              <Box
                                key={`${row}-${index}`}
                                sx={{
                                  px: 1.25,
                                  py: 0.5,
                                  border: "1px solid",
                                  borderColor: "divider",
                                  borderRadius: 999,
                                  fontSize: 12,
                                }}
                              >
                                {button.label}
                              </Box>
                            ))}
                        </Stack>
                      ))}
                  </Stack>
                </Box>
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                    <Send size={14} />
                    <Typography variant="caption" color="text.secondary">
                      {props.composer.scheduled_at
                        ? `Gửi lúc ${props.composer.scheduled_at.replace("T", " ")} GMT+7`
                        : "Gửi ngay khi bấm nút"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                    <Trash2 size={14} />
                    <Typography variant="caption" color="text.secondary">
                      {props.composer.delete_at
                        ? `Xóa lúc ${props.composer.delete_at.replace("T", " ")} GMT+7`
                        : "Không tự xóa"}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Paper>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            sx={{ p: 2, justifyContent: "flex-end", borderTop: "1px solid", borderColor: "divider" }}
          >
            <MuiButton variant="text" disabled={props.saving} onClick={props.saveDraft} startIcon={<Save size={16} />}>
              Lưu nháp
            </MuiButton>
            <MuiButton
              variant="outlined"
              disabled={props.saving || !props.composer.scheduled_at}
              onClick={props.schedulePost}
              startIcon={<CalendarClock size={16} />}
            >
              Lên lịch đăng
            </MuiButton>
            <MuiButton
              variant="contained"
              disabled={props.saving}
              onClick={props.sendNow}
              startIcon={props.saving ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
            >
              Đăng ngay
            </MuiButton>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
