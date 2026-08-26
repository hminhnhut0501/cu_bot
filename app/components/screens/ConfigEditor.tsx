"use client";

import {
  Box,
  Button as MuiButton,
  Checkbox,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Save } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";

import { type FieldType } from "@/lib/tables";

export type ConfigEditorDraft = {
  key?: string;
  value?: string | number | boolean | null;
  enabled?: boolean;
};

export type ConfigEditorProps = {
  draft: ConfigEditorDraft;
  saving: boolean;
  editorKind: string;
  configSelectOptions: (key: string) => Array<{ value: string; label: string }>;
  configPlaceholders: (key: string) => string[];
  fieldUnitHint: (field: { key: string; label: string; type: FieldType }) => string;
  setDraft: (updater: (current: ConfigEditorDraft) => ConfigEditorDraft) => void;
  closeFocusedPanel: () => void;
  save: (event: FormEvent) => void;
};

/**
 * Reusable inline editor for a single config row. Replaces the legacy
 * `<form className="setting-edit">` block with 4 `<label>` + `<button
 * className="toggle-switch">` + `<select>`/`<input>`/`<textarea>`
 * controls. Pure presentation: state lives in the parent; this component
 * only routes `onChange` events through `setDraft`.
 */
export default function ConfigEditor({
  draft,
  saving,
  editorKind,
  configSelectOptions,
  configPlaceholders,
  fieldUnitHint,
  setDraft,
  closeFocusedPanel,
  save,
}: ConfigEditorProps) {
  const booleanValue = String(draft.value).toLowerCase() === "true";
  const placeholders = configPlaceholders(String(draft.key || ""));
  const forwardContentOptions = [
    { value: "text", label: "Text" },
    { value: "photo", label: "Ảnh" },
    { value: "video", label: "Video" },
    { value: "document", label: "File" },
    { value: "sticker", label: "Sticker" },
    { value: "audio", label: "Audio" },
    { value: "voice", label: "Voice" },
    { value: "animation", label: "GIF" },
    { value: "video_note", label: "Video note" },
  ];
  const forwardSourceOptions = [
    { value: "channel_private", label: "Channel riêng tư" },
    { value: "channel_public", label: "Channel công khai" },
    { value: "group_private", label: "Group riêng tư" },
    { value: "group_public", label: "Group công khai" },
    { value: "user", label: "User" },
    { value: "bot", label: "Bot" },
  ];
  const selectedForwardTypes = new Set(
    String(draft.value || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );

  function updateForwardTypes(type: string, checked: boolean) {
    setDraft((current) => {
      const currentSet = new Set(
        String(current.value || "")
          .split(",")
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean)
      );
      if (checked) currentSet.add(type);
      else currentSet.delete(type);
      return {
        ...current,
        value: Array.from(currentSet).join(", "),
      };
    });
  }
  const selectedForwardSources = new Set(
    String(draft.value || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
  function updateForwardSources(type: string, checked: boolean) {
    setDraft((current) => {
      const currentSet = new Set(
        String(current.value || "")
          .split(",")
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean)
      );
      if (checked) currentSet.add(type);
      else currentSet.delete(type);
      return {
        ...current,
        value: Array.from(currentSet).join(", "),
      };
    });
  }

  return (
    <Box component="form" onSubmit={save}>
      <Stack spacing={1.5}>
        {editorKind === "boolean" ? (
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default", backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.78), transparent 100%)" }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: "-0.01em" }}>Bật / tắt giá trị</Typography>
                <Typography variant="body2" color="text.secondary">Đổi trực tiếp trạng thái của config này.</Typography>
              </Box>
              <Switch
                checked={booleanValue}
                onChange={() =>
                  setDraft((current) => ({
                    ...current,
                    value: String(current.value).toLowerCase() === "true" ? "false" : "true",
                  }))
                }
              />
            </Stack>
          </Paper>
        ) : editorKind === "multiselect" ? (
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default", backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.78), transparent 100%)" }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: "-0.01em" }}>Chọn loại nội dung được phép</Typography>
              <FormGroup row sx={{ gap: 1 }}>
                {forwardContentOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Checkbox
                        checked={selectedForwardTypes.has(option.value)}
                        onChange={(_, checked) => updateForwardTypes(option.value, checked)}
                      />
                    }
                    label={option.label}
                  />
                ))}
              </FormGroup>
              <Typography variant="caption" color="text.secondary">
                Đang chọn: {Array.from(selectedForwardTypes).join(", ") || "Chưa chọn gì"}
              </Typography>
            </Stack>
          </Paper>
        ) : editorKind === "multiselect_sources" ? (
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default", backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.78), transparent 100%)" }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: "-0.01em" }}>Chọn nguồn forward được phép</Typography>
              <FormGroup row sx={{ gap: 1 }}>
                {forwardSourceOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Checkbox
                        checked={selectedForwardSources.has(option.value)}
                        onChange={(_, checked) => updateForwardSources(option.value, checked)}
                      />
                    }
                    label={option.label}
                  />
                ))}
              </FormGroup>
              <Typography variant="caption" color="text.secondary">
                Đang chọn: {Array.from(selectedForwardSources).join(", ") || "Chưa chọn gì"}
              </Typography>
            </Stack>
          </Paper>
        ) : editorKind === "select" ? (
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default", backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.78), transparent 100%)" }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: "-0.01em" }}>Chọn giá trị cố định</Typography>
              <TextField
                select
                size="small"
                value={String(draft.value ?? "")}
                slotProps={{
                  select: {
                    MenuProps: {
                      disablePortal: true,
                      slotProps: {
                        paper: {
                          sx: { maxHeight: 320, zIndex: 2000 },
                        },
                      },
                    },
                  },
                }}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setDraft((current) => ({ ...current, value: event.target.value }))
                }
              >
                {configSelectOptions(String(draft.key || "")).map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Paper>
        ) : editorKind === "number" ? (
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default", backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.78), transparent 100%)" }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: "-0.01em" }}>Nhập giá trị số</Typography>
              <TextField
                type="number"
                size="small"
                value={String(draft.value ?? "")}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setDraft((current) => ({ ...current, value: event.target.value }))
                }
                helperText={fieldUnitHint({ key: String(draft.key || ""), label: "", type: "number" })}
              />
            </Stack>
          </Paper>
        ) : (
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default", backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.78), transparent 100%)" }}>
            <Stack spacing={0.75}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: "-0.01em" }}>Nhập nội dung / giá trị</Typography>
              <TextField
                multiline
                minRows={String(draft.value || "").length > 120 ? 6 : 3}
                value={draft.value ?? ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setDraft((current) => ({ ...current, value: event.target.value }))
                }
              />
              {placeholders.length ? (
                <Typography variant="caption" color="text.secondary">
                  Placeholder: {placeholders.join(" · ")}
                </Typography>
              ) : null}
            </Stack>
          </Paper>
        )}

        <Paper variant="outlined" sx={{ p: 1.25, bgcolor: "background.paper", backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.85), transparent 100%)" }}>
          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
            <MuiButton type="button" variant="outlined" onClick={closeFocusedPanel}>
              Hủy
            </MuiButton>
            <MuiButton type="submit" variant="contained" disabled={saving} startIcon={<Save size={17} />}>
              Lưu
            </MuiButton>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
