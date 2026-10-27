"use client";

import type { FormEvent } from "react";
import {
  Box,
  Button as MuiButton,
  Chip,
  Grid,
  Paper,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { Edit3, Power } from "lucide-react";
import type { Row } from "@/lib/cp-types";
import {
  configDescription,
  configDisplayValue,
  configEditorKind,
  configInputGuide,
  configLabel,
  configPlaceholders,
  configSelectOptions,
  configValueCaption,
  fieldUnitHint,
  isConfigBoolean,
} from "@/lib/cp-helpers";
import ModerationToggles from "./ModerationToggles";
import ConfigEditor, { type ConfigEditorDraft } from "./ConfigEditor";

export type ModerationConfigSectionsProps = {
  activeConfigSection: { title: string; rows: Row[] };
  moderationScanTextLink: boolean;
  moderationScanTextMention: boolean;
  moderationAllowInGroupMentions: boolean;
  moderationHiddenLinkAction: string;
  toggleModerationScanTextLink: () => void;
  toggleModerationScanTextMention: () => void;
  toggleModerationAllowInGroupMentions: () => void;
  changeModerationHiddenLinkAction: (action: string) => void;
  spamConfigBlocks: any[];
  moderationConfigRowMap: Map<string, Row>;
  saving: boolean;
  toggleConfigValue: (row: Row) => void;
  selected: Row | null;
  draft: Row;
  setDraft: (updater: any) => void;
  startEdit: (row: Row) => void;
  closeFocusedPanel: () => void;
  save: (event: FormEvent) => void;
  templateConfigBlocks: any[];
      bioLinkConfigBlocks: any[];
  otherConfigBlocks: any[];
  moderationBlocks: any[];
  forwardMode: string;
  setForwardMode: (val: "block" | "controlled" | "allow") => void;
  forwardContentBlock: any;
  forwardViolationBlock: any;
  defaultView: React.ReactNode;
};

export default function ModerationConfigSections({
  activeConfigSection,
  moderationScanTextLink,
  moderationScanTextMention,
  moderationAllowInGroupMentions,
  moderationHiddenLinkAction,
  toggleModerationScanTextLink,
  toggleModerationScanTextMention,
  toggleModerationAllowInGroupMentions,
  changeModerationHiddenLinkAction,
  spamConfigBlocks,
  moderationConfigRowMap,
  saving,
  toggleConfigValue,
  selected,
  draft,
  setDraft,
  startEdit,
  closeFocusedPanel,
  save,
  templateConfigBlocks,
      bioLinkConfigBlocks,
  otherConfigBlocks,
  moderationBlocks,
  forwardMode,
  setForwardMode,
  forwardContentBlock,
  forwardViolationBlock,
  defaultView,
}: ModerationConfigSectionsProps) {
  return (
    <>
      {activeConfigSection.title === "Thiết lập dùng chung" ? (
        <ModerationToggles
          scanTextLink={moderationScanTextLink}
          scanTextMention={moderationScanTextMention}
          allowInGroupMentions={moderationAllowInGroupMentions}
          hiddenLinkAction={moderationHiddenLinkAction}
          toggleScanTextLink={toggleModerationScanTextLink}
          toggleScanTextMention={toggleModerationScanTextMention}
          toggleAllowInGroupMentions={toggleModerationAllowInGroupMentions}
          changeHiddenLinkAction={changeModerationHiddenLinkAction}
        />
      ) : null}
                {activeConfigSection.title === "Spam, cảnh báo & ban" ? (
                  <Stack spacing={1.5}>
                    {spamConfigBlocks.map((block) => {
                      const blockRows = activeConfigSection.rows.filter((row) => block.keys.includes(String(row.key || "")));
                      const toggleRow = moderationConfigRowMap.get(block.toggleKey);
                      const blockOn = toggleRow ? String(toggleRow.value).toLowerCase() !== "false" : true;
                      const hasBooleanToggle = Boolean(toggleRow && isConfigBoolean(toggleRow));
                      return (
                        <Paper key={block.key} variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
                          <Stack spacing={1.5}>
                            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" } }}>
                              <Box>
                                <Typography variant="subtitle1">{block.title}</Typography>
                                <Typography variant="body2" color="text.secondary">{block.desc}</Typography>
                              </Box>
                              {hasBooleanToggle && toggleRow ? (
                                <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                                  <Chip size="small" label={blockOn ? "Bật" : "Tắt"} color={blockOn ? "success" : "default"} />
                                  <Switch
                                    checked={blockOn}
                                    disabled={saving}
                                    onChange={() => toggleConfigValue(toggleRow)}
                                  />
                                </Stack>
                              ) : null}
                            </Stack>

                            {blockOn ? (
                              <Grid container spacing={1.5}>
                                {blockRows.filter((row) => String(row.key || "") !== block.toggleKey).map((row) => {
                                  const editing = selected?.id === row.id && Object.keys(draft).length > 0;
                                  const booleanValue = isConfigBoolean(row);
                                  const valueOn = String(row.value).toLowerCase() === "true";
                                  const editorKind = configEditorKind(String(row.key || ""));
                                  return (
                                    <Grid key={row.id || row.key} size={{ xs: 12, lg: 6, xl: 4 }}>
                                      <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper", opacity: row.enabled === false ? 0.7 : 1 }}>
                                        <Stack spacing={1.5}>
                                          <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
                                            <Box>
                                              <Typography variant="subtitle1">{configLabel(String(row.key || ""))}</Typography>
                                              <Typography variant="body2" color="text.secondary">{configDescription(row)}</Typography>
                                            </Box>
                                            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                              {booleanValue ? (
                                                <Switch
                                                  disabled={saving}
                                                  onClick={() => toggleConfigValue(row)}
                                                  title={valueOn ? "Đang bật, bấm để tắt" : "Đang tắt, bấm để bật"}
                                                  checked={valueOn}
                                                />
                                              ) : null}
                                              <MuiButton variant="outlined" size="small" disabled={saving} onClick={() => startEdit(row)} startIcon={<Edit3 size={16} />}>Sửa</MuiButton>
                                            </Stack>
                                          </Stack>

                                          {editing ? (
                                            <ConfigEditor
                                              draft={draft as ConfigEditorDraft}
                                              saving={saving}
                                              editorKind={editorKind}
                                              configSelectOptions={configSelectOptions}
                                              configPlaceholders={configPlaceholders}
                                              fieldUnitHint={fieldUnitHint}
                                              setDraft={setDraft as (updater: (current: ConfigEditorDraft) => ConfigEditorDraft) => void}
                                              closeFocusedPanel={closeFocusedPanel}
                                              save={save}
                                            />
                                          ) : (
                                            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.paper" }}>
                                              <Typography variant="caption" color="text.secondary">{configValueCaption(row)}</Typography>
                                              <Typography variant="subtitle2">{configDisplayValue(row)}</Typography>
                                            </Paper>
                                          )}
                                        </Stack>
                                      </Paper>
                                    </Grid>
                                  );
                                })}
                              </Grid>
                            ) : null}
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                ) : activeConfigSection.title === "Mẫu tin kiểm duyệt" ? (
                  <Stack spacing={1.5}>
                    {templateConfigBlocks.map((block) => {
                      const blockRows = activeConfigSection.rows.filter((row) => block.keys.includes(String(row.key || "")));
                      return (
                        <Paper key={block.key} variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
                          <Stack spacing={1.5}>
                            <Box>
                              <Typography variant="subtitle1">{block.title}</Typography>
                              <Typography variant="body2" color="text.secondary">{block.desc}</Typography>
                            </Box>
                            <Grid container spacing={1.5}>
                              {blockRows.map((row) => {
                                const editing = selected?.id === row.id && Object.keys(draft).length > 0;
                                const booleanValue = isConfigBoolean(row);
                                const valueOn = String(row.value).toLowerCase() === "true";
                                const editorKind = configEditorKind(String(row.key || ""));
                                return (
                                  <Grid key={row.id || row.key} size={{ xs: 12, lg: 6, xl: 4 }}>
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper", opacity: row.enabled === false ? 0.7 : 1 }}>
                                      <Stack spacing={1.5}>
                                        <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
                                          <Box>
                                            <Typography variant="subtitle1">{configLabel(String(row.key || ""))}</Typography>
                                            <Typography variant="body2" color="text.secondary">{configDescription(row)}</Typography>
                                          </Box>
                                            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                              {booleanValue ? (
                                                <Switch
                                                  disabled={saving}
                                                  onClick={() => toggleConfigValue(row)}
                                                  title={valueOn ? "Đang bật, bấm để tắt" : "Đang tắt, bấm để bật"}
                                                  checked={valueOn}
                                                />
                                              ) : null}
                                              <MuiButton variant="outlined" size="small" disabled={saving} onClick={() => startEdit(row)} startIcon={<Edit3 size={16} />}>Sửa</MuiButton>
                                            </Stack>
                                        </Stack>

                                        {editing ? (
                                          <ConfigEditor
                                            draft={draft as ConfigEditorDraft}
                                            saving={saving}
                                            editorKind={editorKind}
                                            configSelectOptions={configSelectOptions}
                                            configPlaceholders={configPlaceholders}
                                            fieldUnitHint={fieldUnitHint}
                                            setDraft={setDraft as (updater: (current: ConfigEditorDraft) => ConfigEditorDraft) => void}
                                            closeFocusedPanel={closeFocusedPanel}
                                            save={save}
                                          />
                                        ) : (
                                          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.paper" }}>
                                            <Typography variant="caption" color="text.secondary">{configValueCaption(row)}</Typography>
                                            <Typography variant="subtitle2">{configDisplayValue(row)}</Typography>
                                          </Paper>
                                        )}
                                      </Stack>
                                    </Paper>
                                  </Grid>
                                );
                              })}
                            </Grid>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                ) : activeConfigSection.title === "Forward nâng cao" ? (
                  <Stack spacing={1.5}>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
                      <Stack spacing={1.5}>
                        <Box>
                          <Typography variant="subtitle1">Chế độ forward</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Chọn một trong 3 cách xử lý để bot không còn hiểu nhầm giữa cho phép, cho phép có kiểm soát và chặn hẳn.
                          </Typography>
                        </Box>
                        <Grid container spacing={1.5}>
                          {[
                            {
                              value: "block",
                              title: "Không cho phép forward",
                              desc: "Xóa toàn bộ tin forward vào group.",
                              chipLabel: "Chặn",
                              chipColor: "error",
                            },
                            {
                              value: "controlled",
                              title: "Cho phép forward có kiểm soát",
                              desc: "Cho forward đi qua nhưng vẫn lọc nguồn và loại nội dung.",
                              chipLabel: "Kiểm soát",
                              chipColor: "warning",
                            },
                            {
                              value: "allow",
                              title: "Cho phép forward",
                              desc: "Cho forward đi qua hoàn toàn, không áp dụng lọc nguồn / loại nội dung.",
                              chipLabel: "Mở",
                              chipColor: "success",
                            },
                          ].map((option) => {
                            const active = forwardMode === option.value;
                            return (
                              <Grid key={option.value} size={{ xs: 12, md: 4 }}>
                                <Paper
                                  variant="outlined"
                                  onClick={() => setForwardMode(option.value as "block" | "controlled" | "allow")}
                                  sx={{
                                    p: 1.5,
                                    cursor: "pointer",
                                    borderColor: active ? "primary.main" : "divider",
                                    bgcolor: active ? "action.hover" : "background.paper",
                                    transition: "all 0.15s ease",
                                  }}
                                >
                                  <Stack spacing={0.5}>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                                      <Typography variant="subtitle2">{option.title}</Typography>
                                      <Chip size="small" color={active ? option.chipColor as any : "default"} label={active ? option.chipLabel : "Chọn"} />
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary">
                                      {option.desc}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {option.value === "block"
                                        ? "Bot sẽ dừng xử lý forward và xóa tin forward vào group."
                                        : option.value === "controlled"
                                          ? "Bot cho forward đi qua nhưng vẫn lọc theo nguồn, loại nội dung và ngưỡng vi phạm."
                                          : "Bot cho forward đi qua như một tin bình thường, không chặn theo nguồn hay loại nội dung."}
                                    </Typography>
                                  </Stack>
                                </Paper>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </Stack>
                    </Paper>
                    {forwardMode !== "block" ? [forwardContentBlock, forwardViolationBlock].map((block, index) => {
                      const blockRows = activeConfigSection.rows.filter((row) => block.keys.includes(String(row.key || "")));
                      const toggleRow = moderationConfigRowMap.get(block.toggleKey);
                      const blockOn = index === 0 ? String(forwardMode) !== "block" : true;
                      return (
                        <Paper key={block.key} variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
                          <Stack spacing={1.5}>
                            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" } }}>
                              <Box>
                                <Typography variant="subtitle1">{block.title}</Typography>
                                <Typography variant="body2" color="text.secondary">{block.desc}</Typography>
                              </Box>
                              {block.key !== "forward-content" && toggleRow ? (
                                <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                                  <Chip size="small" label={blockOn ? "Bật" : "Tắt"} color={blockOn ? "success" : "default"} />
                                  <Switch checked={blockOn} disabled={saving} onChange={() => toggleConfigValue(toggleRow)} />
                                </Stack>
                              ) : null}
                            </Stack>
                            {blockOn ? (
                              <Grid container spacing={1.5}>
                                {blockRows.filter((row) => String(row.key || "") !== block.toggleKey && String(row.key || "") !== "allow_forward_messages").map((row) => {
                                  const editing = selected?.id === row.id && Object.keys(draft).length > 0;
                                  const booleanValue = isConfigBoolean(row);
                                  const valueOn = String(row.value).toLowerCase() === "true";
                                  const editorKind = configEditorKind(String(row.key || ""));
                                  return (
                                    <Grid key={row.id || row.key} size={{ xs: 12, lg: 6, xl: 4 }}>
                                      <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper", opacity: row.enabled === false ? 0.7 : 1 }}>
                                        <Stack spacing={1.5}>
                                          <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
                                            <Box>
                                              <Typography variant="subtitle1">{configLabel(String(row.key || ""))}</Typography>
                                            <Typography variant="body2" color="text.secondary">{configDescription(row)}</Typography>
                                          </Box>
                                          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                              {booleanValue && block.key !== "forward-content" ? (
                                                <Switch
                                                  disabled={saving}
                                                  onClick={() => toggleConfigValue(row)}
                                                  title={valueOn ? "Đang bật, bấm để tắt" : "Đang tắt, bấm để bật"}
                                                  checked={valueOn}
                                                />
                                              ) : null}
                                              <MuiButton variant="outlined" size="small" disabled={saving} onClick={() => startEdit(row)} startIcon={<Edit3 size={16} />}>Sửa</MuiButton>
                                            </Stack>
                                          </Stack>
                                          {editing ? (
                                            <ConfigEditor
                                              draft={draft as ConfigEditorDraft}
                                              saving={saving}
                                              editorKind={editorKind}
                                              configSelectOptions={configSelectOptions}
                                              configPlaceholders={configPlaceholders}
                                              fieldUnitHint={fieldUnitHint}
                                              setDraft={setDraft as (updater: (current: ConfigEditorDraft) => ConfigEditorDraft) => void}
                                              closeFocusedPanel={closeFocusedPanel}
                                              save={save}
                                            />
                                          ) : (
                                            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.paper" }}>
                                              <Typography variant="caption" color="text.secondary">{configValueCaption(row)}</Typography>
                                              <Typography variant="subtitle2">{configDisplayValue(row)}</Typography>
                                            </Paper>
                                          )}
                                        </Stack>
                                      </Paper>
                                    </Grid>
                                  );
                                })}
                              </Grid>
                            ) : null}
                          </Stack>
                        </Paper>
                      );
                    }) : (
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
                        <Typography variant="body2" color="text.secondary">
                          Forward đang bị chặn hoàn toàn nên các card con đã được ẩn. Chuyển sang "Cho phép forward có kiểm soát" hoặc "Cho phép forward" nếu cần mở lại.
                        </Typography>
                      </Paper>
                    )}
                  </Stack>
                ) : activeConfigSection.title === "Bio, link & cảnh báo" ? (
                  <Stack spacing={1.5}>
                    {bioLinkConfigBlocks.map((block) => {
                      const blockRows = activeConfigSection.rows.filter((row) => block.keys.includes(String(row.key || "")));
                      const toggleRow = block.toggleKey ? moderationConfigRowMap.get(block.toggleKey) : undefined;
                      const blockOn = toggleRow ? String(toggleRow.value).toLowerCase() !== "false" : true;
                      const hasToggle = Boolean(toggleRow && isConfigBoolean(toggleRow));
                      return (
                        <Paper key={block.key} variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
                          <Stack spacing={1.5}>
                            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" } }}>
                              <Box>
                                <Typography variant="subtitle1">{block.title}</Typography>
                                <Typography variant="body2" color="text.secondary">{block.desc}</Typography>
                              </Box>
                              {hasToggle && toggleRow ? (
                                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                  <Chip size="small" label={blockOn ? "Bật" : "Tắt"} color={blockOn ? "success" : "default"} />
                                  <Switch checked={blockOn} disabled={saving} onChange={() => toggleConfigValue(toggleRow)} />
                                </Stack>
                              ) : null}
                            </Stack>
                            {blockOn ? (
                              <Grid container spacing={1.5}>
                                {blockRows.filter((row) => String(row.key || "") !== block.toggleKey).map((row) => {
                                  const editing = selected?.id === row.id && Object.keys(draft).length > 0;
                                  const booleanValue = isConfigBoolean(row);
                                  const valueOn = String(row.value).toLowerCase() === "true";
                                  const editorKind = configEditorKind(String(row.key || ""));
                                  return (
                                    <Grid key={row.id || row.key} size={{ xs: 12, lg: 6, xl: 4 }}>
                                      <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper", opacity: row.enabled === false ? 0.7 : 1 }}>
                                        <Stack spacing={1.5}>
                                          <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
                                            <Box>
                                              <Typography variant="subtitle1">{configLabel(String(row.key || ""))}</Typography>
                                              <Typography variant="body2" color="text.secondary">{configDescription(row)}</Typography>
                                            </Box>
                                            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                              {booleanValue ? (
                                                <Switch disabled={saving || !blockOn} onClick={() => toggleConfigValue(row)} checked={valueOn} />
                                              ) : null}
                                              <MuiButton variant="outlined" size="small" disabled={!blockOn || saving} onClick={() => startEdit(row)} startIcon={<Edit3 size={16} />}>Sửa</MuiButton>
                                            </Stack>
                                          </Stack>
                                          {editing ? (
                                            <ConfigEditor
                                              draft={draft as ConfigEditorDraft}
                                              saving={saving}
                                              editorKind={editorKind}
                                              configSelectOptions={configSelectOptions}
                                              configPlaceholders={configPlaceholders}
                                              fieldUnitHint={fieldUnitHint}
                                              setDraft={setDraft as (updater: (current: ConfigEditorDraft) => ConfigEditorDraft) => void}
                                              closeFocusedPanel={closeFocusedPanel}
                                              save={save}
                                            />
                                          ) : (
                                            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.paper" }}>
                                              <Typography variant="caption" color="text.secondary">{configValueCaption(row)}</Typography>
                                              <Typography variant="subtitle2">{configDisplayValue(row)}</Typography>
                                            </Paper>
                                          )}
                                        </Stack>
                                      </Paper>
                                    </Grid>
                                  );
                                })}
                              </Grid>
                            ) : null}
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                ) : activeConfigSection.title === "Cài đặt khác" ? (
                  <Stack spacing={1.5}>
                    {otherConfigBlocks.map((block) => {
                      const blockRows = activeConfigSection.rows.filter((row) => block.keys.includes(String(row.key || "")));
                      return (
                        <Paper key={block.key} variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
                          <Stack spacing={1.5}>
                            <Box>
                              <Typography variant="subtitle1">{block.title}</Typography>
                              <Typography variant="body2" color="text.secondary">{block.desc}</Typography>
                            </Box>
                            <Grid container spacing={1.5}>
                              {blockRows.map((row) => {
                                const editing = selected?.id === row.id && Object.keys(draft).length > 0;
                                const booleanValue = isConfigBoolean(row);
                                const valueOn = String(row.value).toLowerCase() === "true";
                                const editorKind = configEditorKind(String(row.key || ""));
                                return (
                                  <Grid key={row.id || row.key} size={{ xs: 12, lg: 6, xl: 4 }}>
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper", opacity: row.enabled === false ? 0.7 : 1 }}>
                                      <Stack spacing={1.5}>
                                        <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
                                          <Box>
                                            <Typography variant="subtitle1">{configLabel(String(row.key || ""))}</Typography>
                                            <Typography variant="body2" color="text.secondary">{configDescription(row)}</Typography>
                                          </Box>
                                            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                              {booleanValue ? (
                                                <Switch
                                                  disabled={saving}
                                                  onClick={() => toggleConfigValue(row)}
                                                  title={valueOn ? "Đang bật, bấm để tắt" : "Đang tắt, bấm để bật"}
                                                  checked={valueOn}
                                                />
                                              ) : null}
                                              <MuiButton variant="outlined" size="small" disabled={saving} onClick={() => startEdit(row)} startIcon={<Edit3 size={16} />}>Sửa</MuiButton>
                                            </Stack>
                                        </Stack>
                                        {editing ? (
                                          <ConfigEditor
                                            draft={draft as ConfigEditorDraft}
                                            saving={saving}
                                            editorKind={editorKind}
                                            configSelectOptions={configSelectOptions}
                                            configPlaceholders={configPlaceholders}
                                            fieldUnitHint={fieldUnitHint}
                                            setDraft={setDraft as (updater: (current: ConfigEditorDraft) => ConfigEditorDraft) => void}
                                            closeFocusedPanel={closeFocusedPanel}
                                            save={save}
                                          />
                                        ) : (
                                          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.paper" }}>
                                            <Typography variant="caption" color="text.secondary">{configValueCaption(row)}</Typography>
                                            <Typography variant="subtitle2">{configDisplayValue(row)}</Typography>
                                          </Paper>
                                        )}
                                      </Stack>
                                    </Paper>
                                  </Grid>
                                );
                              })}
                            </Grid>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                ) : activeConfigSection.title === "Thiết lập dùng chung" ? (
                  <Stack spacing={1.5}>
                    {moderationBlocks.map((block) => {
                      const blockRows = activeConfigSection.rows.filter((row) => block.keys.includes(String(row.key || "")));
                      const toggleRow = moderationConfigRowMap.get(block.toggleKey);
                      const blockOn = toggleRow ? String(toggleRow.value).toLowerCase() !== "false" : true;
                      const blockEditable = blockOn || block.key === "core";
                      return (
                        <Paper key={block.key} variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
                          <Stack spacing={1.5}>
                            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" } }}>
                              <Box>
                                <Typography variant="subtitle1">{block.title}</Typography>
                                <Typography variant="body2" color="text.secondary">{block.desc}</Typography>
                              </Box>
                              {toggleRow ? (
                                <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                                  <Chip size="small" label={blockOn ? "Bật" : "Tắt"} color={blockOn ? "success" : "default"} />
                                  <Switch
                                    checked={blockOn}
                                    disabled={saving}
                                    onChange={() => toggleConfigValue(toggleRow)}
                                  />
                                </Stack>
                              ) : null}
                            </Stack>

                            {blockEditable ? (
                              <Grid container spacing={1.5}>
                                {blockRows.filter((row) => String(row.key || "") !== block.toggleKey).map((row) => {
                                  const editing = selected?.id === row.id && Object.keys(draft).length > 0;
                                  const booleanValue = isConfigBoolean(row);
                                  const valueOn = String(row.value).toLowerCase() === "true";
                                  const editorKind = configEditorKind(String(row.key || ""));
                                  const isDisabled = row.enabled === false;
                                  return (
                                    <Grid key={row.id || row.key} size={{ xs: 12, lg: 6, xl: 4 }}>
                                      <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper", opacity: isDisabled ? 0.7 : 1 }}>
                                        <Stack spacing={1.5}>
                                          <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
                                            <Box>
                                              <Typography variant="subtitle1">{configLabel(String(row.key || ""))}</Typography>
                                              <Typography variant="body2" color="text.secondary">{configDescription(row)}</Typography>
                                            </Box>
                                            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                              {booleanValue ? (
                                                <Switch
                                                  disabled={saving || !blockOn}
                                                  onClick={() => toggleConfigValue(row)}
                                                  title={valueOn ? "Đang bật, bấm để tắt" : "Đang tắt, bấm để bật"}
                                                  checked={valueOn}
                                                />
                                              ) : null}
                                              <MuiButton variant="outlined" size="small" onClick={() => startEdit(row)} startIcon={<Edit3 size={16} />}>Sửa</MuiButton>
                                            </Stack>
                                          </Stack>

                                          {editing ? (
                                            <ConfigEditor
                                              draft={draft as ConfigEditorDraft}
                                              saving={saving}
                                              editorKind={editorKind}
                                              configSelectOptions={configSelectOptions}
                                              configPlaceholders={configPlaceholders}
                                              fieldUnitHint={fieldUnitHint}
                                              setDraft={setDraft as (updater: (current: ConfigEditorDraft) => ConfigEditorDraft) => void}
                                              closeFocusedPanel={closeFocusedPanel}
                                              save={save}
                                            />
                                          ) : (
                                            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.paper" }}>
                                              <Typography variant="caption" color="text.secondary">{configValueCaption(row)}</Typography>
                                              <Typography variant="subtitle2">{configDisplayValue(row)}</Typography>
                                            </Paper>
                                          )}
                                        </Stack>
                                      </Paper>
                                    </Grid>
                                  );
                                })}
                              </Grid>
                            ) : (
                              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.paper" }}>
                                <Typography variant="body2" color="text.secondary">
                                  Bật {block.title.toLowerCase()} để mở cài đặt con.
                                </Typography>
                              </Paper>
                            )}
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>

                ) : defaultView}
    </>
  );
}
