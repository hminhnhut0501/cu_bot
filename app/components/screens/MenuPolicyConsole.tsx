"use client";

import {
  Box,
  Button as MuiButton,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Edit3, MessageSquare, ShieldCheck, Sparkles, X } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";

import Section from "@/app/components/ui/Section";
import StatCard from "@/app/components/ui/StatCard";
import { type FieldType } from "@/lib/tables";

export type MenuRow = {
  id?: string | number;
  key?: string;
  value?: string | number | boolean | null;
  enabled?: boolean;
};

export type MenuDraft = {
  key?: string;
  value?: string | number | boolean | null;
  enabled?: boolean;
};

export type MenuPolicyConsoleProps = {
  menuCommandsEnabled: boolean;
  policyButtonEnabled: boolean;
  menuCommandRows: MenuRow[];
  menuPolicyRows: MenuRow[];
  menuContentRows: MenuRow[];
  draft: MenuDraft;
  saving: boolean;
  isConfigBoolean: (row: MenuRow) => boolean;
  configLabel: (key: string) => string;
  configDescription: (row: MenuRow) => string;
  configDisplayValue: (row: MenuRow) => string;
  configEditorKind: (key: string) => string;
  configSelectOptions: (key: string) => Array<{ value: string; label: string }>;
  configPlaceholders: (key: string) => string[];
  fieldUnitHint: (field: { key: string; label: string; type: FieldType }) => string;
  toggleConfigValue: (row: MenuRow) => void;
  startEdit: (row: MenuRow) => void;
  closeFocusedPanel: () => void;
  setDraft: (updater: (current: MenuDraft) => MenuDraft) => void;
  save: (event: FormEvent) => void;
};

export default function MenuPolicyConsole(props: MenuPolicyConsoleProps) {
  const {
    menuCommandsEnabled,
    policyButtonEnabled,
    menuCommandRows,
    menuPolicyRows,
    menuContentRows,
    draft,
    saving,
  } = props;
  const editorKind = props.configEditorKind(String(draft.key || ""));
  const booleanDraftValue = String(draft.value).toLowerCase() === "true";
  const hasDraft = Object.keys(draft).length > 0;

  return (
    <Section
      eyebrow="Menu & nội quy"
      title="Điều khiển những gì user thấy khi gõ `/` hoặc `/start`"
      subtitle="Tắt menu lệnh Telegram sẽ xóa danh sách /start, /help, /policy khỏi khung gợi ý của Telegram sau khi bot sync."
    >
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr 1fr" },
        }}
      >
        <StatCard
          label="Menu lệnh"
          value={menuCommandsEnabled ? "Đang hiện" : "Đang ẩn"}
          tone={menuCommandsEnabled ? "success" : "warning"}
          icon={<MessageSquare size={18} />}
        />
        <StatCard
          label="Nút Quy định"
          value={policyButtonEnabled ? "Đang hiện" : "Đang ẩn"}
          tone={policyButtonEnabled ? "success" : "warning"}
          icon={<ShieldCheck size={18} />}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <MenuControlCard
          title="Menu lệnh Telegram"
          description="Danh sách lệnh hiện trong khung gợi ý khi thành viên gõ dấu /."
          icon={<MessageSquare size={20} />}
          status={menuCommandsEnabled ? "Đang hiện" : "Đang ẩn"}
          statusTone={menuCommandsEnabled ? "success" : "default"}
        >
          <Stack spacing={1}>
            {menuCommandRows.map((row) => (
              <ConfigRow
                key={String(row.id || row.key)}
                row={row}
                {...props}
              />
            ))}
          </Stack>
        </MenuControlCard>

        <MenuControlCard
          title="Nút Quy định"
          description="Nút inline nằm dưới tin /start và /help để mở nội quy nhóm."
          icon={<ShieldCheck size={20} />}
          status={policyButtonEnabled ? "Đang hiện" : "Đang ẩn"}
          statusTone={policyButtonEnabled ? "success" : "default"}
        >
          <Stack spacing={1}>
            {menuPolicyRows.map((row) => {
              const booleanValue = props.isConfigBoolean(row);
              const valueOn = String(row.value).toLowerCase() === "true";
              return (
                <Box
                  key={String(row.id || row.key)}
                  sx={{
                    p: 1.25,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.default",
                    opacity: row.enabled === false ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2">{props.configLabel(String(row.key || ""))}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {props.configDescription(row)}
                    </Typography>
                    <Typography variant="caption" color="text.primary" sx={{ fontWeight: 600 }}>
                      {props.configDisplayValue(row)}
                    </Typography>
                  </Box>
                  {booleanValue ? (
                    <Switch
                      disabled={saving}
                      checked={valueOn}
                      onChange={() => props.toggleConfigValue(row)}
                    />
                  ) : null}
                  <IconButton size="small" onClick={() => props.startEdit(row)} title="Sửa">
                    <Edit3 size={16} />
                  </IconButton>
                </Box>
              );
            })}
          </Stack>
        </MenuControlCard>

        <MenuControlCard
          title="Nội dung trả lời"
          description="Text fallback khi /start chưa có tin nhắn random và nội dung liên quan."
          icon={<Sparkles size={20} />}
        >
          <Stack spacing={1}>
            {menuContentRows.map((row) => (
              <ConfigRow
                key={String(row.id || row.key)}
                row={row}
                {...props}
              />
            ))}
          </Stack>
        </MenuControlCard>
      </Box>

      {hasDraft ? (
        <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
          <Stack spacing={2}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }} spacing={1.5}>
              <Box>
                <Typography variant="overline" color="text.secondary">Chỉnh sửa</Typography>
                <Typography variant="h6">{props.configLabel(String(draft.key || ""))}</Typography>
              </Box>
              <IconButton size="small" onClick={props.closeFocusedPanel} title="Đóng">
                <X size={17} />
              </IconButton>
            </Stack>

            <Box component="form" onSubmit={props.save}>
              <Stack spacing={2}>
                {editorKind === "boolean" ? (
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Typography variant="body2" sx={{ minWidth: 140 }}>Trạng thái</Typography>
                    <Switch
                      checked={booleanDraftValue}
                      onChange={() =>
                        props.setDraft((current) => ({
                          ...current,
                          value: String(current.value).toLowerCase() === "true" ? "false" : "true",
                        }))
                      }
                    />
                    <Typography variant="body2">{booleanDraftValue ? "Bật" : "Tắt"}</Typography>
                  </Stack>
                ) : editorKind === "select" ? (
                  <TextField
                    select
                    label="Chọn giá trị cố định"
                    size="small"
                    value={String(draft.value ?? "")}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      props.setDraft((current) => ({ ...current, value: event.target.value }))
                    }
                  >
                    {props.configSelectOptions(String(draft.key || "")).map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : editorKind === "number" ? (
                  <TextField
                    type="number"
                    label="Nhập giá trị số"
                    size="small"
                    value={String(draft.value ?? "")}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      props.setDraft((current) => ({ ...current, value: event.target.value }))
                    }
                    helperText={props.fieldUnitHint({ key: String(draft.key || ""), label: "", type: "number" })}
                  />
                ) : (
                  <Stack spacing={0.5}>
                    <TextField
                      multiline
                      minRows={String(draft.value || "").length > 120 ? 6 : 3}
                      label="Nhập nội dung / giá trị"
                      value={draft.value ?? ""}
                      onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                        props.setDraft((current) => ({ ...current, value: event.target.value }))
                      }
                    />
                    {props.configPlaceholders(String(draft.key || "")).length ? (
                      <Typography variant="caption" color="text.secondary">
                        Placeholder: {props.configPlaceholders(String(draft.key || "")).join(" · ")}
                      </Typography>
                    ) : null}
                  </Stack>
                )}

                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Typography variant="body2" sx={{ minWidth: 140 }}>Kích hoạt cấu hình này</Typography>
                  <Switch
                    checked={Boolean(draft.enabled)}
                    onChange={() =>
                      props.setDraft((current) => ({ ...current, enabled: !current.enabled }))
                    }
                  />
                </Stack>

                <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                  <MuiButton variant="text" onClick={props.closeFocusedPanel}>Hủy</MuiButton>
                  <MuiButton type="submit" variant="contained" disabled={saving}>Lưu</MuiButton>
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      ) : null}
    </Section>
  );
}

