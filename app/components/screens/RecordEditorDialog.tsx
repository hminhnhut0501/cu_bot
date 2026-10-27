"use client";

import type { FormEvent } from "react";
import TabsBar from "../ui/TabsBar";
import {
  Alert,
  Box,
  Button as MuiButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  Edit3,
  Power,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  X,
  Check,
} from "lucide-react";
import type { FieldConfig, TableConfig } from "@/lib/tables";
import type { Lookups, Row } from "@/lib/cp-types";
import {
  advancedDetailRows,
  allowedGroupSectionsForLayer,
  auditLogRows,
  auditLogSummary,
  cockpitActivity,
  cockpitMetrics,
  detailRows,
  displayValue,
  fieldIsAdvanced,
  fieldUnitHint,
  groupedFields,
  groupTabLabel,
  healthState,
  previewText,
  scamReportFacts,
  sortGroupFieldGroups,
  titleFor,
  configFieldHint,
  configPlaceholders,
} from "@/lib/cp-helpers";
import { COMMAND_OPTIONS } from "@/lib/cp-constants";
import { UI_COPY } from "@/lib/uiCopy";
import { InspectorPanel } from "../module-screens";

export type RecordEditorDialogProps = {
  open: boolean;
  onClose: () => void;
  selected: Row | null;
  draft: Row;
  table: TableConfig;
  save: (event: FormEvent) => void;
  saving: boolean;
  showAdvancedFields: boolean;
  setShowAdvancedFields: React.Dispatch<React.SetStateAction<boolean>>;
  activeGroupTab: string;
  setActiveGroupTab: (tab: string) => void;
  activeLayer: string;
  lookups: Lookups;
  messagePools: string[];
  videoPools: string[];
  updateField: (field: FieldConfig, value: any) => void;
  remove: (row: Row) => void;
  startEdit: (row: Row) => void;
  toggleSelectedRowEnabled: () => void;
  confirmScamReport: (row: Row) => void;
  rejectScamReport: (row: Row) => void;
  readOnlyTable: boolean;
  setNotice: (text: string) => void;
  notice: string;
  groupEditorTabs: Array<{ key: string; label: string; count?: number }>;
  selectedScopeRow: Row | null;
  selectedScope: string;
  welcomeEnabled: boolean;
  welcomeText: string;
  welcomeDeleteSeconds: number;
  editorFieldGroups: Array<[string, FieldConfig[]]>;
  lookupOptionsForField: (field: FieldConfig) => any[] | null;
  commandField: (field: FieldConfig) => boolean;
  toggleCommand: (field: FieldConfig, command: string) => void;
};

