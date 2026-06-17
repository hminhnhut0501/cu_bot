"use client";

import {
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  Switch,
  Typography,
  Button as MuiButton,
} from "@mui/material";
import { Edit3, MessageSquare, ShieldCheck, Sparkles, X } from "lucide-react";
import type { FormEvent } from "react";

import Section from "@/app/components/ui/Section";
import StatCard from "@/app/components/ui/StatCard";
import ConfigEditor, { type ConfigEditorDraft } from "@/app/components/screens/ConfigEditor";
import { type FieldType } from "@/lib/tables";

export type MenuRow = {
  id?: string | number;
  key?: string;
  value?: string | number | boolean | null;
  enabled?: boolean;
};

export type MenuDraft = ConfigEditorDraft;

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
          value={`${menuCommandRows.length} mục`}
          icon={<MessageSquare size={18} />}
        />
        <StatCard
          label="Nút Quy định"
          value={`${menuPolicyRows.length} mục`}
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
          >
          <Stack spacing={1}>
            {menuCommandRows.map((row) => (
              <ConfigRow
                key={String(row.id || row.key)}
                row={row}
                draft={draft}
                editorKind={editorKind}
                saving={saving}
                configLabel={props.configLabel}
                configDescription={props.configDescription}
                configDisplayValue={props.configDisplayValue}
                configSelectOptions={props.configSelectOptions}
                configPlaceholders={props.configPlaceholders}
                fieldUnitHint={props.fieldUnitHint}
                closeFocusedPanel={props.closeFocusedPanel}
                setDraft={props.setDraft}
                save={props.save}
                startEdit={props.startEdit}
                toggleConfigValue={props.toggleConfigValue}
                isConfigBoolean={props.isConfigBoolean}
              />
            ))}
          </Stack>
        </MenuControlCard>

        <MenuControlCard
          title="Nút Quy định"
          description="Nút inline nằm dưới tin /start và /help để mở nội quy nhóm."
          icon={<ShieldCheck size={20} />}
          actions={
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Switch
                disabled={saving}
                checked={policyButtonEnabled}
                onChange={() => props.toggleConfigValue(menuPolicyRows[0])}
              />
              <MuiButton
                size="small"
                variant="outlined"
                onClick={() => props.startEdit(menuPolicyRows[0])}
              >
                Sửa
              </MuiButton>
            </Stack>
          }
        >
          <Stack spacing={1}>
            {menuPolicyRows.map((row) => {
              const booleanValue = props.isConfigBoolean(row);
              const valueOn = String(row.value).toLowerCase() === "true";
              const rowEditing = hasDraft && String(draft.key || "") === String(row.key || "");
              return (
                <Box key={String(row.id || row.key)} sx={{ display: "grid", gap: 1 }}>
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: rowEditing ? "primary.main" : "divider",
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
                  {rowEditing ? (
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
                      <Stack spacing={1.5}>
                        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }} spacing={1.5}>
                          <Box>
                            <Typography variant="overline" color="text.secondary">Chỉnh sửa</Typography>
                            <Typography variant="h6">{props.configLabel(String(draft.key || ""))}</Typography>
                          </Box>
                          <IconButton size="small" onClick={props.closeFocusedPanel} title="Đóng">
                            <X size={17} />
                          </IconButton>
                        </Stack>
                        <ConfigEditor
                          draft={draft}
                          saving={saving}
                          editorKind={editorKind}
                          configSelectOptions={props.configSelectOptions}
                          configPlaceholders={props.configPlaceholders}
                          fieldUnitHint={props.fieldUnitHint}
                          setDraft={props.setDraft}
                          closeFocusedPanel={props.closeFocusedPanel}
                          save={props.save}
                        />
                      </Stack>
                    </Paper>
                  ) : null}
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
                draft={draft}
                editorKind={editorKind}
                saving={saving}
                configLabel={props.configLabel}
                configDescription={props.configDescription}
                configDisplayValue={props.configDisplayValue}
                configSelectOptions={props.configSelectOptions}
                configPlaceholders={props.configPlaceholders}
                fieldUnitHint={props.fieldUnitHint}
                closeFocusedPanel={props.closeFocusedPanel}
                setDraft={props.setDraft}
                save={props.save}
                startEdit={props.startEdit}
                toggleConfigValue={props.toggleConfigValue}
                isConfigBoolean={props.isConfigBoolean}
              />
            ))}
          </Stack>
        </MenuControlCard>
      </Box>
    </Section>
  );
}