function MenuControlCard({
  title,
  description,
  icon,
  status,
  statusTone,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  status?: string;
  statusTone?: "success" | "default" | "warning";
  children: React.ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
          <Box sx={{ color: "primary.main", pt: 0.4 }}>{icon}</Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" color="text.secondary">{description}</Typography>
          </Box>
          {status ? (
            <Chip
              size="small"
              color={statusTone === "success" ? "success" : "default"}
              label={status}
            />
          ) : null}
        </Stack>
        {children}
      </Stack>
    </Paper>
  );
}

function ConfigRow({
  row,
  configLabel,
  configDescription,
  configDisplayValue,
  startEdit,
}: {
  row: MenuRow;
  configLabel: (key: string) => string;
  configDescription: (row: MenuRow) => string;
  configDisplayValue: (row: MenuRow) => string;
  startEdit: (row: MenuRow) => void;
  toggleConfigValue?: (row: MenuRow) => void;
  isConfigBoolean?: (row: MenuRow) => boolean;
  setDraft?: (updater: (current: MenuDraft) => MenuDraft) => void;
  closeFocusedPanel?: () => void;
  save?: (event: FormEvent) => void;
  saving?: boolean;
  configEditorKind?: (key: string) => string;
  configSelectOptions?: (key: string) => Array<{ value: string; label: string }>;
  configPlaceholders?: (key: string) => string[];
  fieldUnitHint?: (field: { key: string; label: string; type: FieldType }) => string;
  draft?: MenuDraft;
}) {
  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        opacity: row.enabled === false ? 0.6 : 1,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2">{configLabel(String(row.key || ""))}</Typography>
        <Typography variant="body2" color="text.secondary">
          {configDescription(row)}
        </Typography>
        <Typography variant="caption" color="text.primary" sx={{ fontWeight: 600 }}>
          {configDisplayValue(row)}
        </Typography>
      </Box>
      <IconButton size="small" onClick={() => startEdit(row)} title="Sửa">
        <Edit3 size={16} />
      </IconButton>
    </Box>
  );
}
