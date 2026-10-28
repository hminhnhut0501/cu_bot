"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Button as MuiButton,
  Chip,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Layers,
  Radio,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import type { Row } from "@/lib/cp-types";

export type OverviewDashboardViewProps = {
  healthSummary: {
    pendingScamReports: number;
    pendingChannelPosts: number;
    failedChannelPosts: number;
    activeBots: number;
    enabledModules: number;
    disabledBots: number;
  };
  overviewActionCards: Array<{
    label: string;
    value: number | string;
    action: () => void;
    tone: string;
  }>;
  todayAuditGroups: {
    critical: Row[];
    warning: Row[];
    info: Row[];
  };
  todayAuditSummary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
  };
  selectedScopeRow: any;
  selectedScope: string;
  selectedBot: string;
  openModuleConfigure: (moduleKey: string) => void;
  goToInsight: (options: { targetLayer: string; targetTable: string }) => void;
  actionBadge: (row: Row, table: any) => React.ReactNode;
  formatDateTime: (date: any) => string;
};

type AuditFilterTab = "all" | "critical" | "warning" | "info";

export default function OverviewDashboardView({
  healthSummary,
  overviewActionCards,
  todayAuditGroups,
  todayAuditSummary,
  selectedScopeRow,
  selectedScope,
  selectedBot,
  openModuleConfigure,
  goToInsight,
  actionBadge,
  formatDateTime,
}: OverviewDashboardViewProps) {
  const [auditTab, setAuditTab] = useState<AuditFilterTab>("all");

  const totalIssues =
    healthSummary.pendingScamReports +
    healthSummary.pendingChannelPosts +
    healthSummary.failedChannelPosts;

  const isHealthy = totalIssues === 0 && todayAuditSummary.critical === 0;

  // Combine and sort today's audit logs chronologically
  const unifiedAuditStream = useMemo(() => {
    let list: Array<{ row: Row; severity: "critical" | "warning" | "info" }> = [];

    if (auditTab === "all" || auditTab === "critical") {
      list.push(...todayAuditGroups.critical.map((row) => ({ row, severity: "critical" as const })));
    }
    if (auditTab === "all" || auditTab === "warning") {
      list.push(...todayAuditGroups.warning.map((row) => ({ row, severity: "warning" as const })));
    }
    if (auditTab === "all" || auditTab === "info") {
      list.push(...todayAuditGroups.info.map((row) => ({ row, severity: "info" as const })));
    }

    return list.sort((a, b) => {
      const timeA = String(a.row.created_at || a.row.updated_at || "");
      const timeB = String(b.row.created_at || b.row.updated_at || "");
      return timeB.localeCompare(timeA);
    });
  }, [todayAuditGroups, auditTab]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
      {/* Executive Operational Command Banner */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          borderRadius: 2.5,
          bgcolor: "background.paper",
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", lg: "center" },
          gap: 2,
          border: "1px solid",
          borderColor: isHealthy ? "divider" : "warning.light",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          {/* Animated Pulse Radar Dot */}
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: isHealthy ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.14)",
              color: isHealthy ? "success.main" : "warning.main",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              position: "relative",
            }}
          >
            {isHealthy ? <ShieldCheck size={22} /> : <AlertTriangle size={22} />}
            <Box
              sx={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: isHealthy ? "#10b981" : "#f59e0b",
                boxShadow: `0 0 0 3px ${isHealthy ? "rgba(16, 185, 129, 0.25)" : "rgba(245, 158, 11, 0.25)"}`,
                animation: "pulseGlow 2s infinite ease-in-out",
              }}
            />
          </Box>

          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                {isHealthy ? "Hệ thống vận hành ổn định" : `Có ${totalIssues} mục cần xử lý`}
              </Typography>
              <Chip
                size="small"
                label={isHealthy ? "LIVE" : "ACTION REQUIRED"}
                color={isHealthy ? "success" : "warning"}
                sx={{ height: 20, fontSize: 10, fontWeight: 800, borderRadius: 1 }}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: "block" }}>
              {isHealthy
                ? "Tất cả bot và kênh hoạt động bình thường."
                : `${healthSummary.pendingScamReports} báo cáo scam, ${healthSummary.failedChannelPosts} bài phát sóng lỗi cần can thiệp.`}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <MuiButton
            variant="contained"
            size="small"
            color={isHealthy ? "primary" : "warning"}
            startIcon={<Zap size={14} />}
            onClick={() => openModuleConfigure("moderation")}
            sx={{ textTransform: "none", borderRadius: 1.5, boxShadow: "none", fontWeight: 700 }}
          >
            {isHealthy ? "Trung tâm kiểm duyệt" : "Xem việc cần xử lý"}
          </MuiButton>
          <MuiButton
            variant="outlined"
            size="small"
            startIcon={<Activity size={14} />}
            onClick={() => goToInsight({ targetLayer: "logs", targetTable: "audit_logs" })}
            sx={{ textTransform: "none", borderRadius: 1.5 }}
          >
            Mở Audit Logs ({todayAuditSummary.total})
          </MuiButton>
        </Stack>
      </Paper>

      {/* 4 Executive KPI Cards */}
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" } }}>
        <Paper
          variant="outlined"
          className="interactive-card"
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "background.paper",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
              Bot Đang Hoạt Động
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.25, color: "success.main" }}>
              {healthSummary.activeBots}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sẵn sàng nhận & gửi lệnh
            </Typography>
          </Box>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "rgba(16, 185, 129, 0.1)", display: "grid", placeItems: "center", color: "success.main" }}>
            <Bot size={20} />
          </Box>
        </Paper>

        <Paper
          variant="outlined"
          className="interactive-card"
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "background.paper",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
              Module Đang Bật
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.25, color: "primary.main" }}>
              {healthSummary.enabledModules}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tính năng đang chạy ngầm
            </Typography>
          </Box>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "rgba(37, 99, 235, 0.1)", display: "grid", placeItems: "center", color: "primary.main" }}>
            <Layers size={20} />
          </Box>
        </Paper>

        <Paper
          variant="outlined"
          className="interactive-card"
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "background.paper",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
              Sự Vụ Chờ Xử Lý
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.25, color: totalIssues > 0 ? "warning.main" : "text.primary" }}>
              {totalIssues}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Scam & bài phát lỗi
            </Typography>
          </Box>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: totalIssues > 0 ? "rgba(245, 158, 11, 0.1)" : "action.hover", display: "grid", placeItems: "center", color: totalIssues > 0 ? "warning.main" : "text.secondary" }}>
            <AlertCircle size={20} />
          </Box>
        </Paper>

        <Paper
          variant="outlined"
          className="interactive-card"
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "background.paper",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
              Bot Tạm Dừng
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.25, color: healthSummary.disabledBots > 0 ? "error.main" : "text.secondary" }}>
              {healthSummary.disabledBots}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Chưa bật hoặc thiếu token
            </Typography>
          </Box>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "action.hover", display: "grid", placeItems: "center", color: "text.secondary" }}>
            <Radio size={20} />
          </Box>
        </Paper>
      </Box>

      {/* Main Split: Triage Queue (Left) & Unified Live Incident Stream (Right) */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1.15fr" }, gap: 2.5, alignItems: "start" }}>
        {/* Left Column: Priority Triage Backlog */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 2,
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Flame size={18} style={{ color: "#ef4444" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Hàng đợi vận hành
            </Typography>
          </Stack>

          <Stack spacing={1}>
            {overviewActionCards.map((item) => {
              const isUrgent = item.tone === "scam" || item.tone === "danger";
              const isWarn = item.tone === "warning";
              return (
                <Paper
                  key={item.label}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderColor: "primary.main",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                          {item.label}
                        </Typography>
                        {isUrgent ? (
                          <Chip size="small" label="Khẩn cấp" color="error" sx={{ height: 18, fontSize: 10, fontWeight: 700, borderRadius: 1 }} />
                        ) : isWarn ? (
                          <Chip size="small" label="Cần xử lý" color="warning" sx={{ height: 18, fontSize: 10, fontWeight: 700, borderRadius: 1 }} />
                        ) : null}
                      </Stack>
                    </Box>

                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
                      <Chip
                        size="small"
                        label={String(item.value)}
                        color={isUrgent ? "error" : isWarn ? "warning" : "default"}
                        variant={Number(item.value) > 0 ? "filled" : "outlined"}
                        sx={{ fontWeight: 800, height: 24, borderRadius: 1 }}
                      />
                      <MuiButton
                        size="small"
                        variant="outlined"
                        endIcon={<ArrowRight size={13} />}
                        onClick={item.action}
                        sx={{ textTransform: "none", height: 28, borderRadius: 1.5 }}
                      >
                        Mở
                      </MuiButton>
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </Paper>

        {/* Right Column: Unified Real-Time Incident & Audit Feed */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 2,
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Activity size={18} style={{ color: "#2563eb" }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Nhật ký kiểm toán trực tiếp
              </Typography>
            </Stack>

            <MuiButton
              size="small"
              variant="text"
              endIcon={<ExternalLink size={13} />}
              onClick={() => goToInsight({ targetLayer: "logs", targetTable: "audit_logs" })}
              sx={{ textTransform: "none" }}
            >
              Mở Logs
            </MuiButton>
          </Box>

          {/* Category Filter Chips Bar */}
          <Stack direction="row" spacing={0.75} sx={{ overflowX: "auto", pb: 0.5 }}>
            <Chip
              size="small"
              label={`Tất cả (${todayAuditSummary.total})`}
              color={auditTab === "all" ? "primary" : "default"}
              variant={auditTab === "all" ? "filled" : "outlined"}
              onClick={() => setAuditTab("all")}
              sx={{ borderRadius: 1.5, fontWeight: auditTab === "all" ? 700 : 500, cursor: "pointer" }}
            />
            <Chip
              size="small"
              label={`Nghiêm trọng (${todayAuditSummary.critical})`}
              color={auditTab === "critical" ? "error" : "default"}
              variant={auditTab === "critical" ? "filled" : "outlined"}
              onClick={() => setAuditTab("critical")}
              sx={{ borderRadius: 1.5, fontWeight: auditTab === "critical" ? 700 : 500, cursor: "pointer" }}
            />
            <Chip
              size="small"
              label={`Cảnh báo (${todayAuditSummary.warning})`}
              color={auditTab === "warning" ? "warning" : "default"}
              variant={auditTab === "warning" ? "filled" : "outlined"}
              onClick={() => setAuditTab("warning")}
              sx={{ borderRadius: 1.5, fontWeight: auditTab === "warning" ? 700 : 500, cursor: "pointer" }}
            />
            <Chip
              size="small"
              label={`Thông tin (${todayAuditSummary.info})`}
              color={auditTab === "info" ? "info" : "default"}
              variant={auditTab === "info" ? "filled" : "outlined"}
              onClick={() => setAuditTab("info")}
              sx={{ borderRadius: 1.5, fontWeight: auditTab === "info" ? 700 : 500, cursor: "pointer" }}
            />
          </Stack>

          {/* Live Chronological Stream */}
          <Stack spacing={1} sx={{ maxHeight: 520, overflowY: "auto", pr: 0.5 }}>
            {unifiedAuditStream.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
                <CheckCircle2 size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <Typography variant="body2">Không có sự kiện kiểm toán nào trong danh mục này</Typography>
              </Box>
            ) : (
              unifiedAuditStream.map(({ row, severity }) => {
                const isCrit = severity === "critical";
                const isWarn = severity === "warning";
                const timeStr = formatDateTime(row.created_at || row.updated_at);
                const actionName = String(row.action || "Log Event");

                return (
                  <Paper
                    key={String(row.id || `${row.action}-${timeStr}`)}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      bgcolor: "background.paper",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <Stack spacing={0.75}>
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: isCrit ? "error.main" : isWarn ? "warning.main" : "primary.main",
                              flexShrink: 0,
                            }}
                          />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
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

                      {/* Detail row */}
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                        {row.bot_key ? (
                          <Chip size="small" variant="outlined" label={`Bot: ${row.bot_key}`} sx={{ height: 20, fontSize: 10 }} />
                        ) : null}
                        {row.actor_user_id ? (
                          <Chip size="small" variant="outlined" label={`Actor: ${row.actor_user_id}`} sx={{ height: 20, fontSize: 10 }} />
                        ) : null}
                        {row.target_user_id ? (
                          <Chip size="small" variant="outlined" label={`Target: ${row.target_user_id}`} sx={{ height: 20, fontSize: 10 }} />
                        ) : null}
                        {row.details && typeof row.details === "object" && (row.details as any).reason ? (
                          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }} noWrap>
                            Lý do: {String((row.details as any).reason)}
                          </Typography>
                        ) : null}
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })
            )}
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
