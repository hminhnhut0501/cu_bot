"use client";

import { Box, Stack, Typography } from "@mui/material";
import { Activity, BarChart3, ShieldCheck, TrendingUp, Users } from "lucide-react";

import Section from "@/app/components/ui/Section";
import StatCard from "@/app/components/ui/StatCard";
import EmptyState from "@/app/components/ui/EmptyState";

export type MetricGroup = [string, Array<Record<string, unknown>>];

export type MetricsDashboardProps = {
  dashboardRows: Array<Record<string, unknown>>;
  loading: boolean;
  metricPeriod: (period: string) => string;
  metricValue: (row: Record<string, unknown>) => string;
  metricLabel: (key: string) => string;
  metricGroups: MetricGroup[];
};

export default function MetricsDashboard({
  dashboardRows,
  loading,
  metricPeriod,
  metricValue,
  metricLabel,
  metricGroups,
}: MetricsDashboardProps) {
  const summary = dashboardRows.slice(0, 4);
  return (
    <Section
      eyebrow="Dashboard vận hành"
      title="Số liệu & chỉ số"
      subtitle="Dữ liệu lấy từ bảng bot_metrics trong Supabase."
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
