"use client";

import {
  Box,
  Button as MuiButton,
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

  return (
    <Box component="form" onSubmit={save}>
      <Stack spacing={1.5}>
        {editorKind === "boolean" ? (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
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
        ) : editorKind === "select" ? (
          <TextField
            select
            label="Chọn giá trị cố định"
            size="small"
            value={String(draft.value ?? "")}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setDraft((current) => ({ ...current, value: event.target.value }))
            }
          >
            {configSelectOptions(String(draft.key || "")).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </TextField>
        ) : editorKind === "number" ? (
          <TextField
            type="number"
            label="Nhập giá trị số"
            size="small"
            value={String(draft.value ?? "")}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setDraft((current) => ({ ...current, value: event.target.value }))
            }
            helperText={fieldUnitHint({ key: String(draft.key || ""), label: "", type: "number" })}
          />
        ) : (
          <Stack spacing={0.5}>
            <TextField
              multiline
              minRows={String(draft.value || "").length > 120 ? 6 : 3}
              label="Nhập nội dung / giá trị"
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
        )}

        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", mt: 1 }}>
          <MuiButton type="button" variant="outlined" onClick={closeFocusedPanel}>
            Hủy
          </MuiButton>
          <MuiButton
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={<Save size={17} />}
          >
            Lưu
          </MuiButton>
        </Stack>
      </Stack>
    </Box>
  );
}