export default function RecordEditorDialog({
  open,
  onClose,
  selected,
  draft,
  table,
  save,
  saving,
  showAdvancedFields,
  setShowAdvancedFields,
  activeGroupTab,
  setActiveGroupTab,
  activeLayer,
  lookups,
  messagePools,
  videoPools,
  updateField,
  remove,
  startEdit,
  toggleSelectedRowEnabled,
  confirmScamReport,
  rejectScamReport,
  readOnlyTable,
  setNotice,
  notice,
  groupEditorTabs,
  selectedScopeRow,
  selectedScope,
  welcomeEnabled,
  welcomeText,
  welcomeDeleteSeconds,
  editorFieldGroups,
  lookupOptionsForField,
  commandField,
  toggleCommand,
}: RecordEditorDialogProps) {
  const hasFocusedPanel = open;
  const closeFocusedPanel = onClose;

  return (
          <Dialog
            open={hasFocusedPanel}
            onClose={closeFocusedPanel}
            maxWidth="md"
            fullWidth
            scroll="paper"
            aria-labelledby="focused-panel-title"
            slotProps={{
              backdrop: {
                sx: { backgroundColor: "rgba(15, 23, 42, 0.32)" }
              },
              paper: {
                sx: {
                  borderRadius: 4,
                  bgcolor: "background.paper",
                  color: "text.primary",
                  boxShadow: "0 32px 80px rgba(15, 23, 42, 0.28)",
                  border: "1px solid",
                  borderColor: "divider"
                }
              }
            }}
          >
            <DialogTitle id="focused-panel-title" sx={{ pb: 1 }}>
              {Object.keys(draft).length ? "Thêm mới" : "Inspector vận hành"}
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              {Object.keys(draft).length ? (
                <form onSubmit={save}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 1.4 }}>
                        Form vận hành
                      </Typography>
                      <Typography variant="h5">{selected ? "Chỉnh sửa" : "Thêm mới"}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <MuiButton
                        variant={showAdvancedFields ? "contained" : "outlined"}
                        size="small"
                        onClick={() => setShowAdvancedFields((value) => !value)}
                      >
                        <SlidersHorizontal size={16} />
                        Advanced
                      </MuiButton>
                      <MuiButton variant="outlined" size="small" onClick={closeFocusedPanel} sx={{ minWidth: 0, px: 1.5 }}>
                        <X size={17} />
                      </MuiButton>
                    </Box>
                  </Box>
                  {!showAdvancedFields ? (
                    <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: "rgba(2, 132, 199, 0.08)" }}>
                      Đang ẩn field kỹ thuật như ID, timestamp, JSON settings và raw config key.
                    </Paper>
                  ) : null}
                  {table.key === "groups" ? (
                    <>
                      <TabsBar
                        tone="outlined"
                        wrapped={false}
                        scrollable
                        value={activeGroupTab}
                        onChange={(tab) => {
                          setActiveGroupTab(tab);
                          if (tab === "Kỹ thuật") {
                            setShowAdvancedFields(true);
                          }
                        }}
                        items={groupEditorTabs.map((tab) => ({
                          key: tab.label,
                          label: `${tab.label} (${tab.count ?? 0})`,
                        }))}
                        sx={{
                          mb: 2,
                          "& .MuiTabs-flexContainer": {
                            gap: 1,
                          },
                        }}
                      />
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <strong>Đây là setup cho group đang chọn.</strong> Group chỉ quản lý phạm vi hoạt động. Luật spam, mẫu tin và bio/link được quản lý tập trung ở module để tránh nhầm.
                      </Alert>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.75,
                          mb: 2,
                          bgcolor: "rgba(15, 118, 110, 0.08)",
                          borderColor: "rgba(15, 118, 110, 0.35)"
                        }}
                      >
                        <Stack spacing={1}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                              Welcome theo group đang chọn
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Mỗi group có bộ Welcome riêng. Bot runtime không còn dùng mẫu chung cho toàn bot.
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                            <Chip size="small" variant="outlined" label={`Group: ${selectedScopeRow ? String(selectedScopeRow.group_name || selectedScope) : selectedScope || "Chưa chọn"}`} />
                            <Chip size="small" color={welcomeEnabled ? "success" : "default"} label={welcomeEnabled ? "Welcome ON" : "Welcome OFF"} />
                            <Chip size="small" variant="outlined" label={welcomeText ? "Đã có mẫu tin riêng" : "Chưa có mẫu tin riêng"} />
                            <Chip size="small" variant="outlined" label={selectedScopeRow ? `Tự xóa sau ${welcomeDeleteSeconds}s` : "Chưa lưu Welcome cho group này"} />
                          </Stack>
                          {!selectedScopeRow ? (
                            <Alert severity="warning" sx={{ mt: 0.5 }}>
                              Group này chưa có cấu hình Welcome riêng. Hãy lưu group trước rồi mở module Welcome để tạo mẫu riêng cho group đó.
                            </Alert>
                          ) : null}
                        </Stack>
                      </Paper>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                        <Chip label="Giây: 300 = 5 phút" variant="outlined" />
                        <Chip label="0 = tắt / vĩnh viễn / không tự xóa" variant="outlined" />
                        <Chip label="warn = xóa tin vi phạm + cảnh báo" variant="outlined" />
                      </Box>
                    </>
                  ) : null}
                  <Box sx={{ display: "grid", gap: 2 }}>
                    {editorFieldGroups.map(([section, fields]) => (
                      <Paper
                        key={section}
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: "background.default",
                          backgroundImage: "linear-gradient(180deg, rgba(79, 70, 229, 0.04), transparent 34%)",
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ mb: 1.5, color: "text.secondary", textTransform: "uppercase", letterSpacing: 1.2 }}>
                          {section}
                        </Typography>
                        {fields.map((field) => {
                          const lookupOptions = lookupOptionsForField(field);
                          const fieldHint = [field.helper, fieldUnitHint(field), configFieldHint(String(field.key))].filter(Boolean).join(" · ");
                          return (
                            <Box key={field.key} sx={{ mb: 1.75 }}>
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 0.75 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{field.label}</Typography>
                                {field.type === "boolean" ? (
                                  <Switch checked={Boolean(draft[field.key])} onChange={(event) => updateField(field, event.target.checked)} />
                                ) : null}
                              </Box>
                              {field.type === "textarea" ? (
                                <>
                                  <TextField
                                    multiline
                                    minRows={field.key === "message" || field.key === "policy_text" || field.key === "value" ? 6 : 3}
                                    value={draft[field.key] ?? ""}
                                    onChange={(event) => updateField(field, event.target.value)}
                                    placeholder={field.placeholder}
                                    fullWidth
                                  />
                                  {configPlaceholders(field.key).length ? (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                                      Placeholder: {configPlaceholders(field.key).join(" · ")}
                                    </Typography>
                                  ) : null}
                                  {commandField(field) ? (
                                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                                      {COMMAND_OPTIONS.map((command) => {
                                        const selectedCommand = String(draft[field.key] || "").split(",").map((item) => item.trim()).includes(command);
                                        return (
                                          <MuiButton
                                            key={command}
                                            size="small"
                                            variant={selectedCommand ? "contained" : "outlined"}
                                            onClick={() => toggleCommand(field, command)}
                                          >
                                            {selectedCommand ? <Check size={13} /> : null}
                                            /{command}
                                          </MuiButton>
                                        );
                                      })}
                                    </Box>
                                  ) : null}
                                </>
                              ) : field.type === "boolean" ? (
                                null
                              ) : field.type === "select" || (Boolean(lookupOptions?.length) && !(table?.key === "bots" && field.key === "bot_key")) ? (
                                <TextField
                                  select
                                  fullWidth
                                  value={draft[field.key] ?? ""}
                                  slotProps={{
                                    select: {
                                      MenuProps: {
                                        disablePortal: true,
                                        slotProps: {
                                          paper: { sx: { maxHeight: 320, zIndex: 2000 } },
                                        },
                                      },
                                    },
                                  }}
                                  onChange={(event) => updateField(field, event.target.value)}
                                >
                                  <MenuItem value="">Mặc định</MenuItem>
                                  {(lookupOptions && lookupOptions.length ? lookupOptions : field.options?.map((option: string) => ({
                                    value: option,
                                    label: table.key === "keywords" && field.key === "action" && option === "delete"
                                      ? "Xóa tin + cộng cảnh báo"
                                      : option
                                  })) || []).map((option: { value: string; label: string }) => (
                                    <MenuItem key={option.value} value={option.value}>
                                      {option.label}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              ) : (
                                <TextField
                                  type={field.type === "number" ? "number" : "text"}
                                  value={draft[field.key] ?? ""}
                                  onChange={(event) => updateField(field, event.target.value)}
                                  placeholder={field.placeholder}
                                  fullWidth
                                />
                              )}
                              {fieldHint ? (
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                                  {fieldHint}
                                </Typography>
                              ) : null}
                            </Box>
                          );
                        })}
                      </Paper>
                    ))}
                  </Box>
                  <datalist id="bot-options">
                    {lookups.bots.map((bot) => (
                      <option key={bot.bot_key || bot.id} value={bot.bot_key || ""}>
                        {bot.name || bot.bot_key}
                      </option>
                    ))}
                  </datalist>
                  <datalist id="group-options">
                    {lookups.groups.map((group) => {
                      const groupId = group.group_id || "";
                      return (
                        <option key={groupId || group.id} value={groupId}>
                          {group.group_name || groupId}
                        </option>
                      );
                    })}
                  </datalist>
                  <datalist id="message-pool-options">
                    {messagePools.map((pool) => (
                      <option key={pool} value={pool} />
                    ))}
                  </datalist>
                  <datalist id="video-pool-options">
                    {videoPools.map((pool) => (
                      <option key={pool} value={pool} />
                    ))}
                  </datalist>
                  <DialogActions sx={{ px: 0, pt: 2 }}>
                    <MuiButton variant="outlined" onClick={closeFocusedPanel}>
                      Hủy
                    </MuiButton>
                    <MuiButton variant="contained" disabled={saving} type="submit" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={17} />}>
                      Lưu
                    </MuiButton>
                  </DialogActions>
                </form>
            ) : selected ? (
              <Box sx={{ display: "grid", gap: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                  <Box>
                      <Typography variant="overline" color="text.secondary">Control room</Typography>
                    <Chip label={healthState(selected).label} color="primary" variant="outlined" sx={{ ml: 1 }} />
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <MuiButton variant={showAdvancedFields ? "contained" : "outlined"} size="small" onClick={() => setShowAdvancedFields((value) => !value)}>
                      <SlidersHorizontal size={16} />
                      Advanced
                    </MuiButton>
                    <MuiButton variant="outlined" size="small" onClick={closeFocusedPanel} sx={{ minWidth: 0, px: 1.5 }}>
                      <X size={17} />
                    </MuiButton>
                  </Box>
                </Box>
                <Typography variant="h5">{titleFor(selected, table)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {readOnlyTable ? auditLogSummary(selected) : previewText(selected, table) || "Không có nội dung."}
                </Typography>
                {table.key === "scam_reports" ? (
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default", backgroundImage: "linear-gradient(180deg, rgba(225, 29, 72, 0.05), transparent 36%)" }}>
                    <Box sx={{ display: "grid", gap: 2 }}>
                      {scamReportFacts(selected).map((item) => (
                        <Box key={item.label} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                          <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.value}</Typography>
                        </Box>
                      ))}
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>Bằng chứng</Typography>
                        <Typography variant="body2" color="text.secondary">{displayValue(selected.evidence)}</Typography>
                      </Box>
                    </Box>
                  </Paper>
                ) : null}
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {cockpitMetrics(selected, table).map((metric) => (
                    <Paper
                      key={metric.label}
                      variant="outlined"
                      sx={{
                        px: 1.5,
                        py: 1,
                        bgcolor: "background.default",
                        minWidth: 120,
                        backgroundImage: "linear-gradient(180deg, rgba(15, 118, 110, 0.04), transparent 60%)",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">{metric.label}</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{metric.value}</Typography>
                    </Paper>
                  ))}
                </Box>
                {!readOnlyTable ? (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <MuiButton variant="contained" onClick={() => startEdit(selected)} startIcon={<Edit3 size={16} />}>
                      Sửa nhanh
                    </MuiButton>
                  {table.fields.some((field) => field.key === "enabled") ? (
                    <MuiButton variant="outlined" disabled={saving} onClick={toggleSelectedRowEnabled} startIcon={<Power size={16} />}>
                      {selected.enabled === false ? "Bật lại" : "Tắt"}
                    </MuiButton>
                  ) : null}
                  {table.key === "scam_reports" && selected.status !== "confirmed" ? (
                    <MuiButton variant="outlined" disabled={saving} onClick={() => confirmScamReport(selected)} startIcon={<ShieldCheck size={16} />}>
                      Xác nhận scam
                    </MuiButton>
                  ) : null}
                  {table.key === "scam_reports" && selected.status !== "confirmed" ? (
                    <MuiButton variant="outlined" onClick={() => startEdit(selected)} startIcon={<Edit3 size={16} />}>
                      Sửa trước khi xác nhận
                    </MuiButton>
                  ) : null}
                  {table.key === "scam_reports" && selected.status !== "rejected" ? (
                    <MuiButton variant="text" disabled={saving} onClick={() => rejectScamReport(selected)} startIcon={<X size={16} />}>
                      Từ chối report
                    </MuiButton>
                  ) : null}
                  <MuiButton variant="text" color="error" onClick={() => remove(selected)} startIcon={<Trash2 size={16} />}>
                    Xóa
                  </MuiButton>
                </Box>
                ) : null}
                <InspectorPanel
                  readOnlyTable={readOnlyTable}
                  selected={selected}
                  table={table}
                  showAdvancedFields={showAdvancedFields}
                  detailRows={detailRows(selected, table)}
                  advancedDetailRows={advancedDetailRows(selected, table)}
                  auditLogRows={auditLogRows(selected)}
                  cockpitActivity={cockpitActivity(selected, table)}
                  selectedEnabled={selected.enabled}
                  onToggleAdvanced={() => setShowAdvancedFields((value) => !value)}
                  onStartEdit={() => startEdit(selected)}
                  onConfirm={() => confirmScamReport(selected)}
                  onReject={() => rejectScamReport(selected)}
                  onDelete={() => remove(selected)}
                  onTest={() => setNotice(UI_COPY.inspector.testReady)}
                  noticeText={notice}
                />
              </Box>
            ) : null}
            </DialogContent>
          </Dialog>

  );
}
