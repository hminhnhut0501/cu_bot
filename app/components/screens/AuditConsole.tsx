"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button as MuiButton,
  Chip,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  Filter,
  Layers,
  Search,
  Shield,
  ShieldAlert,
  Terminal,
  User,
  X,
} from "lucide-react";
import type { Row } from "@/lib/cp-types";

export type AuditStats = {
  total: number;
  critical: number;
  warning: number;
  latestTime: string;
};

export type AuditConsoleProps = {
  auditStats: AuditStats;
  rows?: Row[];
  selected?: Row | null;
  onSelectRow?: (row: Row | null) => void;
  auditLogSeverity?: (row: Row) => "critical" | "warning" | "info" | "neutral";
  formatDateTime?: (date: any) => string;
};

type AuditCategory = "all" | "moderation" | "config" | "scam" | "member";

function defaultFormatDateTime(value: any) {
  if (!value) return "Chưa rõ";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "medium" });
}

function getCategoryOfAction(action: string): AuditCategory {
  const act = String(action || "").toLowerCase();
  if (act.includes("ban") || act.includes("mute") || act.includes("kick") || act.includes("warn") || act.includes("restrict")) {
    return "moderation";
  }
  if (act.includes("config") || act.includes("setting") || act.includes("update") || act.includes("toggle")) {
    return "config";
  }
  if (act.includes("scam") || act.includes("blacklist")) {
    return "scam";
  }
  return "member";
}

function parsePayload(details: any): Record<string, any> {
  if (!details) return {};
  if (typeof details === "object") return details;
  try {
    return JSON.parse(String(details));
  } catch {
    return { raw: String(details) };
  }
}

