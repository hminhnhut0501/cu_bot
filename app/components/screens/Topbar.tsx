"use client";

import {
  Box,
  Button as MuiButton,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ArrowLeft,
  Bot,
  Command,
  MoonStar,
  Plus,
  RefreshCcw,
  Search,
  Send,
  SunMedium,
  Users,
} from "lucide-react";
import type { ChangeEvent, ReactNode } from "react";
import { moduleAccents } from "@/app/theme";

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
  themeMode: "light" | "dark";
  toggleThemeMode: () => void;
  tone?: keyof typeof moduleAccents;
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
    openChannelComposer,
    readOnlyTable,
    startCreate,
    bulkOpen,
    setBulkOpen,
    tableTaskLabel,
    tablePrimaryAction,
    bulkTables,
    envStatus,
    openCommand,
    selectBot,
    themeMode,
    toggleThemeMode,
  } = props;

  const currentBotKey = activeBotKey || selectedBot || "main";
  const matchedGroup = groups.find((g) => String(g.group_id || g.chat_id || "") === selectedScope);
  const scopeLabel = selectedScope ? (matchedGroup?.group_name || selectedScope) : "Toàn hệ thống";

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1100,
        height: 56,
        px: { xs: 1.5, md: 2.5 },
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      }}
    >
      {/* Left: Context Pills (Bot + Group Selector) */}
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
        {props.showTaskData && (
          <Tooltip title="Quay lại">
            <IconButton size="small" onClick={onBack} sx={{ mr: 0.5 }}>
              <ArrowLeft size={17} />
            </IconButton>
          </Tooltip>
        )}

        {/* Bot selector pill */}
        <FormControl size="small">
          <Select
            value={currentBotKey}
            onChange={(e) => selectBot(e.target.value)}
            displayEmpty
            sx={{
              height: 32,
              fontSize: "0.82rem",
              fontWeight: 600,
              bgcolor: "background.default",
              borderRadius: 1.5,
              "& .MuiSelect-select": {
                py: 0.5,
                px: 1,
                display: "flex",
                alignItems: "center",
                gap: 0.75,
              },
            }}
          >
            {bots.map((b) => (
              <MenuItem key={b.bot_key || b.id} value={String(b.bot_key || "")}>
                <Bot size={14} style={{ opacity: 0.7 }} />
                {b.name || b.bot_key}
              </MenuItem>
            ))}
            {!bots.length && <MenuItem value="main">Bot chính (main)</MenuItem>}
          </Select>
        </FormControl>

        {/* Scope selector pill */}
        <FormControl size="small" sx={{ display: { xs: "none", sm: "block" } }}>
          <Select
            value={selectedScope}
            onChange={(e) => {
              setSelectedScope(e.target.value);
              setSelected(null);
              setDraft({});
              setSelectedIds(new Set());
            }}
            displayEmpty
            sx={{
              height: 32,
              fontSize: "0.82rem",
              fontWeight: 600,
              bgcolor: "background.default",
              borderRadius: 1.5,
              maxWidth: 200,
              "& .MuiSelect-select": {
                py: 0.5,
                px: 1,
                display: "flex",
                alignItems: "center",
                gap: 0.75,
              },
            }}
          >
            <MenuItem value="">
              <Users size={14} style={{ opacity: 0.7 }} />
              Toàn hệ thống
            </MenuItem>
            {groups
              .filter((g) => !activeBotKey || !g.bot_key || g.bot_key === activeBotKey)
              .map((g) => {
                const val = String(g.group_id || g.chat_id || "");
                return val ? (
                  <MenuItem key={val} value={val}>
                    {g.group_name || val}
                  </MenuItem>
                ) : null;
              })}
          </Select>
        </FormControl>

        <Divider orientation="vertical" flexItem sx={{ height: 20, my: "auto", display: { xs: "none", md: "block" } }} />

        {/* Current View Title Tag */}
        <Typography
          variant="subtitle2"
          noWrap
          sx={{
            display: { xs: "none", lg: "block" },
            fontWeight: 700,
            fontSize: "0.85rem",
            color: "text.primary",
          }}
        >
          {tableTaskLabel[table.key] || table.label}
        </Typography>
      </Stack>

      {/* Center: Search & Command Shortcut */}
      <Box sx={{ flex: 1, maxWidth: { xs: 200, sm: 340, md: 420 }, mx: 1 }}>
        <TextField
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") loadRows(search);
          }}
          placeholder="Tìm kiếm dữ liệu hoặc bấm ⌘K..."
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={15} style={{ opacity: 0.6 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Box
                    onClick={openCommand}
                    sx={{
                      cursor: "pointer",
                      px: 0.6,
                      py: 0.1,
                      bgcolor: "action.hover",
                      borderRadius: 1,
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      border: "1px solid",
                      borderColor: "divider",
                      color: "text.secondary",
                      userSelect: "none",
                    }}
                  >
                    ⌘K
                  </Box>
                </InputAdornment>
              ),
            },
          }}
          sx={{
            width: "100%",
            "& .MuiOutlinedInput-root": {
              height: 34,
              fontSize: "0.82rem",
              borderRadius: 2,
              bgcolor: "background.default",
            },
          }}
        />
      </Box>

      {/* Right: Actions, Theme, Status */}
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexShrink: 0 }}>
        {/* Bulk Toggle Button */}
        {bulkTables.has(table.key) && (
          <MuiButton
            size="small"
            variant={bulkOpen ? "contained" : "outlined"}
            onClick={() => setBulkOpen((v) => !v)}
            sx={{ height: 32, textTransform: "none", fontSize: "0.78rem", display: { xs: "none", sm: "flex" } }}
          >
            {bulkOpen ? "Đóng Bulk" : "Nhập hàng loạt"}
          </MuiButton>
        )}

        {/* Reload button */}
        <Tooltip title="Tải lại dữ liệu">
          <IconButton size="small" onClick={() => loadRows(search)} sx={{ width: 32, height: 32 }}>
            <RefreshCcw size={15} />
          </IconButton>
        </Tooltip>

        {/* Theme toggle */}
        <Tooltip title={themeMode === "dark" ? "Chuyển giao diện sáng" : "Chuyển giao diện tối"}>
          <IconButton size="small" onClick={toggleThemeMode} sx={{ width: 32, height: 32 }}>
            {themeMode === "dark" ? <SunMedium size={16} /> : <MoonStar size={16} />}
          </IconButton>
        </Tooltip>

        {/* Primary Action Button */}
        {table.key === "channel_posts" ? (
          <MuiButton
            variant="contained"
            size="small"
            startIcon={<Send size={14} />}
            onClick={openChannelComposer}
            sx={{ height: 32, textTransform: "none", fontWeight: 700, fontSize: "0.8rem", px: 1.5 }}
          >
            Đăng bài
          </MuiButton>
        ) : !readOnlyTable && table.key !== "config" && table.key !== "scam_reports" ? (
          <MuiButton
            variant="contained"
            size="small"
            startIcon={<Plus size={14} />}
            onClick={startCreate}
            sx={{ height: 32, textTransform: "none", fontWeight: 700, fontSize: "0.8rem", px: 1.5 }}
          >
            {tablePrimaryAction[table.key] || "Tạo mới"}
          </MuiButton>
        ) : null}
      </Stack>
    </Box>
  );
}
