"use client";

import { Box } from "@mui/material";
import { Inbox } from "lucide-react";

import Section from "@/app/components/ui/Section";
import StatCard from "@/app/components/ui/StatCard";

export type ScamInboxStats = {
  pending: number;
  confirmed: number;
  rejected: number;
};

export default function ScamInbox({ scamInboxStats }: { scamInboxStats: ScamInboxStats }) {
  return (
    <Section
      eyebrow="Phase 4 review inbox"
      title="Duyệt report"
      subtitle="Xử lý report pending."
      icon={<Inbox size={20} />}
    >
      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: { xs: "1fr 1fr 1fr" },
        }}
      >
        <StatCard label="Chờ duyệt" value={scamInboxStats.pending} tone="warning" />
        <StatCard label="Đã xác nhận" value={scamInboxStats.confirmed} tone="success" />
        <StatCard label="Từ chối" value={scamInboxStats.rejected} tone="danger" />
      </Box>
    </Section>
  );
}
