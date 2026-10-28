"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button as MuiButton,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Calendar,
  CalendarClock,
  Clock,
  Clock3,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  MessageSquare,
  Radio,
  RotateCcw,
  Send,
  Sparkles,
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

function getStatusStyle(tab: ChannelPostTab) {
  switch (tab) {
    case "queue":
      return { label: "Chờ gửi", color: "warning" as const, bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.25)" };
    case "scheduled":
      return { label: "Đã lên lịch", color: "primary" as const, bg: "rgba(37, 99, 235, 0.1)", border: "rgba(37, 99, 235, 0.25)" };
    case "sent":
      return { label: "Đã gửi", color: "success" as const, bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.25)" };
    case "failed":
      return { label: "Thất bại / Lỗi", color: "error" as const, bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.25)" };
    case "deleted":
    default:
      return { label: "Đã xóa", color: "default" as const, bg: "rgba(148, 163, 184, 0.1)", border: "rgba(148, 163, 184, 0.25)" };
  }
}

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
  const [selectedPostId, setSelectedPostId] = useState<string | number | null>(null);

  const selectedPost = useMemo(() => {
    return channelPageRows.find((r) => String(r.id) === String(selectedPostId)) || channelPageRows[0] || null;
  }, [channelPageRows, selectedPostId]);

  const tabConfigs: Array<[ChannelPostTab, string, typeof Send]> = [
    ["queue", "Chờ gửi", Clock3],
    ["scheduled", "Đã lên lịch", CalendarClock],
    ["sent", "Đã gửi", Send],
    ["failed", "Lỗi gửi", X],
    ["deleted", "Đã xóa", Trash2],
  ];

  // Parse inline buttons from post payload if any
  const parsedButtons = useMemo(() => {
    if (!selectedPost) return [];
    const raw = selectedPost.buttons || selectedPost.reply_markup?.inline_keyboard;
    if (Array.isArray(raw)) {
      if (raw.length > 0 && Array.isArray(raw[0])) {
        return raw.flat().map((b: any) => ({ label: b.text || b.label, url: b.url }));
      }
      return raw.map((b: any) => ({ label: b.label || b.text, url: b.url }));
    }
    return [];
  }, [selectedPost]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
      {/* Studio Header Banner */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: "background.paper",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", md: "center" },
          gap: 1.5,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(37, 99, 235, 0.12)",
              color: "primary.main",
            }}
          >
            <Radio size={20} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Xưởng Phát Sóng Kênh (Channel Publisher Studio)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Soạn thảo bài viết, lên lịch đăng tự động và xem trước thông điệp trên Telegram thời gian thực
            </Typography>
          </Box>
        </Stack>

        <MuiButton
          variant="contained"
          size="small"
          color="primary"
          startIcon={<Send size={15} />}
          onClick={() => openChannelComposer()}
          sx={{ textTransform: "none", borderRadius: 1.5, boxShadow: "none", fontWeight: 700 }}
        >
          Đăng bài mới
        </MuiButton>
      </Paper>

      {/* Status Filter Tabs Bar */}
      <Paper
        variant="outlined"
        sx={{
          p: 1.25,
          borderRadius: 2,
          bgcolor: "background.paper",
          display: "flex",
          alignItems: "center",
          gap: 1,
          overflowX: "auto",
        }}
      >
        {tabConfigs.map(([key, label, Icon]) => {
          const count = visibleRows.filter((row) => channelPostTabFor(row) === key).length;
          const active = channelTab === key;
          const style = getStatusStyle(key);

          return (
            <Chip
              key={key}
              icon={<Icon size={14} />}
              label={`${label} (${count})`}
              onClick={() => setChannelTab(key)}
              color={active ? style.color : "default"}
              variant={active ? "filled" : "outlined"}
              sx={{
                borderRadius: 1.5,
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                height: 32,
              }}
            />
          );
        })}
      </Paper>

      {/* Main Studio View: Post Queue (Left) & Telegram Live Preview (Right) */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.15fr 0.85fr" }, gap: 2.5, alignItems: "start" }}>
        {/* Left Column: Post Queue */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {channelPageRows.map((row) => {
            const active = String(selectedPost?.id) === String(row.id);
            const status = healthState(row, "channel_posts");
            const tabKey = channelPostTabFor(row);
            const style = getStatusStyle(tabKey);

            return (
              <Paper
                key={row.id}
                variant="outlined"
                onClick={() => setSelectedPostId(row.id)}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: active ? "rgba(37, 99, 235, 0.04)" : "background.paper",
                  border: "1px solid",
                  borderColor: active ? "primary.main" : "divider",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                  },
                }}
              >
                <Stack spacing={1.25}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 1.5 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: active ? "primary.main" : "text.primary" }} noWrap>
                        {row.title || "Bài đăng không tiêu đề"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        Kênh đích: <strong>{row.target_chat_id || "Chưa chọn kênh"}</strong> · Bot: <strong>{row.bot_key || "main"}</strong>
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      color={style.color}
                      label={status.label || style.label}
                      sx={{ fontWeight: 600, height: 22, borderRadius: 1 }}
                    />
                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      lineHeight: 1.6,
                    }}
                  >
                    {row.content || "Chưa có nội dung bài viết."}
                  </Typography>

                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", alignItems: "center" }}>
                    {row.scheduled_at ? (
                      <Chip
                        size="small"
                        variant="outlined"
                        icon={<Clock size={11} />}
                        label={`Gửi: ${formatDateTime(row.scheduled_at)}`}
                        sx={{ height: 20, fontSize: 11, borderRadius: 1 }}
                      />
                    ) : null}
                    {row.sent_at ? (
                      <Chip
                        size="small"
                        color="success"
                        variant="outlined"
                        label={`Đã gửi: ${formatDateTime(row.sent_at)}`}
                        sx={{ height: 20, fontSize: 11, borderRadius: 1 }}
                      />
                    ) : null}
                    {row.delete_at && !row.deleted_at ? (
                      <Chip
                        size="small"
                        color="warning"
                        variant="outlined"
                        label={`Tự xóa: ${formatDateTime(row.delete_at)}`}
                        sx={{ height: 20, fontSize: 11, borderRadius: 1 }}
                      />
                    ) : null}
                    {row.attempt_count ? (
                      <Chip size="small" variant="outlined" label={`${row.attempt_count} lần thử`} sx={{ height: 20, fontSize: 11 }} />
                    ) : null}
                  </Stack>

                  {row.error ? (
                    <Alert severity="error" sx={{ py: 0.25, borderRadius: 1 }}>
                      {row.error_code || "telegram_error"}: {row.error}
                    </Alert>
                  ) : null}

                  {/* Quick Command Actions */}
                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", pt: 0.5 }}>
                    {["draft", "cancelled"].includes(String(row.status || "draft")) ? (
                      <>
                        <MuiButton
                          size="small"
                          variant="contained"
                          disabled={saving}
                          onClick={(e) => {
                            e.stopPropagation();
                            channelPostAction(row, "send_now");
                          }}
                          startIcon={<Send size={13} />}
                          sx={{ textTransform: "none", height: 28, borderRadius: 1.5 }}
                        >
                          Gửi ngay
                        </MuiButton>
                        <MuiButton
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            openChannelComposer(row);
                          }}
                          startIcon={<Edit3 size={13} />}
                          sx={{ textTransform: "none", height: 28, borderRadius: 1.5 }}
                        >
                          Sửa
                        </MuiButton>
                      </>
                    ) : null}

                    {row.status === "scheduled" ? (
                      <>
                        <MuiButton
                          size="small"
                          variant="contained"
                          disabled={saving}
                          onClick={(e) => {
                            e.stopPropagation();
                            channelPostAction(row, "send_now");
                          }}
                          startIcon={<Send size={13} />}
                          sx={{ textTransform: "none", height: 28, borderRadius: 1.5 }}
                        >
                          Gửi ngay
                        </MuiButton>
                        <MuiButton
                          size="small"
                          variant="outlined"
                          disabled={saving}
                          onClick={(e) => {
                            e.stopPropagation();
                            channelPostAction(row, "cancel_schedule");
                          }}
                          startIcon={<X size={13} />}
                          sx={{ textTransform: "none", height: 28, borderRadius: 1.5 }}
                        >
                          Hủy lịch
                        </MuiButton>
                        <MuiButton
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            openChannelComposer(row);
                          }}
                          startIcon={<Edit3 size={13} />}
                          sx={{ textTransform: "none", height: 28, borderRadius: 1.5 }}
                        >
                          Sửa lịch
                        </MuiButton>
                      </>
                    ) : null}

                    {["sent", "delete_scheduled"].includes(String(row.status || "")) ? (
                      <>
                        <MuiButton
                          size="small"
                          color="error"
                          variant="contained"
                          disabled={saving}
                          onClick={(e) => {
                            e.stopPropagation();
                            channelPostAction(row, "delete_now");
                          }}
                          startIcon={<Trash2 size={13} />}
                          sx={{ textTransform: "none", height: 28, borderRadius: 1.5 }}
                        >
                          Xóa bài
                        </MuiButton>
                        {row.status === "delete_scheduled" ? (
                          <MuiButton
                            size="small"
                            variant="outlined"
                            disabled={saving}
                            onClick={(e) => {
                              e.stopPropagation();
                              channelPostAction(row, "cancel_delete");
                            }}
                            startIcon={<X size={13} />}
                            sx={{ textTransform: "none", height: 28, borderRadius: 1.5 }}
                          >
                            Hủy hẹn xóa
                          </MuiButton>
                        ) : (
                          <MuiButton
                            size="small"
                            variant="outlined"
                            disabled={saving}
                            onClick={(e) => {
                              e.stopPropagation();
                              scheduleChannelDelete(row);
                            }}
                            startIcon={<CalendarClock size={13} />}
                            sx={{ textTransform: "none", height: 28, borderRadius: 1.5 }}
                          >
                            Hẹn xóa
                          </MuiButton>
                        )}
                      </>
                    ) : null}

                    {row.status === "failed" ? (
                      <>
                        <MuiButton
                          size="small"
                          variant="contained"
                          disabled={saving}
                          onClick={(e) => {
                            e.stopPropagation();
                            channelPostAction(row, "retry");
                          }}
                          startIcon={<RotateCcw size={13} />}
                          sx={{ textTransform: "none", height: 28, borderRadius: 1.5 }}
                        >
                          Thử lại
                        </MuiButton>
                        <MuiButton
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            openChannelComposer(row);
                          }}
                          startIcon={<Edit3 size={13} />}
                          sx={{ textTransform: "none", height: 28, borderRadius: 1.5 }}
                        >
                          Sửa bài
                        </MuiButton>
                      </>
                    ) : null}

                    {row.status === "deleted" ? (
                      <MuiButton
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          openChannelComposer({
                            ...row,
                            id: undefined,
                            status: "draft",
                            sent_message_id: "",
                            sent_at: "",
                            deleted_at: "",
                            delete_at: "",
                          });
                        }}
                        startIcon={<RotateCcw size={13} />}
                        sx={{ textTransform: "none", height: 28, borderRadius: 1.5 }}
                      >
                        Đăng lại bài này
                      </MuiButton>
                    ) : null}
                  </Stack>
                </Stack>
              </Paper>
            );
          })}

          {!channelPageRows.length ? (
            <Paper variant="outlined" sx={{ p: 5, textAlign: "center", borderRadius: 2, bgcolor: "background.paper" }}>
              <Radio size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Chưa có bài viết trong danh mục này
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Bấm nút &ldquo;Đăng bài mới&rdquo; để bắt đầu soạn thảo nội dung lên kênh.
              </Typography>
            </Paper>
          ) : null}

          {/* Pagination */}
          {channelPageCount > 1 ? (
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.5, borderRadius: 2, bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
              <MuiButton
                size="small"
                variant="outlined"
                disabled={channelPage <= 1}
                onClick={() => setChannelPage((p) => p - 1)}
                sx={{ textTransform: "none" }}
              >
                Trang trước
              </MuiButton>
              <Typography variant="caption" color="text.secondary">
                Trang {channelPage} / {channelPageCount}
              </Typography>
              <MuiButton
                size="small"
                variant="outlined"
                disabled={channelPage >= channelPageCount}
                onClick={() => setChannelPage((p) => p + 1)}
                sx={{ textTransform: "none" }}
              >
                Trang sau
              </MuiButton>
            </Box>
          ) : null}
        </Box>

        {/* Right Column: Live Telegram Channel Post Mockup */}
        <Box sx={{ position: { lg: "sticky" }, top: { lg: 80 } }}>
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              bgcolor: "background.paper",
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            {/* Mockup Header */}
            <Box sx={{ p: 2, bgcolor: "action.hover", borderBottom: "1px solid", borderColor: "divider" }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  📱 XEM TRƯỚC BÀI ĐĂNG KÊNH TELEGRAM
                </Typography>
                <Chip size="small" label="LIVE PREVIEW" color="primary" sx={{ height: 18, fontSize: 10, fontWeight: 800 }} />
              </Stack>
            </Box>

            {/* Telegram Channel Phone Screen Simulation */}
            <Box
              sx={{
                p: 2.5,
                bgcolor: "#0e1621",
                minHeight: 460,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {/* Channel Meta Bar */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1.25,
                  borderRadius: 1.5,
                  bgcolor: "rgba(255,255,255,0.06)",
                }}
              >
                <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: "#2481cc",
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                      fontSize: 13,
                    }}
                  >
                    CU
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 700, lineHeight: 1.2 }}>
                      {selectedPost?.target_chat_id ? `Kênh: ${selectedPost.target_chat_id}` : "Kênh Telegram"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
                      12,450 người đăng ký
                    </Typography>
                  </Box>
                </Stack>
                <Chip size="small" label="Broadcast" sx={{ height: 18, fontSize: 9, bgcolor: "rgba(255,255,255,0.1)", color: "#fff" }} />
              </Box>

              {/* Message Post Bubble */}
              {selectedPost ? (
                <Box
                  sx={{
                    bgcolor: "#182533",
                    borderRadius: 2,
                    p: 2,
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                  }}
                >
                  {/* Post Title */}
                  {selectedPost.title ? (
                    <Typography variant="subtitle1" sx={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>
                      {selectedPost.title}
                    </Typography>
                  ) : null}

                  {/* Post Content */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#e2e8f0",
                      fontSize: 13.5,
                      lineHeight: 1.65,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {selectedPost.content || "Chưa có nội dung bài đăng."}
                  </Typography>

                  {/* Inline Buttons Preview */}
                  {parsedButtons.length > 0 ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mt: 1 }}>
                      {parsedButtons.map((btn: any, idx: number) => (
                        <Box
                          key={idx}
                          sx={{
                            p: 1,
                            borderRadius: 1,
                            bgcolor: "rgba(36, 129, 204, 0.25)",
                            color: "#64b5f6",
                            border: "1px solid rgba(36, 129, 204, 0.4)",
                            textAlign: "center",
                            fontSize: 12.5,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            "&:hover": {
                              bgcolor: "rgba(36, 129, 204, 0.4)",
                            },
                          }}
                        >
                          {btn.label} ↗
                        </Box>
                      ))}
                    </Box>
                  ) : null}

                  {/* Post Footer */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mt: 1,
                      pt: 1,
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: "rgba(255,255,255,0.5)" }}>
                      <Eye size={12} />
                      <Typography variant="caption" sx={{ fontSize: 11 }}>1.2k</Typography>
                    </Stack>

                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                      {selectedPost.sent_at ? formatDateTime(selectedPost.sent_at) : "Hôm nay 10:45"}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ p: 4, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                  <MessageSquare size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
                  <Typography variant="body2">Chọn một bài đăng ở danh sách bên trái để xem mô phỏng</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
