"use client";

import {
  Box,
  Button as MuiButton,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Section from "@/app/components/ui/Section";
import StatCard from "@/app/components/ui/StatCard";
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
  return (
    <>
      <Section
        eyebrow="Overview"
        title="Tổng quan vận hành"
        subtitle="Trạng thái, việc cần xử lý, lối vào module."
        tone="main"
      >
        <Stack spacing={2}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.25,
              bgcolor: "background.default",
              backgroundImage: "linear-gradient(135deg, rgba(15, 118, 110, 0.06), transparent 56%)",
              borderTopColor: "rgba(15, 118, 110, 0.24)",
            }}
          >
            <Stack spacing={1.5}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 2,
                  alignItems: { xs: "flex-start", md: "center" },
                  flexDirection: { xs: "column", md: "row" },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="overline" color="text.secondary">
                    Health summary
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {healthSummary.pendingScamReports ||
                    healthSummary.pendingChannelPosts ||
                    healthSummary.failedChannelPosts
                      ? "Có việc cần xử lý hôm nay"
                      : "Hệ thống đang ổn định"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {healthSummary.pendingScamReports ||
                    healthSummary.pendingChannelPosts ||
                    healthSummary.failedChannelPosts
                      ? `Còn ${
                          healthSummary.pendingScamReports +
                          healthSummary.pendingChannelPosts +
                          healthSummary.failedChannelPosts
                        } mục cần xử lý.`
                      : "Không có backlog nổi bật."}
                  </Typography>
                </Box>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  sx={{
                    flexWrap: "wrap",
                    justifyContent: { xs: "flex-start", md: "flex-end" },
                    width: { xs: "100%", md: "auto" },
                  }}
                >
                  <MuiButton
                    fullWidth={false}
                    sx={{ width: { xs: "100%", sm: "auto" } }}
                    variant="contained"
                    onClick={() => openModuleConfigure("moderation")}
                  >
                    Xem việc cần xử lý
                  </MuiButton>
                  <MuiButton
                    fullWidth={false}
                    sx={{ width: { xs: "100%", sm: "auto" } }}
                    variant="outlined"
                    onClick={() => goToInsight({ targetLayer: "logs", targetTable: "audit_logs" })}
                  >
                    Mở logs
                  </MuiButton>
                </Stack>
              </Box>

              <Grid container spacing={1.25}>
                {[
                  { label: "Bot online", value: healthSummary.activeBots, body: "Bot đang hoạt động", tone: "success" as const },
                  { label: "Module bật", value: healthSummary.enabledModules, body: "Module đang chạy", tone: "main" as const },
                  {
                    label: "Cảnh báo",
                    value: healthSummary.pendingScamReports + healthSummary.failedChannelPosts,
                    body: "Mục cần chú ý",
                    tone: "warning" as const,
                  },
                  { label: "Bot off", value: healthSummary.disabledBots, body: "Bot chưa sẵn sàng", tone: "neutral" as const },
                ].map((item) => (
                  <Grid key={item.label} size={{ xs: 12, sm: 6, xl: 3 }}>
                    <StatCard compact label={item.label} value={item.value} hint={item.body} tone={item.tone} />
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Paper>

          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Section eyebrow="Actions" title="Việc cần chú ý" subtitle="Bắt đầu từ cảnh báo, queue và hành động còn thiếu." tone="warning" subtle>
                <Stack spacing={1.25}>
                  {overviewActionCards.map((item) => (
                    <Paper
                      key={item.label}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        bgcolor: "background.paper",
                        borderLeft: "3px solid",
                        borderLeftColor:
                          item.tone === "scam" || item.tone === "danger"
                            ? "error.main"
                            : item.tone === "warning"
                              ? "warning.main"
                              : "primary.main",
                      }}
                    >
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.25}
                        sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", gap: 2 }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {item.label}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Mục đang chờ xử lý trong ca hiện tại.
                          </Typography>
                        </Box>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{
                            alignItems: "center",
                            flexShrink: 0,
                            width: { xs: "100%", sm: "auto" },
                            justifyContent: { xs: "space-between", sm: "flex-end" },
                          }}
                        >
                          <Chip
                            size="small"
                            variant="outlined"
                            label={String(item.value)}
                            sx={{
                              borderColor:
                                item.tone === "scam" || item.tone === "danger"
                                  ? "error.main"
                                  : item.tone === "warning"
                                    ? "warning.main"
                                    : item.tone === "main"
                                      ? "primary.main"
                                      : "divider",
                              color:
                                item.tone === "scam" || item.tone === "danger"
                                  ? "error.main"
                                  : item.tone === "warning"
                                    ? "warning.main"
                                    : item.tone === "main"
                                      ? "primary.main"
                                      : "text.secondary",
                              fontWeight: 700,
                            }}
                          />
                          <MuiButton size="small" variant="outlined" onClick={item.action}>
                            Mở
                          </MuiButton>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Section>
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }}>
              <Section eyebrow="Quick view" title="Top hôm nay" subtitle="Tóm tắt hành động và group nổi bật." tone="analytics" subtle>
                <Stack spacing={1.5}>
                  <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.paper" }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                      Top hành động hôm nay
                    </Typography>
                    <Stack spacing={0.75}>
                      {todayAuditGroups.info.slice(0, 3).map((row) => (
                        <Stack key={String(row.id || row.action)} direction="row" sx={{ justifyContent: "space-between", gap: 2, py: 0.25 }}>
                          <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                            {actionBadge(row, { key: "audit_logs", label: "Nhật ký", description: "", titleField: "action", summaryFields: [], fields: [] })}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                            {formatDateTime(row.created_at || row.updated_at)}
                          </Typography>
                        </Stack>
                      ))}
                      {!todayAuditGroups.info.length ? <Typography variant="body2" color="text.secondary">Chưa có action nổi bật.</Typography> : null}
                    </Stack>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.paper" }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                      Group nổi bật
                    </Typography>
                    <Stack spacing={0.75}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {String(selectedScopeRow?.group_name || selectedScope || "Chưa chọn group")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedScopeRow
                          ? `Bot: ${selectedScopeRow.bot_key || selectedBot || "main"} · Scope đã chọn`
                          : "Chọn scope để xem group nổi bật trong ngữ cảnh hiện tại."}
                      </Typography>
                    </Stack>
                  </Paper>
                </Stack>
              </Section>
            </Grid>
          </Grid>
        </Stack>
      </Section>

      <Section
        eyebrow="Signals"
        title="Log bot trong ngày"
        subtitle="Tổng hợp ngắn gọn thay vì dàn đều mọi trạng thái trên một màn hình."
        tone="analytics"
      >
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            <Chip label={`Tổng ${todayAuditSummary.total}`} />
            <Chip label={`Cảnh báo ${todayAuditSummary.warning}`} />
            <Chip label={`Nghiêm trọng ${todayAuditSummary.critical}`} />
            <Chip label={`Thông tin ${todayAuditSummary.info}`} />
            <MuiButton variant="outlined" onClick={() => goToInsight({ targetLayer: "logs", targetTable: "audit_logs" })}>
              Mở Logs
            </MuiButton>
          </Stack>
          <Grid container spacing={1.25}>
            {(["critical", "warning", "info"] as const).map((severity) => {
              const group = todayAuditGroups[severity];
              const titleMap = { critical: "Nghiêm trọng", warning: "Cảnh báo", info: "Thông tin" } as const;
              return (
                <Grid key={severity} size={{ xs: 12, md: 4 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      bgcolor: "background.paper",
                      borderTop: "3px solid",
                      borderTopColor:
                        severity === "critical"
                          ? "error.main"
                          : severity === "warning"
                            ? "warning.main"
                            : "primary.main",
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {titleMap[severity]}
                        </Typography>
                        <Chip
                          size="small"
                          label={group.length}
                          color={severity === "critical" ? "error" : severity === "warning" ? "warning" : "default"}
                        />
                      </Stack>
                      <Stack spacing={0.75}>
                        {group.slice(0, 3).map((item) => (
                          <Box key={String(item.id || item.action)} sx={{ py: 0.25 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {String(item.action || "Log")}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(item.created_at || item.updated_at)}
                            </Typography>
                          </Box>
                        ))}
                        {!group.length ? (
                          <Typography variant="caption" color="text.secondary">
                            Không có sự kiện.
                          </Typography>
                        ) : null}
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Stack>
      </Section>
    </>
  );
}
