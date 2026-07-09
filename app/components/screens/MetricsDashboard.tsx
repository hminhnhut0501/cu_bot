"use client";

import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { Activity, BarChart3, ShieldCheck, TrendingDown, TrendingUp, UserMinus, UserPlus, Users } from "lucide-react";

import Section from "@/app/components/ui/Section";
import StatCard from "@/app/components/ui/StatCard";
import EmptyState from "@/app/components/ui/EmptyState";

export type MetricGroup = [string, Array<Record<string, unknown>>];

type AnalyticsPeriodStats = {
  joins: number;
  leaves: number;
  netGrowth: number;
  joinRequests: number;
  deletedMessages: number;
  deleteFailures: number;
  warns: number;
  restricts: number;
  bans: number;
  kicks: number;
  verifiedMembers: number;
  violations: number;
  uniqueViolators: number;
  scamReports: number;
  scamPending: number;
  scamConfirmed: number;
  scamRejected: number;
  activeMembers: number;
  memberCount: number;
};

export type AnalyticsSummary = {
  generatedAt?: string;
  timezone?: string;
  periods?: Record<"today" | "month" | "year", AnalyticsPeriodStats>;
  health?: {
    activeGroups?: number;
    auditRowsInYear?: number;
    deleteFailureRateToday?: number;
  };
  topActionsToday?: Array<{ action: string; count: number }>;
  topGroupsToday?: Array<{ chatId: string; joins: number; leaves: number; violations: number }>;
  latestEvents?: Array<Record<string, unknown>>;
};

export type MetricsDashboardProps = {
  dashboardRows: Array<Record<string, unknown>>;
  loading: boolean;
  metricPeriod: (period: string) => string;
  metricValue: (row: Record<string, unknown>) => string;
  metricLabel: (key: string) => string;
  metricGroups: MetricGroup[];
  analyticsSummary?: AnalyticsSummary | null;
  analyticsLoading?: boolean;
  groupNameForId?: (groupId: string) => string;
};

function formatNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toLocaleString("vi-VN") : "0";
}

function percent(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? `${Math.round(number * 100)}%` : "0%";
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    member_joined: "Vào group",
    member_left: "Rời group",
    member_join_request: "Xin vào",
    delete_message: "Xóa tin",
    delete_message_failed: "Xóa lỗi",
    warn: "Cảnh báo",
    restrict: "Cấm chat",
    forward_restrict: "Cấm do forward",
    ban: "Ban",
    kick: "Kick",
    verify_success: "Verify OK",
    welcome_sent: "Welcome",
  };
  return labels[action] || action;
}

