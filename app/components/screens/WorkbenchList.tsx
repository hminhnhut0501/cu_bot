"use client";

import { Box, Button as MuiButton, Checkbox, Chip, Paper, Stack, Typography } from "@mui/material";
import {
  Edit3,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";

import EmptyState from "@/app/components/ui/EmptyState";
import Section from "@/app/components/ui/Section";

type Row = Record<string, unknown>;

export type HealthInfo = { label: string; className: string };

export type WorkbenchListProps = {
  visibleRows: Row[];
  loading: boolean;
  scanMode: "scan" | "detail";
  selectedIds: Set<string>;
  toggleSelected: (id: unknown) => void;
  selected: Row | null;
  inspectRow: (row: Row) => void;
  table: { key: string; titleField?: string; summaryFields?: string[]; fields?: Array<{ key: string; label?: string }> } & Record<string, unknown>;
  readOnlyTable: boolean;
  titleFor: (row: Row, table: { key: string; [key: string]: unknown }) => string;
  previewText: (row: Row, table: { key: string; [key: string]: unknown }) => string;
  auditLogSummary: (row: Row) => string;
  healthState: (row: Row, tableKey?: string) => HealthInfo;
  actionBadge: (row: Row, table: { key: string; [key: string]: unknown }) => string;
  scamReportFacts: (row: Row) => Array<{ label: string; value: string }>;
  auditLogSeverity: (row: Row) => string;
  auditLogEssentials: (row: Row) => Array<{ label: string; value: string }>;
  fieldByKey: (table: { fields?: Array<{ key: string; label?: string }> } & Record<string, unknown>, key: string) => { key: string; label?: string } | undefined | undefined;
  displayValue: (value: unknown) => string;
  saving: boolean;
  queueChannelPost: (row: Row) => void;
  confirmScamReport: (row: Row) => void;
  startEdit: (row: Row) => void;
  remove: (row: Row) => void;
  emptyState: { title: string; body: string; action: string };
  startCreate: () => void;
};

export default function WorkbenchList(props: WorkbenchListProps) {
  const {
    visibleRows,
    loading,
    scanMode,
    selectedIds,
    toggleSelected,
    selected,
    inspectRow,
    table,
    readOnlyTable,
    titleFor,
    previewText,
    auditLogSummary,
    healthState,
    actionBadge,
    scamReportFacts,
    auditLogSeverity,
    auditLogEssentials,
    fieldByKey,
    displayValue,
    saving,
    queueChannelPost,
    confirmScamReport,
    startEdit,
    remove,
    emptyState,
    startCreate,
  } = props;

  return (
    <Section
      eyebrow={`${visibleRows.length} mục`}
      title={scanMode === "scan" ? "Scan mode" : "Detail mode"}
      subtitle={scanMode === "scan" ? "Chỉ hiện trạng thái chính" : "Hiện thêm ngữ cảnh"}
    >
      <Stack spacing={1.25}>
        {visibleRows.map((row) => {
          const id = String(row.id);
          const isSelected = selected?.id === row.id;
          const state = healthState(row, table.key);
          return (
            <Paper
              key={id}
              variant="outlined"
              onClick={() => inspectRow(row)}
              sx={{
                p: 1.5,
                bgcolor: "background.default",
                cursor: "pointer",
                borderColor: isSelected ? "primary.main" : "divider",
                opacity: row.enabled === false ? 0.7 : 1,
              }}
            >
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
                {!readOnlyTable ? (
                  <Checkbox
                    checked={selectedIds.has(id)}
                    onChange={() => toggleSelected(row.id)}
                    onClick={(event) => event.stopPropagation()}
                    size="small"
                  />
                ) : null}

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {titleFor(row, table)}
                    </Typography>
                    <Chip
                      size="small"
                      label={state.label}
                      color={stateColor(state.className)}
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {actionBadge(row, table)}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    {readOnlyTable ? auditLogSummary(row) : previewText(row, table) || "Chưa có nội dung mô tả."}
                  </Typography>
                  {table.key === "scam_reports" ? (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 0.5 }}>
                      {scamReportFacts(row).map((item) => (
                        <Box
                          key={item.label}
                          sx={{
                            px: 1,
                            py: 0.25,
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 1,
                            fontSize: 12,
                          }}
                        >
                          <strong>{item.label}</strong> {item.value}
                        </Box>
                      ))}
                    </Stack>
                  ) : readOnlyTable ? (
                    <Stack
                      direction="row"
                      spacing={1.25}
                      sx={{ alignItems: "center", mt: 0.5 }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: auditMarkerColor(auditLogSeverity(row)),
                        }}
                      />
                      {auditLogEssentials(row).slice(0, 4).map((item) => (
                        <Typography key={item.label} variant="caption" color="text.secondary">
                          <strong>{item.label}</strong> {item.value}
                        </Typography>
                      ))}
                    </Stack>
                  ) : scanMode === "detail" ? (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 0.5 }}>
                      {table.summaryFields?.slice(0, 2).map((key) => {
                        const field = fieldByKey(table, key);
                        return (
                          <Box
                            key={key}
                            sx={{
                              px: 1,
                              py: 0.25,
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 1,
                              fontSize: 12,
                            }}
                          >
                            <strong>{field?.label || key}</strong> {displayValue(row[key])}
                          </Box>
                        );
                      })}
                    </Stack>
                  ) : null}
                </Box>

                {!readOnlyTable ? (
                  <Stack direction="row" spacing={0.5}>
                    {table.key === "channel_posts" && row.status !== "pending" && row.status !== "sending" ? (
                      <MuiButton
                        size="small"
                        variant="text"
                        disabled={saving}
                        onClick={(event) => {
                          event.stopPropagation();
                          queueChannelPost(row);
                        }}
                        title="Gửi bài"
                      >
                        <Send size={16} />
                      </MuiButton>
                    ) : null}
                    {table.key === "scam_reports" && row.status !== "confirmed" ? (
                      <MuiButton
                        size="small"
                        variant="text"
                        disabled={saving}
                        onClick={(event) => {
                          event.stopPropagation();
                          confirmScamReport(row);
                        }}
                        title="Xác nhận scam"
                      >
                        <ShieldCheck size={16} />
                      </MuiButton>
                    ) : null}
                    <MuiButton
                      size="small"
                      variant="text"
                      onClick={(event) => {
                        event.stopPropagation();
                        startEdit(row);
                      }}
                      title="Sửa"
                    >
                      <Edit3 size={16} />
                    </MuiButton>
                    <MuiButton
                      size="small"
                      variant="text"
                      color="error"
                      onClick={(event) => {
                        event.stopPropagation();
                        remove(row);
                      }}
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </MuiButton>
                  </Stack>
                ) : null}
              </Stack>
            </Paper>
          );
        })}

        {!visibleRows.length && !loading ? (
          <EmptyState
            title={emptyState.title}
            body={emptyState.body}
            actionLabel={!readOnlyTable ? emptyState.action : undefined}
            onAction={!readOnlyTable ? startCreate : undefined}
          />
        ) : null}
      </Stack>
    </Section>
  );
}

function stateColor(className: string): "default" | "success" | "warning" | "error" | "info" {
  if (className === "ok" || className === "active") return "success";
  if (className === "warn" || className === "pending") return "warning";
  if (className === "error" || className === "failed") return "error";
  if (className === "info") return "info";
  return "default";
}

function auditMarkerColor(severity: string): string {
  if (severity === "critical") return "#dc2626";
  if (severity === "warning") return "#d97706";
  if (severity === "info") return "#2563eb";
  return "#475569";
}