function MenuControlCard({
  title,
  description,
  icon,
  actions,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  actions?: React.ReactNode;
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
          {actions ? <Box sx={{ flexShrink: 0 }}>{actions}</Box> : null}
        </Stack>
        {children}
      </Stack>
    </Paper>
  );
}

function ConfigRow({
  row,
  draft,
  editorKind,
  saving,
  configLabel,
  configDescription,
  configDisplayValue,
  configSelectOptions,
  configPlaceholders,
  fieldUnitHint,
  closeFocusedPanel,
  setDraft,
  save,
  startEdit,
  toggleConfigValue,
  isConfigBoolean,
}: {
  row: MenuRow;
  draft: MenuDraft;
  editorKind: string;
  saving: boolean;
  configLabel: (key: string) => string;
  configDescription: (row: MenuRow) => string;
  configDisplayValue: (row: MenuRow) => string;
  configSelectOptions: (key: string) => Array<{ value: string; label: string }>;
  configPlaceholders: (key: string) => string[];
  fieldUnitHint: (field: { key: string; label: string; type: FieldType }) => string;
  closeFocusedPanel: () => void;
  setDraft: (updater: (current: MenuDraft) => MenuDraft) => void;
  save: (event: FormEvent) => void;
  startEdit: (row: MenuRow) => void;
  toggleConfigValue?: (row: MenuRow) => void;
  isConfigBoolean?: (row: MenuRow) => boolean;
}) {
  const rowEditing = String(draft.key || "") === String(row.key || "");
  const booleanValue = isConfigBoolean?.(row);
  const valueOn = String(row.value).toLowerCase() === "true";
  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Box
        sx={{
          p: 1.25,
          borderRadius: 1,
          border: "1px solid",
          borderColor: rowEditing ? "primary.main" : "divider",
          bgcolor: "background.paper",
          opacity: row.enabled === false ? 0.6 : 1,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2">{configLabel(String(row.key || ""))}</Typography>
          <Typography variant="body2" color="text.secondary">{configDescription(row)}</Typography>
          <Typography variant="caption" color="text.primary" sx={{ fontWeight: 600 }}>
            {configDisplayValue(row)}
          </Typography>
        </Box>
        {booleanValue ? (
          <Switch
            disabled={saving}
            checked={valueOn}
            onChange={() => toggleConfigValue?.(row)}
          />
        ) : null}
        <IconButton size="small" onClick={() => startEdit(row)} title="Sửa">
          <Edit3 size={16} />
        </IconButton>
      </Box>
      {rowEditing ? (
        <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
          <Stack spacing={1.5}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }} spacing={1.5}>
              <Box>
                <Typography variant="overline" color="text.secondary">Chỉnh sửa</Typography>
                <Typography variant="h6">{configLabel(String(draft.key || ""))}</Typography>
              </Box>
              <IconButton size="small" onClick={closeFocusedPanel} title="Đóng">
                <X size={17} />
              </IconButton>
            </Stack>
            <ConfigEditor
              draft={draft}
              saving={saving}
              editorKind={editorKind}
              configSelectOptions={configSelectOptions}
              configPlaceholders={configPlaceholders}
              fieldUnitHint={fieldUnitHint}
              setDraft={setDraft}
              closeFocusedPanel={closeFocusedPanel}
              save={save}
            />
          </Stack>
        </Paper>
      ) : null}
    </Box>
  );
}
