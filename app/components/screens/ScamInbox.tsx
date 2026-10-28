"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button as MuiButton,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BadgeAlert,
  Banknote,
  Check,
  CheckCircle2,
  Clock,
  Clock3,
  ExternalLink,
  Eye,
  Hash,
  Image as ImageIcon,
  Inbox,
  Maximize2,
  MessageSquareText,
  Radio,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react";

export type ScamInboxStats = {
  pending: number;
  confirmed: number;
  rejected: number;
};

export type ScamInboxRow = Record<string, any>;

export type ScamInboxProps = {
  scamInboxStats: ScamInboxStats;
  scamReports: ScamInboxRow[];
  scamBroadcasts: ScamInboxRow[];
  onOpenAllReports: () => void;
  onOpenReport: (id: string | number) => void;
  onConfirm: (row: ScamInboxRow) => void;
  onReject: (row: ScamInboxRow) => void;
  onDuplicate: (row: ScamInboxRow) => void;
  onNeedMoreInfo: (row: ScamInboxRow) => void;
  onOpenBroadcasts: () => void;
  onEdit: (row: ScamInboxRow) => void;
};

type ScamStatusFilter = "pending" | "confirmed" | "rejected" | "duplicate" | "need_more_info" | "all";

function formatDate(value: unknown) {
  if (!value) return "Chưa rõ";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

function truthy(value: unknown) {
  return Boolean(value) && String(value).trim() !== "";
}

function badgeTone(status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" {
  if (status === "confirmed") return "success";
  if (status === "rejected") return "error";
  if (status === "duplicate") return "default";
  if (status === "need_more_info") return "warning";
  return "warning";
}

function scoreInfo(row: ScamInboxRow) {
  const score = Number(row.scam_percent || row.confidence_score || 0);
  if (score >= 80) return { val: score, label: `${score}% Nguy cơ rất cao`, color: "#ef4444", barColor: "error" as const };
  if (score >= 50) return { val: score, label: `${score}% Đang nghi vấn`, color: "#f59e0b", barColor: "warning" as const };
  if (score >= 20) return { val: score, label: `${score}% Nguy cơ thấp`, color: "#0ea5e9", barColor: "info" as const };
  return { val: score, label: `${score}% Chưa thẩm định`, color: "#94a3b8", barColor: "inherit" as const };
}

function attachmentFiles(row: ScamInboxRow) {
  const files = row.evidence_payload?.files;
  return Array.isArray(files) ? files : [];
}

function attachmentPreviewUrl(file: ScamInboxRow) {
  const fileId = file.telegram_file_id || file.telegram_file_unique_id;
  return fileId ? `/api/scam_media?file_id=${encodeURIComponent(fileId)}` : "";
}

export default function ScamInbox({
  scamInboxStats,
  scamReports,
  scamBroadcasts,
  onOpenAllReports,
  onOpenReport,
  onConfirm,
  onReject,
  onDuplicate,
  onNeedMoreInfo,
  onOpenBroadcasts,
  onEdit,
}: ScamInboxProps) {
  const [statusFilter, setStatusFilter] = useState<ScamStatusFilter>("pending");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const statusTabs: Array<{ key: ScamStatusFilter; label: string; count?: number }> = [
    { key: "pending", label: "Chờ xét duyệt", count: scamInboxStats.pending },
    { key: "need_more_info", label: "Cần bổ sung" },
    { key: "confirmed", label: "Đã xác nhận", count: scamInboxStats.confirmed },
    { key: "rejected", label: "Đã từ chối", count: scamInboxStats.rejected },
    { key: "duplicate", label: "Báo cáo trùng" },
    { key: "all", label: "Tất cả" },
  ];

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();
    return scamReports.filter((row) => {
      const status = String(row.status || "pending");
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!query) return true;
      const haystack = [
        row.target_uid,
        row.target_username,
        row.target_name,
        row.bank_account,
        row.phone,
        row.group_name,
        row.scammer_name,
        row.admin_name,
        row.reporter_username,
        row.reporter_user_id,
        row.evidence_text,
        row.notes,
      ]
        .map((item) => String(item || "").toLowerCase())
        .join(" ");
      return haystack.includes(query);
    });
  }, [scamReports, search, statusFilter]);

  const selected = useMemo(
    () => filteredReports.find((row) => String(row.id) === String(selectedId)) || filteredReports[0] || null,
    [filteredReports, selectedId]
  );
  const selectedAttachments = useMemo(() => (selected ? attachmentFiles(selected) : []), [selected]);
  const broadcastRows = useMemo(() => scamBroadcasts.slice(0, 5), [scamBroadcasts]);

  useEffect(() => {
    if (!selected && filteredReports.length) {
      setSelectedId(filteredReports[0].id);
    }
    if (selected && String(selected.id) !== String(selectedId)) {
      setSelectedId(selected.id);
    }
  }, [filteredReports, selected, selectedId]);

  useEffect(() => {
    setPreviewIndex(null);
    setPreviewOpen(false);
    setPreviewUrl("");
  }, [selected?.id]);

  useEffect(() => {
    const file = previewIndex !== null ? selectedAttachments[previewIndex] : null;
    if (!file) return;
    const fileId = file.telegram_file_id || file.telegram_file_unique_id;
    if (!fileId) return;
    setPreviewUrl(`/api/scam_media?file_id=${encodeURIComponent(fileId)}`);
    setPreviewOpen(true);
  }, [previewIndex, selectedAttachments]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
      {/* Header & Investigation Counter Bar */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", md: "center" },
          gap: 1.5,
          p: 2,
          borderRadius: 2,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
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
              bgcolor: "rgba(225, 29, 72, 0.12)",
              color: "#e11d48",
            }}
          >
            <ShieldAlert size={20} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Trung Tâm Thẩm Định Lừa Đảo (Scam Investigation)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Xem xét báo cáo, đối chiếu bằng chứng giao dịch và đồng bộ cảnh báo toàn mạng lưới
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <MuiButton
            variant="outlined"
            size="small"
            startIcon={<Radio size={14} />}
            onClick={onOpenBroadcasts}
            sx={{ textTransform: "none", borderRadius: 1.5 }}
          >
            Nhật ký phát sóng ({scamBroadcasts.length})
          </MuiButton>
          <MuiButton
            variant="contained"
            size="small"
            color="primary"
            startIcon={<ExternalLink size={14} />}
            onClick={onOpenAllReports}
            sx={{ textTransform: "none", borderRadius: 1.5, boxShadow: "none" }}
          >
            Bảng dữ liệu đầy đủ
          </MuiButton>
        </Stack>
      </Box>

      {/* KPI Stat Cards */}
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" } }}>
        <Paper
          variant="outlined"
          sx={{
            p: 1.75,
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
            Chờ xét duyệt
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: "warning.main" }}>
            {scamInboxStats.pending}
          </Typography>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 1.75,
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
            Đã xác nhận lừa đảo
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: "success.main" }}>
            {scamInboxStats.confirmed}
          </Typography>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 1.75,
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
            Đã bác bỏ / Từ chối
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: "error.main" }}>
            {scamInboxStats.rejected}
          </Typography>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 1.75,
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
            Khớp bộ lọc hiện tại
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: "info.main" }}>
            {filteredReports.length}
          </Typography>
        </Paper>
      </Box>

      {/* Filter and Tab Strip */}
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: "background.paper",
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", lg: "center" },
          gap: 1.5,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: { xs: 0.5, lg: 0 } }}>
          {statusTabs.map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <Chip
                key={tab.key}
                label={tab.count !== undefined ? `${tab.label} (${tab.count})` : tab.label}
                onClick={() => setStatusFilter(tab.key)}
                color={active ? "primary" : "default"}
                variant={active ? "filled" : "outlined"}
                sx={{
                  borderRadius: 1.5,
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                }}
              />
            );
          })}
        </Stack>

        <TextField
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo UID, tên, SĐT, số tài khoản, group..."
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={15} style={{ color: "#94a3b8" }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: { xs: "100%", lg: 320 }, "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
        />
      </Paper>

      {/* Main Investigation Split Pane: Queue (Left) & Inspector (Right) */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "420px 1fr" },
          gap: 2,
          alignItems: "start",
        }}
      >
        {/* Left: Queue List */}
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2,
            bgcolor: "background.paper",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            maxHeight: 680,
          }}
        >
          <Box sx={{ p: 1.5, bgcolor: "action.hover", borderBottom: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Hàng Đợi ({filteredReports.length})
              </Typography>
              <Chip size="small" label={statusFilter} variant="outlined" sx={{ height: 20, fontSize: 11 }} />
            </Stack>
          </Box>

          <Box sx={{ p: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
            {filteredReports.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
                <Inbox size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <Typography variant="body2">Không có báo cáo nào trong hàng đợi này</Typography>
              </Box>
            ) : (
              filteredReports.map((row) => {
                const active = String(selected?.id) === String(row.id);
                const score = scoreInfo(row);
                const attachmentsCount = Array.isArray(row.evidence_payload?.files)
                  ? row.evidence_payload.files.length
                  : Number(row.attachment_count || 0);

                return (
                  <Paper
                    key={row.id}
                    variant="outlined"
                    onClick={() => setSelectedId(row.id)}
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      cursor: "pointer",
                      border: "1px solid",
                      borderColor: active ? "primary.main" : "divider",
                      bgcolor: active ? "rgba(37, 99, 235, 0.05)" : "background.paper",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        borderColor: "primary.main",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      },
                    }}
                  >
                    <Stack spacing={0.75}>
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: active ? "primary.main" : "text.primary" }} noWrap>
                            {row.target_username ? `@${row.target_username}` : row.target_uid || row.bank_account || "Chưa rõ đích"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {row.target_name || row.scammer_name || "Chưa có tên hiển thị"}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          color={badgeTone(String(row.status || "pending"))}
                          label={String(row.status || "pending")}
                          sx={{ height: 20, fontSize: 11, fontWeight: 600, borderRadius: 1 }}
                        />
                      </Stack>

                      {/* Probability Score Bar */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={score.val || 10}
                          color={score.barColor}
                          sx={{ flex: 1, height: 5, borderRadius: 1 }}
                        />
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11, color: score.color }}>
                          {score.val}%
                        </Typography>
                      </Box>

                      {/* Meta chips */}
                      <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", alignItems: "center" }}>
                        {row.bank_account ? (
                          <Chip
                            size="small"
                            variant="outlined"
                            icon={<Banknote size={11} />}
                            label={row.bank_account}
                            sx={{ height: 20, fontSize: 11, borderRadius: 1 }}
                          />
                        ) : null}
                        {attachmentsCount > 0 ? (
                          <Chip
                            size="small"
                            variant="outlined"
                            icon={<ImageIcon size={11} />}
                            label={`${attachmentsCount} ảnh`}
                            sx={{ height: 20, fontSize: 11, borderRadius: 1 }}
                          />
                        ) : null}
                        <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                          {formatDate(row.created_at)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })
            )}
          </Box>
        </Paper>

        {/* Right: Detailed Dossier & Evidence Inspector */}
        {selected ? (
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 2,
              bgcolor: "background.paper",
              p: 2.5,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {/* Dossier Header */}
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
              <Box>
                <Typography variant="overline" color="error.main" sx={{ fontWeight: 800, letterSpacing: 1.2 }}>
                  HỒ SƠ BÁO CÁO #{selected.id}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {selected.target_username ? `@${selected.target_username}` : selected.target_uid || "Đối tượng nghi vấn"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Báo cáo từ nhóm: <strong>{selected.group_name || "Nhóm riêng lẻ"}</strong> · Người báo: <strong>{selected.reporter_username || selected.reporter_user_id || "Ẩn danh"}</strong>
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Chip
                  color={badgeTone(String(selected.status || "pending"))}
                  label={String(selected.status || "pending").toUpperCase()}
                  sx={{ fontWeight: 800, borderRadius: 1.5 }}
                />
              </Stack>
            </Stack>

            <Divider />

            {/* Entity Dossier Grid */}
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" } }}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "action.hover" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Telegram UID
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                  {selected.target_uid || "Chưa xác định"}
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "action.hover" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Số tài khoản ngân hàng
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, fontFamily: "monospace", color: selected.bank_account ? "error.main" : "text.secondary" }}>
                  {selected.bank_account || "Không có số TK"}
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "action.hover" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Số điện thoại liên hệ
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                  {selected.phone || "Không có SĐT"}
                </Typography>
              </Paper>
            </Box>

            {/* Evidence & Statement Box */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Nội dung báo cáo & Bằng chứng vi phạm:
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: "rgba(241, 245, 249, 0.5)",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}
              >
                {selected.evidence_text || selected.reason || "Không có bản tường trình chi tiết."}
              </Paper>
            </Box>

            {/* Evidence Gallery / Attachments */}
            {selectedAttachments.length > 0 ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Ảnh chứng minh giao dịch ({selectedAttachments.length}):
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ overflowX: "auto", py: 0.5 }}>
                  {selectedAttachments.map((file: any, index: number) => {
                    const url = attachmentPreviewUrl(file);
                    return (
                      <Paper
                        key={`${file.telegram_file_id || index}`}
                        variant="outlined"
                        onClick={() => setPreviewIndex(index)}
                        sx={{
                          width: 140,
                          height: 120,
                          borderRadius: 1.5,
                          overflow: "hidden",
                          cursor: "pointer",
                          position: "relative",
                          border: "1px solid",
                          borderColor: "divider",
                          transition: "all 0.15s ease",
                          "&:hover": {
                            borderColor: "primary.main",
                            transform: "scale(1.02)",
                          },
                        }}
                      >
                        {url ? (
                          <Box
                            component="img"
                            src={url}
                            alt="bằng chứng"
                            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <Box sx={{ height: "100%", display: "grid", placeItems: "center", bgcolor: "action.hover" }}>
                            <ImageIcon size={24} style={{ opacity: 0.4 }} />
                          </Box>
                        )}
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            p: 0.5,
                            bgcolor: "rgba(0,0,0,0.6)",
                            color: "#fff",
                            fontSize: 10,
                            textAlign: "center",
                          }}
                        >
                          Bằng chứng #{index + 1}
                        </Box>
                      </Paper>
                    );
                  })}
                </Stack>
              </Box>
            ) : null}

            {/* Broadcast history if any */}
            {broadcastRows.length > 0 ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
                  Lịch sử phát sóng cảnh báo gần nhất:
                </Typography>
                <Stack spacing={0.75}>
                  {broadcastRows.map((b) => (
                    <Box
                      key={b.id}
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        bgcolor: "action.hover",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {b.broadcast_type || "Cảnh báo toàn mạng"} · Nhóm đích: {b.target_chat_id || "Mọi nhóm"}
                      </Typography>
                      <Chip size="small" label={b.status || "sent"} color="success" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
                    </Box>
                  ))}
                </Stack>
              </Box>
            ) : null}

            <Divider />

            {/* Verdict Action Command Bar */}
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", alignItems: "center" }}>
              <MuiButton
                variant="contained"
                color="success"
                startIcon={<CheckCircle2 size={16} />}
                onClick={() => onConfirm(selected)}
                sx={{ textTransform: "none", borderRadius: 1.5, fontWeight: 700 }}
              >
                Xác nhận Lừa Đảo
              </MuiButton>
              <MuiButton
                variant="outlined"
                color="warning"
                startIcon={<AlertCircle size={16} />}
                onClick={() => onEdit(selected)}
                sx={{ textTransform: "none", borderRadius: 1.5 }}
              >
                Sửa hồ sơ
              </MuiButton>
              <MuiButton
                variant="outlined"
                color="secondary"
                startIcon={<BadgeAlert size={16} />}
                onClick={() => onDuplicate(selected)}
                sx={{ textTransform: "none", borderRadius: 1.5 }}
              >
                Đánh dấu Trùng
              </MuiButton>
              <MuiButton
                variant="outlined"
                color="info"
                startIcon={<Clock3 size={16} />}
                onClick={() => onNeedMoreInfo(selected)}
                sx={{ textTransform: "none", borderRadius: 1.5 }}
              >
                Cần thêm bằng chứng
              </MuiButton>
              <MuiButton
                variant="outlined"
                color="error"
                startIcon={<X size={16} />}
                onClick={() => onReject(selected)}
                sx={{ textTransform: "none", borderRadius: 1.5 }}
              >
                Bác bỏ / Từ chối
              </MuiButton>
              <MuiButton
                variant="text"
                startIcon={<ExternalLink size={15} />}
                onClick={() => onOpenReport(selected.id)}
                sx={{ textTransform: "none", ml: "auto" }}
              >
                Mở chi tiết
              </MuiButton>
            </Stack>
          </Paper>
        ) : (
          <Paper variant="outlined" sx={{ p: 6, borderRadius: 2, textAlign: "center", bgcolor: "background.paper" }}>
            <ShieldCheck size={42} style={{ opacity: 0.3, marginBottom: 12 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Chọn một báo cáo để bắt đầu thẩm định
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460, mx: "auto", mt: 0.5 }}>
              Hệ thống cho phép admin đọc nội dung tố cáo, phóng to ảnh hóa đơn/bill chuyển khoản và đưa ra phán quyết xử lý tức thì.
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Lightbox Dialog for Evidence Photos */}
      <Dialog
        open={previewOpen && Boolean(previewUrl)}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewIndex(null);
          setPreviewUrl("");
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Kiểm tra bằng chứng ảnh #{previewIndex !== null ? previewIndex + 1 : ""}
          </Typography>
          <IconButton size="small" onClick={() => setPreviewOpen(false)}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewIndex !== null && selectedAttachments[previewIndex] ? (
            <Stack spacing={1.5}>
              <Box
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  bgcolor: "#000",
                  minHeight: 300,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {previewUrl ? (
                  <Box
                    component="img"
                    src={previewUrl}
                    alt="attachment preview"
                    sx={{ width: "100%", maxHeight: 560, objectFit: "contain", display: "block" }}
                  />
                ) : (
                  <ImageIcon size={42} style={{ color: "#fff" }} />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                File: {selectedAttachments[previewIndex].file_name || selectedAttachments[previewIndex].telegram_file_id || "Không tên"}
              </Typography>
            </Stack>
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
