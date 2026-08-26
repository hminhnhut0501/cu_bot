"use client";

import { useState } from "react";

import { Box, Button as MuiButton, Checkbox, Chip, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { Edit3, Send, ShieldCheck, Trash2 } from "lucide-react";

import EmptyState from "@/app/components/ui/EmptyState";
import Section from "@/app/components/ui/Section";
import TabsBar from "@/app/components/ui/TabsBar";

type Row = Record<string, unknown>;

const LIST_CARD_SX = {
  p: 1.5,
  bgcolor: "background.default",
  backgroundImage: "linear-gradient(180deg, rgba(15, 118, 110, 0.04), transparent 42%)",
} as const;

const META_PILL_SX = {
  px: 1,
  py: 0.25,
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 1,
  fontSize: 12,
  bgcolor: "background.paper",
} as const;

export type HealthInfo = { label: string; className: string };

type AuditCardData = {
  time: string;
  action: string;
  severity: string;
  groupLabel: string;
  groupId: string;
  actorLabel: string;
  actorId: string;
  targetLabel: string;
  targetId: string;
  reason: string;
  brief: Array<{ label: string; value: string }>;
  raw: string;
};

export type WorkbenchListProps = {
  sectionTitle: string;
  sectionSubtitle?: string;
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
  auditLogCardData?: (row: Row) => AuditCardData;
  healthState: (row: Row, tableKey?: string) => HealthInfo;
  actionBadge: (row: Row, table: { key: string; [key: string]: unknown }) => string;
  scamReportFacts: (row: Row) => Array<{ label: string; value: string }>;
  auditLogSeverity: (row: Row) => string;
  auditLogDetails: (row: Row) => Array<{ label: string; value: string }>;
  auditLogEssentials: (row: Row) => Array<{ label: string; value: string }>;
  auditActionTone: (action: string) => "error" | "warning" | "success" | "info" | "default";
  fieldByKey: (table: { fields?: Array<{ key: string; label?: string }> } & Record<string, unknown>, key: string) => { key: string; label?: string } | undefined | undefined;
  displayValue: (value: unknown) => string;
  saving: boolean;
  queueChannelPost: (row: Row) => void;
  confirmScamReport: (row: Row) => void;
  startEdit: (row: Row) => void;
  remove: (row: Row) => void;
  emptyState: { title: string; body: string; action: string };
  startCreate: () => void;
  filterTabs?: Array<{ key: string; label: string }>;
  activeFilter?: string;
  onChangeFilter?: (value: string) => void;
};

export default function WorkbenchList(props: WorkbenchListProps) {
  const {
    visibleRows,
    loading,
    scanMode,
    sectionTitle,
    sectionSubtitle,
    selectedIds,
    toggleSelected,
    selected,
    inspectRow,
    table,
    readOnlyTable,
    titleFor,
    previewText,
    auditLogSummary,
    auditLogCardData,
    healthState,
    actionBadge,
    scamReportFacts,
    auditLogSeverity,
    auditLogDetails,
    auditLogEssentials,
    auditActionTone,
    fieldByKey,
    displayValue,
    saving,
    queueChannelPost,
    confirmScamReport,
    startEdit,
    remove,
    emptyState,
    startCreate,
    filterTabs,
    activeFilter,
    onChangeFilter,
  } = props;
  const [expandedAuditIds, setExpandedAuditIds] = useState<Set<string>>(() => new Set());

  const toggleAuditDetails = (rowId: string) => {
    setExpandedAuditIds((current) => {
      const next = new Set(current);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  return (
    <Section
      eyebrow={`${visibleRows.length} mục`}
      title={sectionTitle}
      subtitle={sectionSubtitle || (scanMode === "scan" ? "Chỉ hiện trạng thái chính" : "Hiện thêm ngữ cảnh")}
      tone={table.key === "scam_reports" ? "scam" : table.key === "audit_logs" ? "analytics" : "main"}
    >
      <Stack spacing={1.25}>
        {filterTabs?.length && activeFilter !== undefined && onChangeFilter ? (
          <TabsBar
            items={filterTabs.map((filter) => ({ key: filter.key, label: filter.label }))}
            value={activeFilter}
            onChange={onChangeFilter}
            scrollable
            wrapped
            tone="filled"
          />
        ) : null}

        {visibleRows.map((row) => {
          const id = String(row.id);
          const isSelected = selected?.id === row.id;
          const state = healthState(row, table.key);
          const isAuditCard = readOnlyTable && table.key === "audit_logs" && auditLogCardData;
          const auditData = isAuditCard ? auditLogCardData(row) : null;
          const isAuditExpanded = expandedAuditIds.has(id);

          return (
            <Paper
              key={id}
              variant="outlined"
              onClick={() => inspectRow(row)}
              sx={{
                ...LIST_CARD_SX,
                cursor: "pointer",
                borderColor: isSelected ? "primary.main" : "divider",
                opacity: row.enabled === false ? 0.7 : 1,
                transition: "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
                "&:hover": {
                  transform: "translateY(-1px)",
                  borderColor: "primary.main",
                  boxShadow: "0 12px 26px rgba(15, 23, 42, 0.05)",
                },
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
                  {isAuditCard && auditData ? (
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                          {titleFor(row, table)}
                        </Typography>
                        <Chip size="small" label={state.label} color={stateColor(state.className)} variant="outlined" />
                        <Chip size="small" label={auditSeverityLabel(auditData.severity)} color={auditSeverityColor(auditData.severity)} />
                        <Typography variant="caption" color="text.secondary">
                          {actionBadge(row, table)}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", alignItems: "center" }}>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120 }}>
                          {auditData.time}
                        </Typography>
                        <Chip size="small" variant="filled" color={auditActionTone(auditData.action)} label={auditData.action} />
                        <Tooltip title={`Group ID: ${auditData.groupId || "-"}`}>
                          <Chip size="small" variant="outlined" label={`Group: ${auditData.groupLabel}`} />
                        </Tooltip>
                        <Tooltip title={`User ID: ${auditData.targetId || "-"}`}>
                          <Chip size="small" variant="outlined" label={`User: ${auditData.targetLabel}`} />
                        </Tooltip>
                        <MuiButton
                          size="small"
                          variant="text"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleAuditDetails(id);
                          }}
                        >
                          {isAuditExpanded ? "Thu gọn" : "Chi tiết"}
                        </MuiButton>
                      </Stack>

                      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          Người thực hiện: {auditData.actorLabel}
                        </Typography>
                        {auditData.actorId ? (
                          <Typography variant="caption" color="text.secondary">
                            ({auditData.actorId})
                          </Typography>
                        ) : null}
                        <Typography variant="body2" color="text.secondary">
                          · Lý do: {auditData.reason}
                        </Typography>
                      </Stack>

                      {isAuditExpanded ? (
                        <Stack spacing={0.75} sx={{ mt: 0.25 }}>
                          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                            {auditLogEssentials(row).map((item) => (
                              <Typography key={item.label} variant="caption" color="text.secondary">
                                <strong>{item.label}</strong> {item.value}
                              </Typography>
                            ))}
                          </Stack>
                          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                            {auditLogDetails(row).map((item) => (
                              <Typography key={`${item.label}-${item.value}`} variant="caption" color="text.secondary">
                                <strong>{item.label}</strong> {item.value}
                              </Typography>
                            ))}
                          </Stack>
                        </Stack>
                      ) : auditData.brief.length ? (
                        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                          {auditData.brief.map((item) => (
                            <Typography key={item.label} variant="caption" color="text.secondary">
                              <strong>{item.label}</strong> {item.value}
                            </Typography>
                          ))}
                        </Stack>
                      ) : null}
                    </Stack>
                  ) : (
                    <>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {titleFor(row, table)}
                        </Typography>
                        <Chip size="small" label={state.label} color={stateColor(state.className)} variant="outlined" />
                        <Typography variant="caption" color="text.secondary">
                          {actionBadge(row, table)}
                        </Typography>
                      </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.7 }}>
                          {readOnlyTable ? auditLogSummary(row) : previewText(row, table) || "Chưa có nội dung mô tả."}
                        </Typography>
                      {table.key === "scam_reports" ? (
                        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 0.5 }}>
                          {scamReportFacts(row).map((item) => (
                            <Box
                              key={item.label}
                              sx={META_PILL_SX}
                            >
                              <strong>{item.label}</strong> {item.value}
                            </Box>
                          ))}
                        </Stack>
                      ) : readOnlyTable ? (
                        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mt: 0.5, flexWrap: "wrap" }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: auditMarkerColor(auditLogSeverity(row)) }} />
                          {auditLogEssentials(row).slice(0, 2).map((item) => (
                            <Typography key={item.label} variant="caption" color="text.secondary" sx={{ display: "inline-flex", gap: 0.5 }}>
                              <strong>{item.label}</strong> {item.value}
                            </Typography>
                          ))}
                          <MuiButton
                            size="small"
                            variant="text"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleAuditDetails(id);
                            }}
                          >
                            {isAuditExpanded ? "Thu gọn" : "Mở metadata"}
                          </MuiButton>
                          {isAuditExpanded ? (
                            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                              {auditLogDetails(row).map((item) => (
                                <Typography key={`${item.label}-${item.value}`} variant="caption" color="text.secondary" sx={{ display: "inline-flex", gap: 0.5 }}>
                                  <strong>{item.label}</strong> {item.value}
                                </Typography>
                              ))}
                            </Stack>
                          ) : null}
                        </Stack>
                      ) : scanMode === "detail" ? (
                        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 0.5 }}>
                          {table.summaryFields?.slice(0, 2).map((key) => {
                            const field = fieldByKey(table, key);
                            return (
                              <Box
                                key={key}
                                sx={META_PILL_SX}
                              >
                                <strong>{field?.label || key}</strong> {displayValue(row[key])}
                              </Box>
                            );
                          })}
                        </Stack>
                      ) : null}
                    </>
                  )}
                </Box>

                {!readOnlyTable ? (
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
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

function auditSeverityLabel(severity: string) {
  if (severity === "critical") return "Nghiêm trọng";
  if (severity === "warning") return "Cảnh báo";
  if (severity === "info") return "Thông tin";
  return "Trung tính";
}

function auditSeverityColor(severity: string): "default" | "success" | "warning" | "error" | "info" {
  if (severity === "critical") return "error";
  if (severity === "warning") return "warning";
  if (severity === "info") return "info";
  return "default";
}