export default function MetricsDashboard({
  dashboardRows,
  loading,
  metricPeriod,
  metricValue,
  metricLabel,
  metricGroups,
  analyticsSummary,
  analyticsLoading = false,
  groupNameForId,
}: MetricsDashboardProps) {
  const summary = dashboardRows.slice(0, 4);
  const periods = analyticsSummary?.periods;
  const today = periods?.today;
  const month = periods?.month;
  const year = periods?.year;

  if (today && month && year) {
    const primaryCards = [
      { label: "Join hôm nay", value: today.joins, hint: `Tháng này ${formatNumber(month.joins)} · Năm ${formatNumber(year.joins)}`, icon: <UserPlus size={18} />, tone: "success" as const },
      { label: "Out hôm nay", value: today.leaves, hint: `Tháng này ${formatNumber(month.leaves)} · Net ${formatNumber(month.netGrowth)}`, icon: <UserMinus size={18} />, tone: "warning" as const },
      { label: "Active hôm nay", value: today.activeMembers, hint: `Tháng này ${formatNumber(month.activeMembers)} · Tổng member ${formatNumber(today.memberCount)}`, icon: <Users size={18} />, tone: "info" as const },
      { label: "Ban / cấm chat", value: today.bans + today.restricts, hint: `Ban ${formatNumber(today.bans)} · Cấm chat ${formatNumber(today.restricts)}`, icon: <ShieldCheck size={18} />, tone: "primary" as const },
    ];
    const moderationCards = [
      { label: "Người vi phạm", value: today.uniqueViolators, hint: `${formatNumber(today.violations)} sự kiện hôm nay` },
      { label: "Tin đã xóa", value: today.deletedMessages, hint: `Lỗi xóa ${formatNumber(today.deleteFailures)} · Tỷ lệ ${percent(analyticsSummary?.health?.deleteFailureRateToday)}` },
      { label: "Cảnh báo", value: today.warns, hint: `Tháng này ${formatNumber(month.warns)}` },
      { label: "Kick", value: today.kicks, hint: `Tháng này ${formatNumber(month.kicks)}` },
      { label: "Verify thành công", value: today.verifiedMembers, hint: `Tháng này ${formatNumber(month.verifiedMembers)}` },
      { label: "Join request", value: today.joinRequests, hint: `Tháng này ${formatNumber(month.joinRequests)}` },
      { label: "Report scam", value: today.scamReports, hint: `Chờ ${formatNumber(today.scamPending)} · Xác nhận ${formatNumber(today.scamConfirmed)}` },
    ];

    return (
      <Section
        eyebrow="Dashboard vận hành"
        title="Thống kê thật từ nhật ký bot"
        subtitle="Aggregate trực tiếp từ audit_logs và các bảng vận hành hiện có. Mốc ngày/tháng/năm dùng giờ Việt Nam."
        tone="analytics"
        icon={<BarChart3 size={20} />}
        actions={analyticsLoading ? <Chip size="small" label="Đang cập nhật" /> : <Chip size="small" label={`TZ: ${analyticsSummary?.timezone || "Asia/Ho_Chi_Minh"}`} />}
      >
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, minmax(0, 1fr))" },
          }}
        >
          {primaryCards.map((item) => (
            <StatCard key={item.label} label={item.label} value={formatNumber(item.value)} hint={item.hint} icon={item.icon} tone={item.tone} />
          ))}
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, minmax(0, 1fr))" },
          }}
        >
          {moderationCards.map((item) => (
            <StatCard key={item.label} compact label={item.label} value={formatNumber(item.value)} hint={item.hint} />
          ))}
        </Box>

        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" } }}>
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <TrendingUp size={17} />
                <Typography variant="subtitle2">Top hành động hôm nay</Typography>
              </Stack>
              {analyticsSummary?.topActionsToday?.length ? analyticsSummary.topActionsToday.map((item) => (
                <Stack key={item.action} direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">{actionLabel(item.action)}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{formatNumber(item.count)}</Typography>
                </Stack>
              )) : (
                <Typography variant="body2" color="text.secondary">Hôm nay chưa có log vận hành trong scope này.</Typography>
              )}
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <TrendingDown size={17} />
                <Typography variant="subtitle2">Group nổi bật hôm nay</Typography>
              </Stack>
              {analyticsSummary?.topGroupsToday?.length ? analyticsSummary.topGroupsToday.map((item) => (
                <Stack key={item.chatId} direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">{groupNameForId?.(item.chatId) || item.chatId}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    +{formatNumber(item.joins)} / -{formatNumber(item.leaves)} / lỗi {formatNumber(item.violations)}
                  </Typography>
                </Stack>
              )) : (
                <Typography variant="body2" color="text.secondary">Chưa có group nào phát sinh join/out/vi phạm hôm nay.</Typography>
              )}
            </Stack>
          </Paper>
        </Box>
      </Section>
    );
  }

  return (
    <Section
      eyebrow="Dashboard vận hành"
      title="Số liệu & chỉ số"
      subtitle="Dữ liệu lấy từ bảng bot_metrics trong Supabase."
      tone="analytics"
      icon={<BarChart3 size={20} />}
    >
      {summary.length ? (
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, minmax(0, 1fr))" },
          }}
        >
          {summary.map((row, index) => {
            const Icon = index % 3 === 0 ? Users : index % 3 === 1 ? Activity : TrendingUp;
            return (
              <StatCard
                key={String(row.id || `${row.metric_key}-${row.period}`)}
                label={metricLabel(String(row.metric_key || ""))}
                value={metricValue(row)}
                hint={metricPeriod(String(row.period || ""))}
                icon={<Icon size={18} />}
                tone={index % 4 === 0 ? "primary" : index % 4 === 1 ? "info" : index % 4 === 2 ? "success" : "warning"}
              />
            );
          })}
        </Box>
      ) : !loading ? (
        <EmptyState
          icon={<ShieldCheck size={20} />}
          title="Chưa có dữ liệu thống kê"
          body="Bấm Thêm để tạo chỉ số đầu tiên."
        />
      ) : null}

      {metricGroups.length ? (
        <Stack spacing={1.5}>
          {metricGroups.map(([period, items]) => (
            <Box key={period}>
              <Typography variant="subtitle2" sx={{ mb: 0.75, textTransform: "uppercase", letterSpacing: 0.6, color: "text.secondary" }}>
                {metricPeriod(period)}
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gap: 1.25,
                  gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, minmax(0, 1fr))" },
                }}
              >
                {items.map((row) => (
                  <StatCard
                    key={String(row.id || row.metric_key)}
                    compact
                    label={metricLabel(String(row.metric_key || ""))}
                    value={metricValue(row)}
                  />
                ))}
              </Box>
            </Box>
          ))}
        </Stack>
      ) : null}
    </Section>
  );
}
