"use client";

import {
  Alert,
  Box,
  Button as MuiButton,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  CalendarClock,
  Clock3,
  Edit3,
  RotateCcw,
  Send,
  Trash2,
  X,
} from "lucide-react";
import type { ChannelPostTab, Row } from "@/lib/cp-types";
import { formatDateTime } from "@/lib/cp-helpers";

export type ChannelPublisherConsoleProps = {
  visibleRows: Row[];
  channelPostTabFor: (row: Row) => ChannelPostTab;
  channelTab: ChannelPostTab;
  setChannelTab: (tab: ChannelPostTab) => void;
  channelPageRows: Row[];
  healthState: (row: Row, tableKey?: string) => { label: string; tone?: string };
  saving: boolean;
  channelPostAction: (row: Row, action: string) => Promise<void>;
  openChannelComposer: (row?: Row) => void;
  scheduleChannelDelete: (row: Row) => void | Promise<void>;
  channelPageCount: number;
  channelPage: number;
  setChannelPage: React.Dispatch<React.SetStateAction<number>>;
};

export default function ChannelPublisherConsole({
  visibleRows,
  channelPostTabFor,
  channelTab,
  setChannelTab,
  channelPageRows,
  healthState,
  saving,
  channelPostAction,
  openChannelComposer,
  scheduleChannelDelete,
  channelPageCount,
  channelPage,
  setChannelPage,
}: ChannelPublisherConsoleProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", lg: "center" } }}>
          <Box>
            <Typography variant="overline" color="text.secondary">Channel publisher · Giờ Việt Nam GMT+7</Typography>
            <Typography variant="h5">Đăng bài và theo dõi tiến trình</Typography>
            <Typography variant="body2" color="text.secondary">Admin chỉ cần soạn nội dung, chọn nơi nhận và bấm gửi. Trạng thái kỹ thuật được bot tự quản lý.</Typography>
          </Box>
          <MuiButton variant="contained" startIcon={<Send size={17} />} onClick={() => openChannelComposer()}>
            Đăng bài mới
          </MuiButton>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          {([
            ["queue", "Chờ gửi", Clock3],
            ["scheduled", "Đã lên lịch", CalendarClock],
            ["sent", "Đã gửi", Send],
            ["deleted", "Đã xóa", Trash2],
            ["failed", "Lỗi", X]
          ] as [ChannelPostTab, string, typeof Send][]).map(([key, label, Icon]) => {
            const count = visibleRows.filter((row) => channelPostTabFor(row) === key).length;
            return (
              <MuiButton key={key} variant={channelTab === key ? "contained" : "outlined"} onClick={() => setChannelTab(key)} startIcon={<Icon size={16} />}>
                {label} ({count})
              </MuiButton>
            );
          })}
        </Stack>
        <Stack spacing={1.25}>
          {channelPageRows.map((row) => {
            const status = healthState(row, "channel_posts");
            return (
              <Paper key={row.id} variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2, alignItems: "flex-start" }}>
                    <Box>
                      <Typography variant="subtitle1">{row.title || "Bài đăng không tiêu đề"}</Typography>
                      <Typography variant="body2" color="text.secondary">{row.target_chat_id}</Typography>
                    </Box>
                    <Chip size="small" color="default" label={status.label} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{row.content}</Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                    {row.scheduled_at ? <Chip size="small" variant="outlined" label={`Gửi: ${formatDateTime(row.scheduled_at)}`} /> : null}
                    {row.sent_at ? <Chip size="small" variant="outlined" label={`Đã gửi: ${formatDateTime(row.sent_at)}`} /> : null}
                    {row.delete_at && !row.deleted_at ? <Chip size="small" variant="outlined" label={`Xóa: ${formatDateTime(row.delete_at)}`} /> : null}
                    {row.deleted_at ? <Chip size="small" variant="outlined" label={`Đã xóa: ${formatDateTime(row.deleted_at)}`} /> : null}
                    {row.attempt_count ? <Chip size="small" variant="outlined" label={`${row.attempt_count} lần thử`} /> : null}
                  </Stack>
                  {row.error ? <Alert severity="error">{row.error_code || "telegram_error"}: {row.error}</Alert> : null}
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                    {["draft", "cancelled"].includes(String(row.status || "draft")) ? (
                      <>
                        <MuiButton variant="contained" disabled={saving} onClick={() => channelPostAction(row, "send_now")} startIcon={<Send size={15} />}>Gửi ngay</MuiButton>
                        <MuiButton variant="outlined" onClick={() => openChannelComposer(row)} startIcon={<Edit3 size={15} />}>Sửa</MuiButton>
                      </>
                    ) : null}
                    {row.status === "scheduled" ? (
                      <>
                        <MuiButton variant="contained" disabled={saving} onClick={() => channelPostAction(row, "send_now")} startIcon={<Send size={15} />}>Gửi ngay</MuiButton>
                        <MuiButton variant="outlined" disabled={saving} onClick={() => channelPostAction(row, "cancel_schedule")} startIcon={<X size={15} />}>Hủy lịch</MuiButton>
                        <MuiButton variant="outlined" onClick={() => openChannelComposer(row)} startIcon={<Edit3 size={15} />}>Sửa lịch</MuiButton>
                      </>
                    ) : null}
                    {["sent", "delete_scheduled"].includes(String(row.status || "")) ? (
                      <>
                        <MuiButton color="error" variant="contained" disabled={saving} onClick={() => channelPostAction(row, "delete_now")} startIcon={<Trash2 size={15} />}>Xóa ngay</MuiButton>
                        {row.status === "delete_scheduled" ? (
                          <MuiButton variant="outlined" disabled={saving} onClick={() => channelPostAction(row, "cancel_delete")} startIcon={<X size={15} />}>Hủy lịch xóa</MuiButton>
                        ) : (
                          <MuiButton variant="outlined" disabled={saving} onClick={() => scheduleChannelDelete(row)} startIcon={<CalendarClock size={15} />}>Hẹn xóa</MuiButton>
                        )}
                      </>
                    ) : null}
                    {row.status === "failed" ? (
                      <>
                        <MuiButton variant="contained" disabled={saving} onClick={() => channelPostAction(row, "retry")} startIcon={<RotateCcw size={15} />}>Thử lại</MuiButton>
                        <MuiButton variant="outlined" onClick={() => openChannelComposer(row)} startIcon={<Edit3 size={15} />}>Sửa bài</MuiButton>
                      </>
                    ) : null}
                    {row.status === "delete_failed" ? (
                      <MuiButton variant="contained" disabled={saving} onClick={() => channelPostAction(row, "retry_delete")} startIcon={<RotateCcw size={15} />}>Thử xóa lại</MuiButton>
                    ) : null}
                    {row.status === "deleted" ? (
                      <MuiButton variant="outlined" onClick={() => openChannelComposer({ ...row, id: undefined, status: "draft", sent_message_id: "", sent_at: "", deleted_at: "", delete_at: "" })} startIcon={<RotateCcw size={15} />}>Đăng lại</MuiButton>
                    ) : null}
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
          {!channelPageRows.length ? (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Send size={28} />
                <Box>
                  <Typography variant="subtitle1">Chưa có bài trong mục này</Typography>
                  <Typography variant="body2" color="text.secondary">Bấm Đăng bài mới để soạn nội dung và gửi ngay hoặc hẹn giờ.</Typography>
                </Box>
              </Stack>
            </Paper>
          ) : null}
          {channelPageCount > 1 ? (
            <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <MuiButton variant="outlined" disabled={channelPage <= 1} onClick={() => setChannelPage((page) => page - 1)}>Trang trước</MuiButton>
              <Typography variant="body2" color="text.secondary">Trang {channelPage}/{channelPageCount}</Typography>
              <MuiButton variant="outlined" disabled={channelPage >= channelPageCount} onClick={() => setChannelPage((page) => page + 1)}>Trang sau</MuiButton>
            </Stack>
          ) : null}
        </Stack>
      </Stack>
    </Paper>
  );
}
