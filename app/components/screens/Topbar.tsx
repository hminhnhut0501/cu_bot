"use client";

import { Box, Button as MuiButton, Checkbox, FormControlLabel, IconButton, InputAdornment, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { Check, Database, Loader2, MoreHorizontal, Plus, RefreshCcw, Search, Send, Trash2, X } from "lucide-react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";

import PageHeader from "@/app/components/ui/PageHeader";
import TabsBar, { type TabItem } from "@/app/components/ui/TabsBar";

type TableConfigLike = { key: string; label: string };
type BotLike = { bot_key?: string; id?: string | number; name?: string };
type GroupLike = { bot_key?: string; group_id?: string; chat_id?: string; group_name?: string };
type RowLike = { id?: string | number } & Record<string, unknown>;

export type TopbarProps = {
  table: TableConfigLike;
  activeLayer: string;
  showTaskData: boolean;
  moduleWorkbenchActive: boolean;
  setupWorkbench: boolean;
  search: string;
  setSearch: (value: string) => void;
  loadRows: (search: string) => void;
  onBack: () => void;
  saving: boolean;
  selectedBot: string;
  activeBotKey: string;
  bots: BotLike[];
  selectedScope: string;
  setSelectedScope: (value: string) => void;
  groups: GroupLike[];
  setSelected: (value: RowLike | null) => void;
  setDraft: (value: Record<string, unknown>) => void;
  setSelectedIds: (value: Set<string>) => void;
  topbarMenuOpen: boolean;
  setTopbarMenuOpen: (updater: (current: boolean) => boolean) => void;
  scanMode: "scan" | "detail";
  setScanMode: (value: "scan" | "detail") => void;
  openChannelComposer: () => void;
  readOnlyTable: boolean;
  startCreate: () => void;
  visibleRows: RowLike[];
  selectedVisibleRows: RowLike[];
  toggleAllVisible: () => void;
  removeSelected: () => void;
  draft: Record<string, unknown>;
  closeFocusedPanel: () => void;
  bulkOpen: boolean;
  setBulkOpen: (updater: (current: boolean) => boolean) => void;
  tableTaskLabel: Record<string, string>;
  tablePrimaryAction: Record<string, string>;
  bulkTables: Set<string>;
  quickFilter: string;
  quickFilters: Array<{ key: string; label: string }>;
  setQuickFilter: (value: string) => void;
  envStatus?: { runtimeMode?: string };
  openCommand: () => void;
  selectBot: (botKey: string) => void;
};

export default function Topbar(props: TopbarProps) {
  const {
    table,
    search,
    setSearch,
    loadRows,
    onBack,
    saving,
    selectedBot,
    activeBotKey,
    bots,
    selectedScope,
    setSelectedScope,
    groups,
    setSelected,
    setDraft,
    setSelectedIds,
    topbarMenuOpen,
    setTopbarMenuOpen,
    scanMode,
    setScanMode,
    openChannelComposer,
    readOnlyTable,
    startCreate,
    visibleRows,
    selectedVisibleRows,
    toggleAllVisible,
    removeSelected,
    draft,
    closeFocusedPanel,
    bulkOpen,
    setBulkOpen,
    tableTaskLabel,
    tablePrimaryAction,
    bulkTables,
    quickFilter,
    quickFilters,
    setQuickFilter,
    envStatus,
    openCommand,
    selectBot,
  } = props;

  const hasTopbarQuickFilter = table.key !== "config" && table.key !== "channel_posts";
  const tableFilterTabs: TabItem[] = quickFilters.map((filter) => ({
    key: filter.key,
    label: filter.label,
  }));

  return (
    <PageHeader
      eyebrow={table.key === "channel_posts" ? "Channel publisher" : "Hoạt động"}
      title={props.activeLayer === "advanced" ? table.label : tableTaskLabel[table.key] || table.label}
      subtitle={getTableDescription(table.key)}
      icon={<Database size={20} />}
      breadcrumbs={scopeBreadcrumb(groups, selectedScope)}
      actions={
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          {props.showTaskData && (props.moduleWorkbenchActive || props.setupWorkbench || props.activeLayer === "bot" || props.activeLayer === "group") ? (
            <MuiButton
              variant="outlined"
              startIcon={<X size={16} />}
              onClick={onBack}
            >
              Về workbench
            </MuiButton>
          ) : null}

          <TextField
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") loadRows(search);
            }}
            placeholder="Tìm kiếm"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ minWidth: 200 }}
          />

          <IconButton onClick={() => loadRows(search)} title="Tải lại">
            <RefreshCcw size={17} />
          </IconButton>

          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={Boolean(bulkOpen)}
                onChange={() => setBulkOpen((value) => !value)}
              />
            }
            label="Bulk"
          />

          <MuiButton variant="outlined" onClick={openCommand}>Command</MuiButton>

          {table.key === "channel_posts" ? (
            <MuiButton variant="contained" startIcon={<Send size={16} />} onClick={openChannelComposer}>
              Đăng bài
            </MuiButton>
          ) : !readOnlyTable && table.key !== "config" ? (
            <MuiButton variant="contained" startIcon={<Plus size={16} />} onClick={startCreate}>
              {tablePrimaryAction[table.key] || "Tạo mới"}
            </MuiButton>
          ) : null}
        </Stack>
      }
    >
      {hasTopbarQuickFilter && tableFilterTabs.length ? (
        <TabsBar
          items={tableFilterTabs}
          value={quickFilter}
          onChange={setQuickFilter}
          scrollable
        />
      ) : null}

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        sx={{ alignItems: { md: "center" }, flexWrap: "wrap" }}
      >
        <TextField
          select
          size="small"
          label="Bot"
          value={activeBotKey || selectedBot || ""}
          onChange={(event) => selectBot(event.target.value)}
          sx={{ minWidth: { xs: "100%", md: 200 } }}
        >
          {bots.map((bot) => (
            <MenuItem key={bot.bot_key || bot.id} value={String(bot.bot_key || "")}>
              {bot.name || bot.bot_key}
            </MenuItem>
          ))}
          {!bots.length ? <MenuItem value="">Chưa có bot</MenuItem> : null}
        </TextField>

        <TextField
          select
          size="small"
          label="Scope"
          value={selectedScope}
          onChange={(event) => {
            setSelectedScope(event.target.value);
            setSelected(null);
            setDraft({});
            setSelectedIds(new Set());
          }}
          sx={{ minWidth: { xs: "100%", md: 240 } }}
        >
          <MenuItem value="">Toàn hệ thống</MenuItem>
          {groups
            .filter((group) => !activeBotKey || !group.bot_key || group.bot_key === activeBotKey)
            .map((group) => {
              const value = String(group.group_id || group.chat_id || "");
              return value ? (
                <MenuItem key={value} value={value}>
                  {group.group_name || value}
                </MenuItem>
              ) : null;
            })}
        </TextField>

        <Typography variant="caption" color="text.secondary">
          Runtime: {envStatus?.runtimeMode || "fallback"}
        </Typography>
      </Stack>
    </PageHeader>
  );
}

function getTableDescription(key: string): string {
  const map: Record<string, string> = {
    bots: "Quản lý bot Telegram đang vận hành.",
    groups: "Group và channel bot đang phục vụ.",
    config: "Cấu hình bot dùng chung.",
    audit_logs: "Nhật ký hoạt động gần nhất.",
    scam_reports: "Báo cáo scam chờ duyệt.",
    bot_metrics: "Số liệu vận hành.",
  };
  return map[key] || "";
}

function scopeBreadcrumb(groups: GroupLike[], selectedScope: string): ReactNode {
  if (!selectedScope) return "Toàn hệ thống";
  const matched = groups.find(
    (group) => String(group.group_id || group.chat_id || "") === selectedScope,
  );
  return matched?.group_name || selectedScope;
}
