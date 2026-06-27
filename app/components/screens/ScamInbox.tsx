"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button as MuiButton,
  Chip,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Inbox,
  Search,
  ShieldCheck,
  User,
  X,
  BadgeAlert,
  Hash,
  Image as ImageIcon,
  MessageSquareText,
  CircleDashed,
  Eye,
} from "lucide-react";

import Section from "@/app/components/ui/Section";
import StatCard from "@/app/components/ui/StatCard";

export type ScamInboxStats = {
  pending: number;
  confirmed: number;
  rejected: number;
};

export type ScamInboxRow = Record<string, any>;

export type ScamInboxProps = {
  scamInboxStats: ScamInboxStats;
  scamReports: ScamInboxRow[];
  onOpenAllReports: () => void;
  onOpenReport: (id: string | number) => void;
  onConfirm: (row: ScamInboxRow) => void;
  onReject: (row: ScamInboxRow) => void;
  onDuplicate: (row: ScamInboxRow) => void;
  onNeedMoreInfo: (row: ScamInboxRow) => void;
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

function badgeTone(status: string) {
  if (status === "confirmed") return "success";
  if (status === "rejected" || status === "duplicate") return "default";
  if (status === "need_more_info") return "warning";
  return "warning";
}

function scoreLabel(row: ScamInboxRow) {
  const score = Number(row.scam_percent || row.confidence_score || 0);
  if (score >= 90) return { label: `${score}%`, tone: "error" as const };
  if (score >= 70) return { label: `${score}%`, tone: "warning" as const };
  if (score >= 40) return { label: `${score}%`, tone: "info" as const };
  return { label: `${score}%`, tone: "default" as const };
}

function attachmentFiles(row: ScamInboxRow) {
  const files = row.evidence_payload?.files;
  return Array.isArray(files) ? files : [];
}

export default function ScamInbox({
  scamInboxStats,
  scamReports,
  onOpenAllReports,
  onOpenReport,
  onConfirm,
  onReject,
  onDuplicate,
  onNeedMoreInfo,
  onEdit,
}: ScamInboxProps) {
  const [statusFilter, setStatusFilter] = useState<ScamStatusFilter>("pending");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const statusOptions: [ScamStatusFilter, string][] = [
    ["pending", `Pending (${scamInboxStats.pending})`],
    ["need_more_info", "Cần bổ sung"],
    ["confirmed", `Confirmed (${scamInboxStats.confirmed})`],
    ["rejected", `Rejected (${scamInboxStats.rejected})`],
    ["duplicate", "Duplicate"],
    ["all", "Tất cả"],
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

  const selected = useMemo(() => filteredReports.find((row) => String(row.id) === String(selectedId)) || filteredReports[0] || null, [filteredReports, selectedId]);
  const selectedAttachments = useMemo(() => (selected ? attachmentFiles(selected) : []), [selected]);

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
  }, [selected?.id]);

  return (
    <Section
      eyebrow="Phase 4 review inbox"
      title="Duyệt report scam"
      subtitle="Queue-first inbox để admin xem report, đối chiếu bằng chứng và xác nhận nhanh."
      icon={<Inbox size={20} />}
      actions={<MuiButton variant="outlined" startIcon={<ClipboardList size={16} />} onClick={onOpenAllReports}>Mở bảng report</MuiButton>}
      sx={{ mt: 2 }}
    >
      <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, minmax(0, 1fr))" } }}>
        <StatCard label="Chờ duyệt" value={scamInboxStats.pending} tone="warning" />
        <StatCard label="Đã xác nhận" value={scamInboxStats.confirmed} tone="success" />
        <StatCard label="Từ chối" value={scamInboxStats.rejected} tone="danger" />
        <StatCard label="Đang xem" value={filteredReports.length} tone="info" />
      </Box>

      <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} sx={{ alignItems: { xs: "stretch", lg: "center" }, justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flex: 1, maxWidth: 720 }}>
              <Search size={16} style={{ opacity: 0.7, flexShrink: 0 }} />
              <TextField
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                size="small"
                placeholder="Tìm theo UID, username, SĐT, số tài khoản, group..."
                sx={{ flex: 1 }}
              />
            </Box>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              {statusOptions.map(([key, label]) => (
                <MuiButton
                  key={key}
                  size="small"
                  variant={statusFilter === key ? "contained" : "outlined"}
                  onClick={() => setStatusFilter(key)}
                >
                  {label}
                </MuiButton>
              ))}
            </Stack>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" },
              gap: 2,
              minHeight: 520,
            }}
          >
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.paper", overflow: "hidden" }}>
              <Stack spacing={1}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="subtitle2">Danh sách report</Typography>
                  <Chip size="small" variant="outlined" label={`${filteredReports.length} mục`} />
                </Stack>
                <Divider />
                <Stack spacing={1} sx={{ maxHeight: 470, overflow: "auto", pr: 0.5 }}>
                  {filteredReports.length ? filteredReports.map((row) => {
                    const active = String(selected?.id) === String(row.id);
                    const score = scoreLabel(row);
                    const attachments = Array.isArray(row.evidence_payload?.files) ? row.evidence_payload.files.length : Number(row.attachment_count || 0);
                    return (
                      <Paper
                        key={row.id}
                        variant="outlined"
                        onClick={() => setSelectedId(row.id)}
                        sx={{
                          p: 1.5,
                          cursor: "pointer",
                          borderColor: active ? "primary.main" : "divider",
                          bgcolor: active ? "rgba(15, 118, 110, 0.06)" : "background.default",
                        }}
                      >
                        <Stack spacing={1}>
                          <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2 }}>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="subtitle2" noWrap>
                                {row.target_username || row.target_uid || row.bank_account || row.target_name || "Report không rõ đích"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {row.group_name || "Không có group"} · {row.reporter_username || row.reporter_user_id || "ẩn danh"}
                              </Typography>
                            </Box>
                            <Chip size="small" color={badgeTone(String(row.status || "pending")) as any} label={String(row.status || "pending")} />
                          </Stack>
                          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                            <Chip size="small" variant="outlined" icon={<Hash size={14} />} label={row.bank_account || "No bank"} />
                            <Chip size="small" variant="outlined" icon={<Banknote size={14} />} label={score.label} color={score.tone as any} />
                            <Chip size="small" variant="outlined" icon={<ImageIcon size={14} />} label={`${attachments || 0} file`} />
                          </Stack>
                          <Typography variant="body2" color="text.secondary" sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {row.reason || row.evidence_text || "Chưa có mô tả chi tiết."}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(row.created_at)}
                          </Typography>
                        </Stack>
                      </Paper>
                    );
                  }) : (
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }}>
                      <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center" }}>
                        <CircleDashed size={22} />
                        <Typography variant="subtitle2">Không có report phù hợp</Typography>
                        <Typography variant="body2" color="text.secondary">Thử đổi bộ lọc hoặc tìm theo UID, SĐT, số tài khoản.</Typography>
                      </Stack>
                    </Paper>
                  )}
                </Stack>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.paper" }}>
              {selected ? (
                <Stack spacing={1.5}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {selected.target_username || selected.target_uid || selected.bank_account || "Chi tiết report"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selected.target_name || selected.scammer_name || "Chưa rõ tên"} · {selected.group_name || "Chưa có group"}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <Chip size="small" color={badgeTone(String(selected.status || "pending")) as any} label={String(selected.status || "pending")} />
                      <Chip size="small" variant="outlined" color={scoreLabel(selected).tone as any} label={`${scoreLabel(selected).label} scam`} />
                    </Stack>
                  </Stack>

                  <Divider />

                  <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
                      <Typography variant="caption" color="text.secondary">Người báo cáo</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{selected.reporter_username || selected.reporter_user_id || "Chưa rõ"}</Typography>
                      <Typography variant="caption" color="text.secondary">{selected.reporter_chat_id || "private chat"}</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
                      <Typography variant="caption" color="text.secondary">Đối tượng</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{selected.target_uid || "-"}</Typography>
                      <Typography variant="caption" color="text.secondary">{selected.bank_account || "-"} · {selected.phone || "-"}</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
                      <Typography variant="caption" color="text.secondary">Nhóm / Admin</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{selected.group_name || "-"}</Typography>
                      <Typography variant="caption" color="text.secondary">{selected.admin_name || "-"}</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
                      <Typography variant="caption" color="text.secondary">Dấu thời gian</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatDate(selected.created_at)}</Typography>
                      <Typography variant="caption" color="text.secondary">{selected.reviewed_at ? `Duyệt: ${formatDate(selected.reviewed_at)}` : "Chưa duyệt"}</Typography>
                    </Paper>
                  </Box>

                  <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
                    <Stack spacing={0.75}>
                      <Typography variant="subtitle2">Bằng chứng / mô tả</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                        {selected.evidence_text || selected.reason || "Chưa có mô tả."}
                      </Typography>
                      {truthy(selected.notes) ? (
                        <>
                          <Divider />
                          <Typography variant="caption" color="text.secondary">Ghi chú</Typography>
                          <Typography variant="body2">{selected.notes}</Typography>
                        </>
                      ) : null}
                      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                        <Chip size="small" icon={<MessageSquareText size={14} />} label={`Report #${selected.id}`} />
                        {attachmentFiles(selected).length || Number(selected.attachment_count || 0) ? (
                          <Chip size="small" icon={<ImageIcon size={14} />} label={`${Number(selected.attachment_count || 0)} attachment`} />
                        ) : null}
                        {truthy(selected.source_chat_id) ? <Chip size="small" variant="outlined" label={`src chat ${selected.source_chat_id}`} /> : null}
                      </Stack>
                      {selectedAttachments.length ? (
                        <>
                          <Divider sx={{ my: 1 }} />
                          <Stack spacing={1}>
                            <Typography variant="subtitle2">Preview attachment</Typography>
                            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                              {selectedAttachments.slice(0, 6).map((file: any, index: number) => (
                                <Paper
                                  key={`${file.telegram_file_id || index}`}
                                  variant="outlined"
                                  onClick={() => setPreviewIndex(index)}
                                  sx={{
                                    width: 132,
                                    p: 1,
                                    cursor: "pointer",
                                    bgcolor: "background.paper",
                                    "&:hover": { borderColor: "primary.main" },
                                  }}
                                >
                                  <Stack spacing={0.75}>
                                    <Box sx={{ height: 84, borderRadius: 1, bgcolor: "rgba(15, 118, 110, 0.08)", display: "grid", placeItems: "center" }}>
                                      <ImageIcon size={24} />
                                    </Box>
                                    <Typography variant="caption" noWrap sx={{ fontWeight: 700 }}>
                                      {file.media_type || "file"}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap>
                                      {file.file_name || file.telegram_file_id || `#${index + 1}`}
                                    </Typography>
                                  </Stack>
                                </Paper>
                              ))}
                            </Stack>
                          </Stack>
                        </>
                      ) : null}
                    </Stack>
                  </Paper>

                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                    <MuiButton variant="contained" color="success" startIcon={<CheckCircle2 size={16} />} onClick={() => onConfirm(selected)}>
                      Xác nhận
                    </MuiButton>
                    <MuiButton variant="outlined" color="warning" startIcon={<AlertTriangle size={16} />} onClick={() => onEdit(selected)}>
                      Sửa trước khi duyệt
                    </MuiButton>
                    <MuiButton variant="outlined" color="secondary" startIcon={<BadgeAlert size={16} />} onClick={() => onDuplicate(selected)}>
                      Đánh dấu trùng
                    </MuiButton>
                    <MuiButton variant="outlined" color="warning" startIcon={<Clock3 size={16} />} onClick={() => onNeedMoreInfo(selected)}>
                      Cần bổ sung
                    </MuiButton>
                    <MuiButton variant="outlined" color="error" startIcon={<X size={16} />} onClick={() => onReject(selected)}>
                      Từ chối
                    </MuiButton>
                    <MuiButton variant="text" startIcon={<ArrowRight size={16} />} onClick={() => onOpenReport(selected.id)}>
                      Mở chi tiết
                    </MuiButton>
                  </Stack>

                  <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2">Checklist duyệt nhanh</Typography>
                      <Stack spacing={0.75}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Check size={16} />
                          <Typography variant="body2">Có UID / username / bank account để tra cứu</Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Check size={16} />
                          <Typography variant="body2">Có bằng chứng bill / ảnh group / note</Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Check size={16} />
                          <Typography variant="body2">Nếu report trùng, đánh dấu duplicate trước khi confirm</Typography>
                        </Box>
                      </Stack>
                    </Stack>
                  </Paper>
                </Stack>
              ) : (
                <Stack spacing={1.5} sx={{ alignItems: "center", justifyContent: "center", minHeight: 420, textAlign: "center" }}>
                  <ShieldCheck size={28} />
                  <Typography variant="h6">Chọn một report để xem chi tiết</Typography>
                  <Typography variant="body2" color="text.secondary">Admin có thể lọc theo trạng thái, tìm nhanh bằng bất kỳ trường nào, rồi xác nhận ngay trong panel này.</Typography>
                </Stack>
              )}
            </Paper>
          </Box>
        </Stack>
      </Paper>

      <Dialog open={previewIndex !== null && !!selectedAttachments[previewIndex || 0]} onClose={() => setPreviewIndex(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Preview attachment</DialogTitle>
        <DialogContent>
          {previewIndex !== null && selectedAttachments[previewIndex] ? (
            <Stack spacing={1.25}>
              <Box sx={{ height: 220, borderRadius: 2, bgcolor: "rgba(15, 118, 110, 0.08)", display: "grid", placeItems: "center" }}>
                <ImageIcon size={42} />
              </Box>
              <Typography variant="subtitle2">{selectedAttachments[previewIndex].media_type || "file"}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedAttachments[previewIndex].file_name || selectedAttachments[previewIndex].telegram_file_id || "No file id"}
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                {selectedAttachments[previewIndex].caption || "Không có caption."}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                {selectedAttachments[previewIndex].telegram_file_id || selectedAttachments[previewIndex].telegram_file_unique_id || ""}
              </Typography>
            </Stack>
          ) : null}
        </DialogContent>
      </Dialog>
    </Section>
  );
}
