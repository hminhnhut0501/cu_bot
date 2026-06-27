"use client";

import { Box, Stack, Typography } from "@mui/material";
import { Activity, Inbox } from "lucide-react";

import Section from "@/app/components/ui/Section";
import StatCard from "@/app/components/ui/StatCard";

export type AuditStats = {
  total: number;
  critical: number;
  warning: number;
  latestTime: string;
};

export default function AuditConsole({ auditStats }: { auditStats: AuditStats }) {
  return (
    <Section
      eyebrow="Operational audit"
      title="Nhật ký"
      subtitle="Xem log mới nhất."
      tone="analytics"
      icon={<Activity size={20} />}
    >
      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, minmax(0, 1fr))" },
        }}
      >
        <StatCard label="Tổng log" value={auditStats.total} />
        <StatCard label="Nghiêm trọng" value={auditStats.critical} tone="danger" />
        <StatCard label="Cần chú ý" value={auditStats.warning} tone="warning" />
        <StatCard label="Mới nhất" value={auditStats.latestTime} compact />
      </Box>
    </Section>
  );
}
