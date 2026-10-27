"use client";

import {
  Box,
  Button as MuiButton,
  Checkbox,
  Chip,
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
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: "-0.01em" }}>Chọn hành động xử lý</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {configSelectOptions(String(draft.key || "")).map((option) => {
                  const isSelected = String(draft.value) === option.value;
                  const actionColorMap: Record<string, "warning" | "info" | "secondary" | "error" | "default"> = {
                    warn: "warning",
                    delete: "info",
                    restrict: "secondary",
                    mute: "warning",
                    kick: "error",
                    ban: "error",
                  };
                  const color = actionColorMap[option.value] || "primary";
                  return (
                    <Chip
                      key={option.value}
                      label={option.label}
                      clickable
                      color={isSelected ? color : "default"}
                      variant={isSelected ? "filled" : "outlined"}
                      onClick={() => setDraft((c) => ({ ...c, value: option.value }))}
                      sx={{
                        fontWeight: isSelected ? 700 : 500,
                        py: 2,
                        borderRadius: 1.5,
                      }}
                    />
                  );
                })}
              </Box>
            </Stack>
          </Paper>
        ) : editorKind === "number" ? (
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default", backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.78), transparent 100%)" }}>
            <Stack spacing={1.5}>
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

              {(() => {
                const key = String(draft.key || "");
                let numberPresets: Array<{ label: string; value: number }> = [];
                if (key.endsWith("_seconds") || key === "ban_seconds") {
                  numberPresets = [
                    { label: "30 giây", value: 30 },
                    { label: "1 phút", value: 60 },
                    { label: "5 phút", value: 300 },
                    { label: "15 phút", value: 900 },
                    { label: "1 giờ", value: 3600 },
                    { label: "1 ngày", value: 86400 },
                    { label: "7 ngày", value: 604800 },
                    { label: "Vĩnh viễn (0)", value: 0 },
                  ];
                } else if (key === "ban_after_warnings" || key.includes("warning")) {
                  numberPresets = [
                    { label: "1 lần", value: 1 },
                    { label: "2 lần", value: 2 },
                    { label: "3 lần (chuẩn)", value: 3 },
                    { label: "5 lần", value: 5 },
                  ];
                } else if (key.endsWith("_messages") || key.endsWith("_count")) {
                  numberPresets = [
                    { label: "3 tin", value: 3 },
                    { label: "5 tin (chuẩn)", value: 5 },
                    { label: "10 tin", value: 10 },
                    { label: "20 tin", value: 20 },
                  ];
                }

                if (!numberPresets.length) return null;

                return (
                  <Stack spacing={0.75}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      Mức gợi ý thiết lập nhanh:
                    </Typography>
                    <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                      {numberPresets.map((preset) => (
                        <Chip
                          key={preset.label}
                          label={preset.label}
                          size="small"
                          clickable
                          variant={Number(draft.value) === preset.value ? "filled" : "outlined"}
                          color={Number(draft.value) === preset.value ? "primary" : "default"}
                          onClick={() => setDraft((c) => ({ ...c, value: preset.value }))}
                        />
                      ))}
                    </Stack>
                  </Stack>
                );
              })()}
            </Stack>
          </Paper>
        ) : (
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default", backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.78), transparent 100%)" }}>
            <Stack spacing={1}>
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
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    Nhấp để chèn biến nội dung:
                  </Typography>
                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                    {placeholders.map((ph) => (
                      <Chip
                        key={ph}
                        label={ph}
                        size="small"
                        variant="outlined"
                        clickable
                        onClick={() => {
                          setDraft((c) => ({
                            ...c,
                            value: (c.value ? `${c.value} ` : "") + ph,
                          }));
                        }}
                        sx={{ fontFamily: "monospace", fontSize: 11 }}
                      />
                    ))}
                  </Stack>
                </Stack>
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