export default function AuditConsole({
  auditStats,
  rows = [],
  selected: externalSelected,
  onSelectRow,
  auditLogSeverity,
  formatDateTime = defaultFormatDateTime,
}: AuditConsoleProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<AuditCategory>("all");
  const [internalSelected, setInternalSelected] = useState<Row | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const selected = externalSelected !== undefined ? externalSelected : internalSelected;
  const setSelected = onSelectRow || setInternalSelected;

  const getSeverity = (row: Row): "critical" | "warning" | "info" => {
    if (auditLogSeverity) {
      const s = auditLogSeverity(row);
      return s === "neutral" ? "info" : s;
    }
    const act = String(row.action || "").toLowerCase();
    if (act.includes("ban") || act.includes("blacklist") || act.includes("fail") || act.includes("error")) {
      return "critical";
    }
    if (act.includes("mute") || act.includes("warn") || act.includes("restrict")) {
      return "warning";
    }
    return "info";
  };

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const act = String(row.action || "").toLowerCase();
      if (category !== "all" && getCategoryOfAction(act) !== category) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        row.action,
        row.actor_user_id,
        row.target_user_id,
        row.bot_key,
        row.chat_id,
        typeof row.details === "object" ? JSON.stringify(row.details) : row.details,
      ]
        .map((item) => String(item || "").toLowerCase())
        .join(" ");
      return haystack.includes(q);
    });
  }, [rows, search, category]);

  const activeSelected = selected || filteredLogs[0] || null;

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopyFeedback(`Đã sao chép ${label}!`);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
      {/* Console Header */}
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
            <Terminal size={20} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Trung Tâm Nhật Ký Kiểm Toán (Audit Stream Inspector)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ghi nhận và tra cứu toàn bộ hành vi quản trị, can thiệp xử phạt và biến động hệ thống
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Chip
            size="small"
            icon={<Clock size={12} />}
            label={`Gần nhất: ${auditStats.latestTime || "Vừa xong"}`}
            variant="outlined"
            sx={{ borderRadius: 1.5 }}
          />
        </Stack>
      </Paper>

      {/* KPI Stats Row */}
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" } }}>
        <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2, bgcolor: "background.paper" }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>Tổng Sự Kiện</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>{auditStats.total}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2, bgcolor: "background.paper" }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>Nghiêm Trọng (Critical)</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: "error.main" }}>{auditStats.critical}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2, bgcolor: "background.paper" }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>Cần Chú Ý (Warning)</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: "warning.main" }}>{auditStats.warning}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2, bgcolor: "background.paper" }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>Khớp Bộ Lọc</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: "info.main" }}>{filteredLogs.length}</Typography>
        </Paper>
      </Box>

      {/* Search and Category Filter Toolbar */}
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: "background.paper",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", md: "center" },
          gap: 1.5,
        }}
      >
        <Stack direction="row" spacing={0.75} sx={{ overflowX: "auto", pb: { xs: 0.5, md: 0 } }}>
          <Chip
            size="small"
            label="Tất cả danh mục"
            color={category === "all" ? "primary" : "default"}
            variant={category === "all" ? "filled" : "outlined"}
            onClick={() => setCategory("all")}
            sx={{ borderRadius: 1.5, fontWeight: category === "all" ? 700 : 500, cursor: "pointer" }}
          />
          <Chip
            size="small"
            label="🚨 Xử phạt (Ban/Mute)"
            color={category === "moderation" ? "primary" : "default"}
            variant={category === "moderation" ? "filled" : "outlined"}
            onClick={() => setCategory("moderation")}
            sx={{ borderRadius: 1.5, fontWeight: category === "moderation" ? 700 : 500, cursor: "pointer" }}
          />
          <Chip
            size="small"
            label="🛡️ Lừa đảo & Blacklist"
            color={category === "scam" ? "primary" : "default"}
            variant={category === "scam" ? "filled" : "outlined"}
            onClick={() => setCategory("scam")}
            sx={{ borderRadius: 1.5, fontWeight: category === "scam" ? 700 : 500, cursor: "pointer" }}
          />
          <Chip
            size="small"
            label="⚙️ Đổi cấu hình"
            color={category === "config" ? "primary" : "default"}
            variant={category === "config" ? "filled" : "outlined"}
            onClick={() => setCategory("config")}
            sx={{ borderRadius: 1.5, fontWeight: category === "config" ? 700 : 500, cursor: "pointer" }}
          />
          <Chip
            size="small"
            label="👥 Thành viên"
            color={category === "member" ? "primary" : "default"}
            variant={category === "member" ? "filled" : "outlined"}
            onClick={() => setCategory("member")}
            sx={{ borderRadius: 1.5, fontWeight: category === "member" ? 700 : 500, cursor: "pointer" }}
          />
        </Stack>

        <TextField
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo hành động, Actor UID, Target ID..."
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={15} style={{ color: "#94a3b8" }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: { xs: "100%", md: 320 }, "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
        />
      </Paper>

      {/* Copy Toast Feedback */}
      {copyFeedback ? (
        <Alert severity="success" sx={{ py: 0.5, borderRadius: 1.5 }}>
          {copyFeedback}
        </Alert>
      ) : null}

      {/* Split Pane: Event Stream List (Left) & Inspector (Right) */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" }, gap: 2, alignItems: "start" }}>
        {/* Left: Event Stream */}
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2,
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
            maxHeight: 680,
            overflow: "hidden",
          }}
        >
          <Box sx={{ p: 1.5, bgcolor: "action.hover", borderBottom: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Dòng Sự Kiện ({filteredLogs.length})
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Bấm vào một sự kiện để phân tích chi tiết
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ p: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
            {filteredLogs.length === 0 ? (
              <Box sx={{ p: 5, textAlign: "center", color: "text.secondary" }}>
                <Activity size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <Typography variant="body2">Không tìm thấy sự kiện kiểm toán nào phù hợp</Typography>
              </Box>
            ) : (
              filteredLogs.map((row) => {
                const active = String(activeSelected?.id) === String(row.id);
                const sev = getSeverity(row);
                const isCrit = sev === "critical";
                const isWarn = sev === "warning";
                const timeStr = formatDateTime(row.created_at || row.updated_at);
                const actionName = String(row.action || "Log Event");

                return (
                  <Paper
                    key={String(row.id || `${row.action}-${timeStr}`)}
                    variant="outlined"
                    onClick={() => setSelected(row)}
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
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: active ? "primary.main" : "text.primary" }} noWrap>
                            {actionName}
                          </Typography>
                          <Chip
                            size="small"
                            label={isCrit ? "Critical" : isWarn ? "Warning" : "Info"}
                            color={isCrit ? "error" : isWarn ? "warning" : "default"}
                            sx={{ height: 18, fontSize: 10, borderRadius: 0.75 }}
                          />
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                          {timeStr}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                        {row.actor_user_id ? (
                          <Chip size="small" variant="outlined" label={`Actor: ${row.actor_user_id}`} sx={{ height: 20, fontSize: 11 }} />
                        ) : null}
                        {row.target_user_id ? (
                          <Chip size="small" variant="outlined" label={`Target: ${row.target_user_id}`} sx={{ height: 20, fontSize: 11 }} />
                        ) : null}
                        {row.bot_key ? (
                          <Chip size="small" label={`Bot: ${row.bot_key}`} sx={{ height: 20, fontSize: 10, bgcolor: "action.hover" }} />
                        ) : null}
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })
            )}
          </Box>
        </Paper>

        {/* Right: Event Dossier & JSON Payload Tree Inspector */}
        {activeSelected ? (
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 2,
              bgcolor: "background.paper",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              position: { lg: "sticky" },
              top: { lg: 80 },
            }}
          >
            {/* Header */}
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 1.1 }}>
                  CHI TIẾT SỰ KIỆN #{activeSelected.id || "-"}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {String(activeSelected.action || "Log Event")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Thời điểm ghi nhận: {formatDateTime(activeSelected.created_at || activeSelected.updated_at)}
                </Typography>
              </Box>

              <Chip
                color={getSeverity(activeSelected) === "critical" ? "error" : getSeverity(activeSelected) === "warning" ? "warning" : "primary"}
                label={getSeverity(activeSelected).toUpperCase()}
                sx={{ fontWeight: 800, borderRadius: 1 }}
              />
            </Stack>

            <Divider />

            {/* Actor & Target Grid */}
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "repeat(2, 1fr)" }}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "action.hover" }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Người Thực Hiện (Actor)
                  </Typography>
                  {activeSelected.actor_user_id ? (
                    <IconButton size="small" onClick={() => handleCopy(String(activeSelected.actor_user_id), "Actor UID")}>
                      <Copy size={12} />
                    </IconButton>
                  ) : null}
                </Stack>
                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                  {activeSelected.actor_user_id || "System / Bot"}
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "action.hover" }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Đối Tượng Tác Động (Target)
                  </Typography>
                  {activeSelected.target_user_id ? (
                    <IconButton size="small" onClick={() => handleCopy(String(activeSelected.target_user_id), "Target UID")}>
                      <Copy size={12} />
                    </IconButton>
                  ) : null}
                </Stack>
                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                  {activeSelected.target_user_id || "Không chỉ định"}
                </Typography>
              </Paper>
            </Box>

            {/* Scope info */}
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "repeat(2, 1fr)" }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Bot phụ trách:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{activeSelected.bot_key || "Mọi bot (*)"}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Nhóm / Group ID:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{activeSelected.chat_id || "Toàn hệ thống (*)"}</Typography>
              </Box>
            </Box>

            {/* JSON Payload Inspector */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Code2 size={15} style={{ color: "#2563eb" }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                    Dữ Liệu Chi Tiết (JSON Payload)
                  </Typography>
                </Stack>
                <MuiButton
                  size="small"
                  variant="text"
                  startIcon={<Copy size={12} />}
                  onClick={() => handleCopy(JSON.stringify(parsePayload(activeSelected.details), null, 2), "JSON payload")}
                  sx={{ textTransform: "none", fontSize: 11 }}
                >
                  Sao chép JSON
                </MuiButton>
              </Stack>

              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: "#0f172a",
                  color: "#38bdf8",
                  fontFamily: "monospace",
                  fontSize: 12,
                  maxHeight: 280,
                  overflow: "auto",
                  lineHeight: 1.6,
                }}
              >
                <pre style={{ margin: 0 }}>
                  {JSON.stringify(parsePayload(activeSelected.details), null, 2)}
                </pre>
              </Paper>
            </Box>
          </Paper>
        ) : (
          <Paper variant="outlined" sx={{ p: 6, borderRadius: 2, textAlign: "center", bgcolor: "background.paper" }}>
            <Activity size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Chọn một sự kiện để xem chi tiết
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mx: "auto", mt: 0.5 }}>
              Xem toàn bộ thông số chi tiết, người thực thi, đối tượng tác động và tham số JSON gửi kèm.
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
