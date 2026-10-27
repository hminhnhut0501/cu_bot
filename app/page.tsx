"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button as MuiButton,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  Activity,
  Archive,
  BarChart3,
  Bot,
  CalendarClock,
  Check,
  CheckSquare,
  Clock3,
  ClipboardList,
  Database,
  Edit3,
  Eye,
  Gift,
  History,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Power,
  RefreshCcw,
  RotateCcw,
  Save,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Trash2,
  Users,
  Wrench,
  X,
  UserPlus,
  UserMinus,
  BellOff,
  PanelLeftClose,
  PanelLeftOpen,
  NotebookPen,
  Shield,
  LogIn,
  LogOut,
} from "lucide-react";

import { FieldConfig, FieldType, TableConfig, TABLES } from "@/lib/tables";
import { ADMIN_TASKS, TABLE_PRIMARY_ACTIONS, TABLE_TASK_LABELS } from "@/lib/tasks";
import { AutomationScreen, AutoReplyScreen, BotScreen, GroupScreen, InspectorPanel, ModerationScreen, WelcomeScreen, GiveawayScreen, ShareUnlockScreen } from "./components/module-screens";
import AuditConsole from "./components/screens/AuditConsole";
import ScamInbox from "./components/screens/ScamInbox";
import BulkPanel from "./components/screens/BulkPanel";
import MetricsDashboard, { type AnalyticsSummary } from "./components/screens/MetricsDashboard";
import MenuPolicyConsole from "./components/screens/MenuPolicyConsole";
import ChannelComposer from "./components/screens/ChannelComposer";
import CommandPalette from "./components/screens/CommandPalette";
import ModerationToggles from "./components/screens/ModerationToggles";
import Topbar from "./components/screens/Topbar";
import LoginPanel from "./components/screens/LoginPanel";
import ModerationConfigSections from "./components/screens/ModerationConfigSections";
import ModulesHubView from "./components/screens/ModulesHubView";
import MemberWorkspace from "./components/screens/MemberWorkspace";
import MemberDetailDrawer from "./components/screens/MemberDetailDrawer";
import MemberActionDialog from "./components/screens/MemberActionDialog";
import ChannelPublisherConsole from "./components/screens/ChannelPublisherConsole";
import Banners from "./components/screens/Banners";
import WorkbenchList from "./components/screens/WorkbenchList";
import ConfigEditor, { type ConfigEditorDraft } from "./components/screens/ConfigEditor";
import LoadingScreen from "./components/ui/LoadingScreen";
import ErrorAlert from "./components/ui/ErrorAlert";
import Section from "./components/ui/Section";
import StatCard from "./components/ui/StatCard";
import TabsBar from "./components/ui/TabsBar";
import { UI_COPY } from "@/lib/uiCopy";
import { buildCommandInsights, buildEditorFieldGroups, buildGroupEditorTabs, buildLiveActivity, buildModerationPolicySummary, buildOperationTasks, buildScamWorkbenchRows, buildScopeCrumbs, filterVisibleRows } from "@/lib/workbench-helpers";
import { useThemeMode } from "./theme-registry";
import { moduleAccents } from "./theme";

// Legacy smoke markers retained for compatibility:
// Hàng đợi vận hành
// task-workbench
// Thiết lập, kiểm thử và theo dõi bảo vệ
// Tạo câu trả lời đúng ngữ cảnh
// Duyệt báo cáo và xây hồ sơ scam
// task-outcome-strip
// scam-inbox
// channel-composer
// scope-breadcrumb
// schedule-wizard
// production-readiness
// writeAuditLog

import {
  type Row,
  type BulkRow,
  type BulkDefaults,
  type Meta,
  FALLBACK_META,
  type Lookups,
  type CommandInsight,
  type WorkMode,
  type RuleTestResult,
  type EmptyStateConfig,
  type ToastState,
  type DeleteFailureAlert,
  type ChannelPostTab,
  type ChannelButtonDraft,
  type MemberWorkspaceTab,
  type MemberActionType,
  type MemberOverview,
  type MemberActionDraft,
  type MemberFilterState,
} from "@/lib/cp-types";
import {
  drawerWidth,
  drawerCollapsedWidth,
  defaultBoolean,
  CONFIG_BOOLEAN_KEYS,
  CONFIG_SELECT_OPTIONS,
  CONFIG_DEFAULT_VALUES,
  ADVANCED_FIELD_KEYS,
  GROUP_TAB_ORDER,
  GROUP_BASE_SECTIONS,
  GROUP_MODULE_SECTIONS,
  GROUP_TAB_LABELS,
  SCHEDULE_STEPS,
  bulkTables,
  NAV_GROUPS,
  CORE_LAYERS,
  SYSTEM_LAYERS,
  TABLE_GUIDES,
  COMMAND_OPTIONS,
  CP_STATE_STORAGE_KEY,
  CONFIG_LABELS,
  CONFIG_SECTIONS,
  MODULE_HUBS,
  MODULE_TABLE_OWNER,
  MODULES_REQUIRE_EXPLICIT_ENABLE,
  MODULE_CONFIG_KEYS,
  SYSTEM_CONFIG_SECTIONS,
  CONFIG_DESCRIPTIONS,
  defaultBulkDefaults,
} from "@/lib/cp-constants";
import {
  emptyValues,
  draftFromRow,
  titleFor,
  configLabel,
  configDescription,
  isConfigBoolean,
  materializeConfigRows,
  readSettingsObject,
  isVirtualConfigRow,
  configDisplayValue,
  configValueCaption,
  configPlaceholders,
  configFieldHint,
  configEditorKind,
  configSelectOptions,
  configInputGuide,
  friendlySaveError,
  fieldUnitHint,
  fieldByKey,
  displayValue,
  formatDateTime,
  vietnamDayKey,
  parseDetails,
  auditLegacyReason,
  isAutomaticAudit,
  auditActor,
  auditReason,
  auditDeletedContent,
  auditLogSpecificRows,
  auditLogRows,
  auditLogCardData,
  auditActionTone,
  auditLogEssentials,
  auditLogSeverity,
  auditLogSummary,
  metricLabel,
  metricPeriod,
  metricValue,
  previewText,
  scamReportTarget,
  scamReportSummary,
  scamReportFacts,
  statusClass,
  statusText,
  healthState,
  actionBadge,
  detailRows,
  advancedDetailRows,
  fieldIsAdvanced,
  rowMatchesQuickFilter,
  tableHasField,
  tableSupportsScope,
  buildScopedQuery,
  normalizedText,
  safeRegexMatch,
  rowMatchesRule,
  extractDomains,
  testRowsForTable,
  cockpitMetrics,
  cockpitActivity,
  heroFor,
  workflowFor,
  emptyStateFor,
  groupedFields,
  sortGroupFieldGroups,
  groupTabLabel,
  allowedGroupSectionsForLayer,
  dangerousGroupChanges,
  poolRows,
  uniquePoolCounts,
  poolPreviewText,
  splitBulkLines,
  parseDelimited,
  parseSheetOrPipe,
  parseBulkRows,
  bulkHint,
  groupedNav,
  uniqueValues,
  channelPostTabFor,
  channelButtonsFromText,
  channelButtonsToText,
  vietnamDateTimeInput,
  vietnamInputToIso,
  actionLabel,
  layerContainsTable,
  loadCpState,
  saveCpState,
} from "@/lib/cp-helpers";

export default function HomePage() {
  const { mode: themeMode, toggleMode: toggleThemeMode } = useThemeMode();
  const initialCpState = typeof window === "undefined" ? {} : loadCpState();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [activeKey, setActiveKey] = useState(initialCpState.activeKey || "");
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const [draft, setDraft] = useState<Row>({});
  const [search, setSearch] = useState(initialCpState.search || "");
  const [password, setPassword] = useState("");
  const [savedPassword, setSavedPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [deleteFailureAlert, setDeleteFailureAlert] = useState<DeleteFailureAlert>({ recentCount: 0, latestAt: "", latestReason: "" });
  const [bulkText, setBulkText] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDefaults, setBulkDefaults] = useState<BulkDefaults>(defaultBulkDefaults);
  const [selectedBot, setSelectedBot] = useState(initialCpState.selectedBot || "");
  const [selectedScope, setSelectedScope] = useState(initialCpState.selectedScope || "");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeConfigTab, setActiveConfigTab] = useState(initialCpState.activeConfigTab || "");
  const [activeLayer, setActiveLayer] = useState(initialCpState.activeLayer || "overview");
  const [advancedUnlocked, setAdvancedUnlocked] = useState(false);
  const [activeModule, setActiveModule] = useState("moderation");
  const [showTaskData, setShowTaskData] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [scanMode, setScanMode] = useState<"scan" | "detail">((initialCpState.scanMode === "detail" ? "detail" : "scan"));
  const [workMode, setWorkMode] = useState<WorkMode>((initialCpState.workMode === "edit" ? "edit" : initialCpState.workMode === "operate" ? "operate" : "overview"));
  const [quickFilter, setQuickFilter] = useState("");
  const [quickTestInput, setQuickTestInput] = useState("");
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [activeGroupTab, setActiveGroupTab] = useState(initialCpState.activeGroupTab || "Thông tin");
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  const [topbarMenuOpen, setTopbarMenuOpen] = useState(false);
  const [lookups, setLookups] = useState<Lookups>({ bots: [], groups: [], messages: [], videos: [], moduleSettings: [], scamReports: [], scamBroadcasts: [], auditLogs: [], channelPosts: [], giveawayEntries: [], shareUnlockCampaigns: [], shareUnlockInvites: [], shareUnlockReferrals: [] });
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [memberOverview, setMemberOverview] = useState<MemberOverview | null>(null);
  const [memberOverviewLoading, setMemberOverviewLoading] = useState(false);
  const [memberTab, setMemberTab] = useState<MemberWorkspaceTab>("observed");
  const [memberSearchInput, setMemberSearchInput] = useState("");
  const [memberFilters, setMemberFilters] = useState<MemberFilterState>({
    search: "",
    status: "all",
    source: "all",
    reason: "all",
    sortBy: "last_seen_at",
    sortDir: "desc",
  });
  const [memberPage, setMemberPage] = useState(1);
  const [memberPageSize] = useState(12);
  const [memberDetailOpen, setMemberDetailOpen] = useState(false);
  const [memberSelectedRow, setMemberSelectedRow] = useState<Row | null>(null);
  const [memberDetailLoading, setMemberDetailLoading] = useState(false);
  const [memberDetail, setMemberDetail] = useState<{
    scope?: { botKey?: string; groupId?: string; userId?: string };
    member?: Row | null;
    stats?: { joinCount?: number; leaveCount?: number; actionCount?: number; lastActionAt?: string };
    timeline?: Array<{ type?: string; at: string; actor?: string; reason?: string; source?: string; label?: string; tone?: string }>;
    notes?: Array<{ id?: string; text?: string; created_at?: string; created_by?: string; source?: string }>;
  } | null>(null);
  const [memberTimelineFilter, setMemberTimelineFilter] = useState<"all" | "moderation" | "activity" | "audit">("all");
  const [memberNoteDraft, setMemberNoteDraft] = useState("");
  const [memberNoteSaving, setMemberNoteSaving] = useState(false);
  const [memberActionOpen, setMemberActionOpen] = useState(false);
  const [memberActionFeedback, setMemberActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [memberActionTrace, setMemberActionTrace] = useState<{
    at: string;
    action: string;
    request: Record<string, unknown>;
    response: Record<string, unknown>;
    ok: boolean;
    scopeSummary?: string;
  } | null>(null);
  const [memberActionDraft, setMemberActionDraft] = useState<MemberActionDraft>({
    user_id: "",
    username: "",
    display_name: "",
    action: "mute",
    reason: "",
    duration_seconds: 3600,
  });
  const [channelTab, setChannelTab] = useState<ChannelPostTab>((initialCpState.channelTab === "scheduled" || initialCpState.channelTab === "sent" || initialCpState.channelTab === "deleted" || initialCpState.channelTab === "failed") ? initialCpState.channelTab : "queue");
  const [channelPage, setChannelPage] = useState(1);
  const [channelComposerOpen, setChannelComposerOpen] = useState(false);
  const [channelComposer, setChannelComposer] = useState<Row>({});
  const [channelButtons, setChannelButtons] = useState<ChannelButtonDraft[]>([{ label: "", url: "", row: 0 }]);
  const [welcomeDraftText, setWelcomeDraftText] = useState("");
  const [welcomeDraftDeleteSeconds, setWelcomeDraftDeleteSeconds] = useState(30);
  const [welcomeDraftButtonsText, setWelcomeDraftButtonsText] = useState("");
  const [welcomeDraftEnabled, setWelcomeDraftEnabled] = useState(false);
  const [welcomeTesting, setWelcomeTesting] = useState(false);
  const [autoReplyCreateOpen, setAutoReplyCreateOpen] = useState(false);
  const [autoReplyEditingId, setAutoReplyEditingId] = useState<string | null>(null);
  const [autoReplyDraft, setAutoReplyDraft] = useState({
    trigger: "hello",
    match: "smart",
    ignore_diacritics: false,
    reply: "Chào {user}, mình có thể giúp gì cho bạn?",
    notes: "",
    enabled: true,
  });
  const restoredCpStateRef = useRef(false);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 8000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const stored = window.localStorage.getItem("cu_bot_cp_password") || "";
    setSavedPassword(stored);
    setPassword(stored);
    fetch("/api/meta")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`meta failed (${response.status})`);
        }
        return response.json();
      })
      .then((payload: Meta) => {
        setMeta(payload);
        const restored = loadCpState();
        const fallbackKey = payload.tables.find((item) => item.key === "bot_metrics")?.key || payload.tables[0]?.key || "";
        setActiveKey(restored.activeKey && payload.tables.some((item) => item.key === restored.activeKey) ? restored.activeKey : fallbackKey);
        if (restored.activeLayer) {
          setActiveLayer(restored.activeLayer);
        }
        if (restored.activeConfigTab) {
          setActiveConfigTab(restored.activeConfigTab);
        }
        if (restored.activeGroupTab) {
          setActiveGroupTab(restored.activeGroupTab);
        }
        if (restored.search !== undefined) {
          setSearch(restored.search);
        }
        if (restored.selectedBot) {
          setSelectedBot(restored.selectedBot);
        }
        if (restored.selectedScope) {
          setSelectedScope(restored.selectedScope);
        }
      })
      .catch((err) => {
        setMeta(FALLBACK_META);
        setActiveKey(FALLBACK_META.tables.find((item) => item.key === "bot_metrics")?.key || FALLBACK_META.tables[0]?.key || "");
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || restoredCpStateRef.current) {
      return;
    }
    restoredCpStateRef.current = true;
    const stored = loadCpState();
    if (stored.activeLayer) {
      setActiveLayer(stored.activeLayer);
    }
    if (stored.search !== undefined) {
      setSearch(stored.search);
    }
    if (stored.activeKey && meta?.tables.some((item) => item.key === stored.activeKey)) {
      setActiveKey(stored.activeKey);
    }
    if (stored.selectedBot) {
      setSelectedBot(stored.selectedBot);
    }
    if (stored.selectedScope) {
      setSelectedScope(stored.selectedScope);
    }
    if (stored.workMode === "overview" || stored.workMode === "operate" || stored.workMode === "edit") {
      setWorkMode(stored.workMode);
    }
    if (stored.scanMode === "scan" || stored.scanMode === "detail") {
      setScanMode(stored.scanMode);
    }
    if (stored.activeConfigTab) {
      setActiveConfigTab(stored.activeConfigTab);
    }
    if (stored.activeGroupTab) {
      setActiveGroupTab(stored.activeGroupTab);
    }
    if (stored.channelTab === "queue" || stored.channelTab === "scheduled" || stored.channelTab === "sent" || stored.channelTab === "deleted" || stored.channelTab === "failed") {
      setChannelTab(stored.channelTab as ChannelPostTab);
    }
  }, [loading, meta?.tables]);

  useEffect(() => {
    if (loading) {
      return;
    }
    saveCpState({
      activeLayer,
      activeKey,
      search,
      selectedBot,
      selectedScope,
      workMode,
      scanMode,
      activeConfigTab,
      activeGroupTab,
      channelTab,
    });
  }, [activeConfigTab, activeGroupTab, activeKey, activeLayer, channelTab, loading, scanMode, search, selectedBot, selectedScope, workMode]);

  const table = useMemo(() => meta?.tables.find((item) => item.key === activeKey), [activeKey, meta]);
  const parsedBulkRows = useMemo(() => (table ? parseBulkRows(table.key, bulkText, bulkDefaults) : []), [bulkText, bulkDefaults, table]);
  const messagePools = useMemo(() => uniqueValues(lookups.messages, "pool"), [lookups.messages]);
  const videoPools = useMemo(() => uniqueValues(lookups.videos, "pool"), [lookups.videos]);
  const messagePoolCounts = useMemo(() => uniquePoolCounts(lookups.messages), [lookups.messages]);
  const videoPoolCounts = useMemo(() => uniquePoolCounts(lookups.videos), [lookups.videos]);
  const hero = useMemo(() => heroFor(activeKey), [activeKey]);
  const HeroIcon = hero.icon;
  const activeBotKey = selectedBot || lookups.bots[0]?.bot_key || "";
  const currentBot = useMemo(() => lookups.bots.find((bot) => bot.bot_key === activeBotKey), [activeBotKey, lookups.bots]);
  const visibleRows = useMemo(() => filterVisibleRows({
    rows,
    tableKey: table?.key,
    selectedBot: activeBotKey,
    selectedGroup: selectedScope,
    quickFilter,
    rowMatchesQuickFilter
  }).filter((row) => {
    if (activeLayer === "members" && table?.key === "audit_logs") {
      return ["member_joined", "member_left", "member_join_request"].includes(String(row.action || "").toLowerCase());
    }
    return true;
  }), [rows, activeBotKey, selectedScope, table?.key, quickFilter, activeLayer]);
  const channelRows = useMemo(
    () => visibleRows.filter((row) => channelPostTabFor(row) === channelTab).sort((left, right) => Date.parse(String(right.updated_at || right.created_at || 0)) - Date.parse(String(left.updated_at || left.created_at || 0))),
    [channelTab, visibleRows]
  );
  const channelPageSize = 10;
  const channelPageCount = Math.max(1, Math.ceil(channelRows.length / channelPageSize));
  const channelPageRows = useMemo(
    () => channelRows.slice((channelPage - 1) * channelPageSize, channelPage * channelPageSize),
    [channelPage, channelRows]
  );
  const selectedVisibleRows = useMemo(() => visibleRows.filter((row) => selectedIds.has(String(row.id))), [visibleRows, selectedIds]);
  const workflow = useMemo(() => workflowFor(activeKey, visibleRows, selectedVisibleRows.length), [activeKey, visibleRows, selectedVisibleRows.length]);
  const WorkflowIcon = workflow?.icon;
  const selectedScopeRow = useMemo(() => {
    if (!selectedScope) {
      return null;
    }
    return lookups.groups.find((group) => String(group.group_id || group.chat_id || "") === selectedScope) || null;
  }, [lookups.groups, selectedScope]);
  const groupWelcomeContext = useMemo(() => {
    if (table?.key !== "groups") {
      return selectedScopeRow;
    }
    return Object.keys(draft).length ? draft : selectedScopeRow;
  }, [draft, selectedScopeRow, table?.key]);
  const welcomeSyncGroupKey = String(selectedScopeRow?.id || selectedScopeRow?.group_id || selectedScope || "");
  const welcomeGroupEnabled = groupWelcomeContext ? String(groupWelcomeContext.welcome_enabled ?? "false") !== "false" : false;
  const groupNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of lookups.groups) {
      const groupId = String(group.group_id || "").trim();
      if (!groupId) continue;
      map.set(groupId, String(group.group_name || group.title || groupId));
    }
    return map;
  }, [lookups.groups]);
  const groupNameForId = (groupId: string) => groupNameById.get(String(groupId).trim()) || String(groupId || "");
  const systemBlacklistActive = activeLayer === "blacklist";
  const selectedMemberChatId = String(selectedScopeRow?.group_id || selectedScopeRow?.chat_id || selectedScope || "").trim();
  const effectiveMemberChatId = systemBlacklistActive ? "*" : selectedMemberChatId;
  const effectiveMemberBotKey = systemBlacklistActive ? "*" : (activeBotKey || selectedBot || "main");
  const memberSummary = memberOverview?.summary || {};
  const memberPagination = memberOverview?.pagination || {};
  const memberRowsByTab: Record<MemberWorkspaceTab, Row[]> = {
    observed: memberOverview?.active || [],
    moderated: [...(memberOverview?.muted || []), ...(memberOverview?.banned || [])],
    blacklist: memberOverview?.blacklisted || [],
    left: memberOverview?.logs || [],
  };
  const memberLaneCount = {
    observed: memberRowsByTab.observed.length,
    moderated: memberRowsByTab.moderated.length,
    blacklist: memberRowsByTab.blacklist.length,
    left: memberRowsByTab.left.length,
  };
  const memberAllRows = [...memberRowsByTab.observed, ...memberRowsByTab.moderated, ...memberRowsByTab.blacklist, ...memberRowsByTab.left];
  const systemBlacklistRows = memberOverview?.blacklisted || [];
  const systemBlacklistLogs = memberRowsByTab.left.filter((row) => String(row.action || "").toLowerCase().includes("blacklist"));
  const memberTabLabel = (key: MemberWorkspaceTab) => {
    if (key === "observed") return `Member observed (${memberLaneCount.observed})`;
    if (key === "moderated") return `Member moderated (${memberLaneCount.moderated})`;
    if (key === "blacklist") return `Blacklist (${memberLaneCount.blacklist})`;
    return `Member left (${memberLaneCount.left})`;
  };
  const memberTabItems: Array<{ key: MemberWorkspaceTab; label: string }> = [
    { key: "observed", label: memberTabLabel("observed") },
    { key: "moderated", label: memberTabLabel("moderated") },
    { key: "blacklist", label: memberTabLabel("blacklist") },
    { key: "left", label: memberTabLabel("left") },
  ];
  const memberStatsCards: Array<{ label: string; value: number; Icon: typeof Activity; color: "success" | "warning" | "error" | "info" }> = [
    { label: "Member observed", value: memberLaneCount.observed, Icon: Activity, color: "success" },
    { label: "Member moderated", value: memberLaneCount.moderated, Icon: MessageSquare, color: "warning" },
    { label: "Blacklist", value: memberLaneCount.blacklist, Icon: ShieldCheck, color: "error" },
    { label: "Member left", value: memberLaneCount.left, Icon: LogOut, color: "info" },
  ];
  const systemBlacklistStats: Array<{ label: string; value: string | number; Icon: typeof Activity; color: "error" | "warning" | "info" }> = [
    { label: "User bị chặn", value: memberSummary.blacklisted || 0, Icon: ShieldCheck, color: "error" },
    { label: "Phạm vi", value: "Mọi bot", Icon: Bot, color: "warning" },
    { label: "Áp dụng", value: "Khi join", Icon: Activity, color: "info" },
  ];
  const memberDisplayName = (row: Row) => String(row.display_name || row.full_name || row.username || row.target_display_name || row.target_username || row.user_id || row.target_user_id || "Không rõ");
  const memberUsername = (row: Row) => {
    const value = String(row.username || row.target_username || "").trim();
    return value ? (value.startsWith("@") ? value : `@${value}`) : "";
  };
  const memberUserId = (row: Row) => String(row.user_id || row.target_user_id || row.actor_user_id || "").trim();
  const memberLastSeen = (row: Row) => String(row.last_seen_at || row.updated_at || row.created_at || "").trim();
  const memberStatusOf = (row: Row) => String(row.status || row.member_status || "").trim().toLowerCase() || "normal";
  const memberStatusLabel = (status: string) => {
    const value = String(status || "").trim().toLowerCase();
    if (value === "muted" || value === "restricted") return "Member moderated";
    if (value === "banned" || value === "blacklisted") return "Member moderated";
    if (value === "normal") return "Member observed";
    return "Member left";
  };
  const memberLaneOfRow = (row: Row) => {
    const status = memberStatusOf(row);
    if (status === "muted" || status === "restricted" || status === "banned" || status === "blacklisted") return "moderated" as const;
    if (String(row.action || "").toLowerCase().includes("left") || String(row.action || "").toLowerCase().includes("kick")) return "left" as const;
    return "observed" as const;
  };
  const memberLaneTone = (lane: MemberWorkspaceTab) => {
    if (lane === "observed") return "success" as const;
    if (lane === "moderated") return "warning" as const;
    return "info" as const;
  };
  const memberLaneDescription = (lane: MemberWorkspaceTab) => {
    if (lane === "observed") return "Đã thấy trong group hoặc có dấu vết hoạt động.";
    if (lane === "moderated") return "Đã bị warn, restrict, mute, ban hoặc blacklist.";
    return "Đã rời group hoặc bị kick, chỉ còn dấu vết sự kiện.";
  };
  const memberSourceOf = (row: Row) => String(row.source || "").trim().toLowerCase();
  const memberReasonOf = (row: Row) => String(row.reason || row.payload?.reason || "").trim();
  const memberMatchesSearch = (row: Row, query: string) => {
    const needle = query.trim().toLowerCase().replace(/^@/, "");
    if (!needle) return true;
    return [
      memberDisplayName(row),
      memberUsername(row),
      memberUserId(row),
      memberReasonOf(row),
      String(row.action || ""),
      String(row.target_label || ""),
    ].some((value) => String(value || "").toLowerCase().replace(/^@/, "").includes(needle));
  };
  const memberFilteredRows = memberOverview?.members || [];
  const memberPageRows = memberFilteredRows;
  const memberTotalPages = Math.max(1, Math.ceil((memberPagination.total || memberFilteredRows.length || 0) / (memberPagination.pageSize || memberPageSize)));
  const memberActiveMeta = systemBlacklistActive
    ? "system snapshot"
    : memberOverview?.meta?.lastUpdatedAt
      ? `cập nhật ${formatDateTime(memberOverview.meta.lastUpdatedAt)}`
      : memberOverview?.date
        ? `snapshot ${memberOverview.date}`
        : "snapshot";
  const memberLoadedCount = memberPagination.total || memberFilteredRows.length || 0;
  const memberActionLabel: Record<MemberActionType, string> = {
    mute: "Cấm chat",
    ban: "Ban",
    unmute: "Mở chat",
    unban: "Gỡ ban",
    blacklist: "Thêm blacklist",
    unblacklist: "Gỡ blacklist",
    kick: "Kick",
  };
  const isBlacklistAction = systemBlacklistActive && memberActionDraft.action === "blacklist";
  const memberStatusBadgeLabel = (row: Row) => {
    const status = memberStatusOf(row);
    if (status === "muted" || status === "restricted") return "muted";
    if (status === "banned") return "banned";
    if (status === "blacklisted") return "blacklist";
    if (String(row.action || "").toLowerCase().includes("left") || String(row.action || "").toLowerCase().includes("kick")) return "left";
    return "normal";
  };
  const memberReleaseActionFor = (row: Row) => {
    const status = memberStatusOf(row);
    if (status === "blacklisted") return { action: "unblacklist" as MemberActionType, label: "Gỡ blacklist" };
    if (status === "banned") return { action: "unban" as MemberActionType, label: "Gỡ ban" };
    return null;
  };
  const memberTabForAction: Partial<Record<MemberActionType, MemberWorkspaceTab>> = {
    mute: "moderated",
    ban: "moderated",
    blacklist: "blacklist",
    unmute: "observed",
    unban: "observed",
    unblacklist: "observed",
    kick: "left",
  };
  const openMemberDetail = async (row: Row) => {
    setMemberSelectedRow(row);
    setMemberDetailOpen(true);
    setMemberTimelineFilter("all");
    setMemberNoteDraft("");
    setMemberDetailLoading(true);
    try {
      const params = new URLSearchParams();
      if (systemBlacklistActive) {
        params.set("bot_key", "*");
      } else if (selectedBot) {
        params.set("bot_key", selectedBot);
      }
      if (!systemBlacklistActive && effectiveMemberChatId) params.set("group_id", effectiveMemberChatId);
      params.set("user_id", memberUserId(row));
      const payload = await api(`/api/members/detail?${params.toString()}`);
      setMemberDetail(payload);
    } catch {
      setMemberDetail(null);
    } finally {
      setMemberDetailLoading(false);
    }
  };
  const resetMemberFilters = () => {
    setMemberSearchInput("");
    setMemberFilters({
      search: "",
      status: "all",
      source: "all",
      reason: "all",
      sortBy: "last_seen_at",
      sortDir: "desc",
    });
    setMemberPage(1);
  };
  const memberDetailTimeline = useMemo(() => {
    const rows = memberDetail?.timeline || [];
    return rows.filter((item) => {
      if (memberTimelineFilter === "all") return true;
      if (memberTimelineFilter === "activity") return String(item.source || "").toLowerCase() === "activity";
      if (memberTimelineFilter === "audit") return String(item.source || "").toLowerCase() === "audit";
      return String(item.source || "").toLowerCase() === "state" || String(item.source || "").toLowerCase() === "moderation";
    });
  }, [memberDetail?.timeline, memberTimelineFilter]);
  const memberLaneRowsFor = (lane: MemberWorkspaceTab) => {
    if (lane === "observed") return memberRowsByTab.observed;
    if (lane === "moderated") return memberRowsByTab.moderated;
    if (lane === "blacklist") return memberRowsByTab.blacklist;
    return memberRowsByTab.left;
  };
  const timelineToneForSource = (source?: string) => {
    const value = String(source || "").toLowerCase();
    if (value === "activity") return "success";
    if (value === "audit") return "info";
    if (value === "state" || value === "moderation") return "warning";
    return "default";
  };
  const timelineIconForType = (type?: string, source?: string) => {
    const action = String(type || "").toLowerCase();
    if (source === "activity") return <Activity size={15} />;
    if (action === "member_joined") return <LogIn size={15} />;
    if (action === "member_join_request") return <UserPlus size={15} />;
    if (action === "member_left") return <LogOut size={15} />;
    if (action === "member_mute" || action === "restrict") return <BellOff size={15} />;
    if (action === "member_unmute") return <Users size={15} />;
    if (action === "member_ban" || action === "ban") return <Shield size={15} />;
    if (action === "member_unban") return <UserMinus size={15} />;
    if (action === "member_kick") return <UserMinus size={15} />;
    if (action === "member_blacklist" || action === "member_blacklist_join_blocked") return <ShieldCheck size={15} />;
    if (action === "member_unblacklist") return <RotateCcw size={15} />;
    if (action.includes("note")) return <NotebookPen size={15} />;
    return <History size={15} />;
  };
  const timelineToneForType = (type?: string, source?: string) => {
    const action = String(type || "").toLowerCase();
    if (action === "member_joined" || action === "member_join_request") return "success" as const;
    if (action === "member_left" || action === "member_kick") return "default" as const;
    if (action === "member_mute" || action === "restrict" || action === "member_unmute") return "warning" as const;
    if (action === "member_ban" || action === "ban" || action === "member_blacklist" || action === "member_blacklist_join_blocked") return "error" as const;
    if (action === "member_unban" || action === "member_unblacklist") return "info" as const;
    if (action.includes("note")) return "secondary" as const;
    return timelineToneForSource(source) as any;
  };
  const saveMemberNote = async () => {
    if (!memberSelectedRow) return;
    const note = memberNoteDraft.trim();
    if (!note) {
      setToast({ type: "error", message: "Nhập note trước khi lưu." });
      return;
    }
    setMemberNoteSaving(true);
    try {
      const params = new URLSearchParams();
      if (systemBlacklistActive) {
        params.set("bot_key", "*");
      } else if (selectedBot) {
        params.set("bot_key", selectedBot);
      }
      if (!systemBlacklistActive && effectiveMemberChatId) params.set("group_id", effectiveMemberChatId);
      params.set("user_id", memberUserId(memberSelectedRow));
      const payload = await api(`/api/members/detail?${params.toString()}`);
      const result = await api("/api/members/detail", {
        method: "POST",
        body: JSON.stringify({
          bot_key: systemBlacklistActive ? "*" : (selectedBot || "main"),
          group_id: systemBlacklistActive ? "*" : effectiveMemberChatId,
          user_id: memberUserId(memberSelectedRow),
          note,
          actor_user_id: "admin_cp",
        }),
      });
      setMemberNoteDraft("");
      setMemberDetail({
        ...payload,
        ...result,
      });
      await loadMemberOverview(memberSearchInput);
      setToast({ type: "success", message: "Đã lưu note vào member case." });
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Không thể lưu note." });
    } finally {
      setMemberNoteSaving(false);
    }
  };
  const ruleTestResults = useMemo(() => testRowsForTable(table?.key || "", visibleRows, quickTestInput), [quickTestInput, table?.key, visibleRows]);
  const showRuleTester = Boolean(table && ["keywords", "auto_replies", "domain_blacklist", "link_shorteners"].includes(table.key));
  const scamInboxStats = useMemo(() => {
    const sourceRows = table?.key === "scam_reports" ? rows : [];
    return {
      pending: sourceRows.filter((row) => String(row.status || "pending") === "pending").length,
      confirmed: sourceRows.filter((row) => row.status === "confirmed").length,
      rejected: sourceRows.filter((row) => row.status === "rejected").length
    };
  }, [rows, table?.key]);
  const pendingScamReports = useMemo(
    () => lookups.scamReports.filter((row) => String(row.status || "pending") === "pending").length,
    [lookups.scamReports]
  );
  const auditStats = useMemo(() => {
    const sourceRows = table?.key === "audit_logs" ? rows : [];
    const critical = sourceRows.filter((row) => auditLogSeverity(row) === "critical").length;
    const warning = sourceRows.filter((row) => auditLogSeverity(row) === "warning").length;
    const latest = sourceRows[0];
    return {
      total: sourceRows.length,
      critical,
      warning,
      latestTime: latest ? formatDateTime(latest.created_at) : "Chưa có log"
    };
  }, [rows, table?.key]);
  const selectedScopeProtection = useMemo(() => {
    const row = selectedScopeRow || visibleRows.find((item) => table?.key === "groups" && String(item.group_id || item.chat_id || "") === selectedScope) || null;
    if (!row) {
      return {
        ready: false,
        enabledChecks: 0,
        totalChecks: 6,
        warnings: ["Chưa chọn đích cụ thể để đánh giá bảo vệ."]
      };
    }
    const checks = [
      row.enabled !== false,
      row.delete_forwarded_messages === true,
      row.delete_inline_keyboard_messages === true,
      row.delete_messages_from_bots === true || row.remove_unknown_bots === true,
      Boolean(row.spam_action),
      Boolean(row.spam_max_messages && row.spam_window_seconds)
    ];
    const warnings = [
      row.enabled === false ? "Group đang tắt protection." : "",
      !row.spam_action ? "Chưa đặt spam action." : "",
      row.remove_unknown_bots === true ? "Tự kick bot lạ đang bật, cần kiểm tra allowlist." : ""
    ].filter(Boolean);
    return {
      ready: checks.every(Boolean),
      enabledChecks: checks.filter(Boolean).length,
      totalChecks: checks.length,
      warnings
    };
  }, [selectedScope, selectedScopeRow, table?.key, visibleRows]);
  const scheduleSubject = useMemo(() => {
    if (table?.key === "groups" && Object.keys(draft).length) {
      return draft;
    }
    return selectedScopeRow || (table?.key === "groups" ? visibleRows[0] : null) || {};
  }, [draft, selectedScopeRow, table?.key, visibleRows]);
  const scheduleMessagePool = String(scheduleSubject.message_pool || messagePools[0] || "");
  const scheduleVideoPool = String(scheduleSubject.video_pool || videoPools[0] || "");
  const scheduleMessagePreview = useMemo(() => poolRows(lookups.messages, scheduleMessagePool), [lookups.messages, scheduleMessagePool]);
  const scheduleVideoPreview = useMemo(() => poolRows(lookups.videos, scheduleVideoPool), [lookups.videos, scheduleVideoPool]);
  const scheduleIssues = useMemo(() => [
    !lookups.groups.length ? `Bot ${currentBot?.name || selectedBot || "đang chọn"} chưa có chat/channel khả dụng.` : "",
    !scheduleMessagePool ? "Chưa chọn message pool." : "",
    scheduleMessagePool && !scheduleMessagePreview.length ? `Pool tin nhắn "${scheduleMessagePool}" đang rỗng hoặc toàn mục tắt.` : "",
    scheduleSubject.video_enabled && scheduleVideoPool && !scheduleVideoPreview.length ? `Pool video "${scheduleVideoPool}" đang rỗng hoặc toàn mục tắt.` : "",
    scheduleSubject.daily_enabled === false ? "Gửi tin hằng ngày đang tắt trên group này." : ""
  ].filter(Boolean), [currentBot?.name, lookups.groups.length, scheduleMessagePool, scheduleMessagePreview.length, scheduleSubject.chat_id, scheduleSubject.daily_enabled, scheduleSubject.group_id, scheduleSubject.video_enabled, scheduleVideoPool, scheduleVideoPreview.length, selectedBot, selectedScope]);
  const scheduleReadiness = useMemo(() => {
    const hasBot = Boolean(selectedBot || currentBot?.bot_key);
    const hasGroup = Boolean(lookups.groups.length || scheduleSubject.group_id || scheduleSubject.chat_id || selectedScope);
    const hasMessagePool = Boolean(scheduleMessagePool && scheduleMessagePreview.length);
    const hasVideoPool = !scheduleSubject.video_enabled || Boolean(scheduleVideoPool && scheduleVideoPreview.length);
    const ready = hasBot && hasMessagePool && hasVideoPool && !scheduleIssues.length;
    return {
      ready,
      hasBot,
      hasGroup,
      hasMessagePool,
      hasVideoPool,
      pending: ready ? "Đã có bot và nội dung. Nếu cần đích cụ thể, chọn ngay trong form." : "Chưa đủ điều kiện để tự gửi."
    };
  }, [currentBot?.bot_key, lookups.groups.length, scheduleIssues.length, scheduleMessagePool, scheduleMessagePreview.length, scheduleSubject.chat_id, scheduleSubject.group_id, scheduleSubject.video_enabled, scheduleVideoPool, scheduleVideoPreview.length, selectedBot, selectedScope]);
  const dashboardRows = useMemo(() => visibleRows.filter((row) => table?.key === "bot_metrics" && row.enabled !== false), [visibleRows, table?.key]);
  const configScopeModule = useMemo(() => {
    const moduleKey = activeLayer.startsWith("module:") ? activeLayer.replace("module:", "") : "";
    return MODULE_HUBS.find((module) => module.key === moduleKey);
  }, [activeLayer]);
  const moduleRows = useMemo(() => lookups.moduleSettings.filter((row) => !activeBotKey || row.bot_key === activeBotKey), [activeBotKey, lookups.moduleSettings]);
  const scopedConfigRows = useMemo(() => {
    if (table?.key !== "config") {
      return visibleRows;
    }
    if (activeLayer === "module:moderation") {
      const moderationRow = moduleRows.find((row) => String(row.module_key || "").toLowerCase() === "moderation");
      const settings = readSettingsObject(moderationRow?.settings);
      return (configScopeModule?.configKeys || []).map((key) => ({
        id: moderationRow?.id ? `module-setting:${moderationRow.id}:${key}` : `module-setting:new:${activeBotKey || "main"}:${key}`,
        bot_key: activeBotKey || "main",
        key,
        value: settings[key] ?? CONFIG_DEFAULT_VALUES[key] ?? "",
        enabled: true,
        notes: "Cấu hình module moderation áp dụng mặc định cho toàn bộ group.",
        __virtual: true
      }));
    }
    if (configScopeModule?.configKeys?.length) {
      return materializeConfigRows(
        visibleRows.filter((row) => configScopeModule.configKeys?.includes(String(row.key || ""))),
        configScopeModule.configKeys,
        activeBotKey || "main"
      );
    }
    return visibleRows;
  }, [activeLayer, configScopeModule, moduleRows, activeBotKey, table?.key, visibleRows]);
  const configTabs = useMemo(() => {
    const sections = CONFIG_SECTIONS;
    const usedKeys = new Set(sections.flatMap((section) => section.keys));
    const baseTabs = sections.map((section) => ({
      ...section,
      rows: scopedConfigRows.filter((row) => section.keys.includes(String(row.key || "")))
    }));
    const otherRows = scopedConfigRows.filter((row) => !usedKeys.has(String(row.key || "")));
    const tabs = baseTabs.filter((section) => section.rows.length);
    if (otherRows.length) {
      tabs.push({
        title: "Cài đặt khác",
        desc: "Các cài đặt nâng cao chưa thuộc nhóm chính.",
        icon: SlidersHorizontal,
        tone: "main",
        keys: [],
        rows: otherRows
      });
    }
    return tabs;
  }, [activeLayer, scopedConfigRows]);
  const activeConfigSection = useMemo(() => configTabs.find((section) => section.title === activeConfigTab), [activeConfigTab, configTabs]);
  const ActiveConfigIcon = activeConfigSection?.icon;
  const moderationConfigRowMap = useMemo(() => {
    const map = new Map<string, Row>();
    if (activeConfigSection) {
      for (const row of activeConfigSection.rows) {
        map.set(String(row.key || ""), row);
      }
    }
    return map;
  }, [activeConfigSection]);
  const moderationBlocks = useMemo(() => [
    {
      key: "core",
      title: "Cốt lõi",
      desc: "Bật toàn bộ kiểm duyệt và các rule nền cơ bản.",
      toggleKey: "moderation_enabled",
      keys: [
        "moderation_enabled",
        "delete_system_messages",
        "delete_forwarded_messages",
        "allow_forward_messages",
        "allow_automatic_forwards",
        "delete_inline_keyboard_messages",
        "delete_messages_from_bots",
        "remove_unknown_bots",
        "exempt_admins"
      ]
    },
    {
      key: "spam",
      title: "Spam",
      desc: "Ngưỡng spam, thời gian đếm và cách xử lý.",
      toggleKey: "spam_action",
      keys: [
        "spam_max_messages",
        "spam_window_seconds",
        "spam_action",
        "spam_restrict_seconds",
        "ban_after_warnings",
        "ban_seconds",
        "violation_delete_retry_seconds",
        "spam_restrict_text",
        "warning_text",
        "warning_notice_delete_seconds",
        "spam_notice_delete_seconds",
        "media_spam_max_messages",
        "media_spam_window_seconds",
        "media_spam_action"
      ]
    },
    {
      key: "forward",
      title: "Forward nâng cao",
      desc: "Cho phép forward có kiểm soát, lọc theo loại nội dung và ngưỡng vi phạm riêng.",
      toggleKey: "allow_forward_messages",
      keys: [
        "allow_forward_messages",
        "forward_allowed_content_types",
        "forward_spam_max_messages",
        "forward_spam_window_seconds",
        "forward_violation_restrict_after",
        "forward_violation_ban_after",
        "forward_action",
        "forward_warning_reason",
        "forward_warning_text",
        "forward_warning_delete_seconds",
        "inline_keyboard_action"
      ]
    },
    {
      key: "duplicate",
      title: "Duplicate",
      desc: "Phát hiện nội dung lặp và hành động xử lý.",
      toggleKey: "duplicate_message_enabled",
      keys: [
        "duplicate_message_enabled",
        "duplicate_message_max_count",
        "duplicate_message_window_seconds",
        "duplicate_message_action",
        "duplicate_message_reason"
      ]
    },
    {
      key: "bio",
      title: "Bio / Link",
      desc: "Quét bio, link ẩn và cách phản hồi khi phát hiện.",
      toggleKey: "scan_bio_links",
      keys: [
        "scan_bio_links",
        "bio_link_delete_message",
        "bio_link_restrict_seconds",
        "bio_scan_cache_seconds",
        "bio_link_warning_text",
        "bio_link_notice_delete_seconds",
        "scan_hidden_links",
        "scan_text_link",
        "scan_text_mention",
        "allow_in_group_mentions",
        "hidden_link_action",
        "text_link_action",
        "text_mention_action",
        "hidden_link_reason",
        "hidden_link_delete_notice_seconds"
      ]
    }
  ], []);
  const spamConfigBlocks = useMemo(() => [
    {
      key: "emoji",
      title: "Spam nhiều emoji",
      desc: "Xóa tin hoặc forward vượt số emoji cho phép, kể cả caption và tin chỉnh sửa.",
      toggleKey: "emoji_spam_enabled",
      keys: ["emoji_spam_enabled", "emoji_spam_max_count"]
    },
    {
      key: "buttons",
      title: "Tin có nút bấm",
      desc: "Nút inline dùng hành động bên dưới. Rich Message có nút luôn bị xóa và ban vĩnh viễn người gửi; gồm cả tin chỉnh sửa.",
      toggleKey: "delete_inline_keyboard_messages",
      keys: ["delete_inline_keyboard_messages", "inline_keyboard_action"]
    },
    {
      key: "spam",
      title: "Spam thường",
      desc: "Ngưỡng spam, hành động xử lý và thời gian mute.",
      toggleKey: "spam_action",
      keys: ["spam_max_messages", "spam_window_seconds", "spam_action", "spam_restrict_seconds"]
    },
    {
      key: "duplicate",
      title: "Trùng nội dung",
      desc: "Phát hiện tin/sticker lặp và cách xử lý.",
      toggleKey: "duplicate_message_enabled",
      keys: ["duplicate_message_enabled", "duplicate_message_max_count", "duplicate_message_window_seconds", "duplicate_message_action", "duplicate_message_reason"]
    },
    {
      key: "media",
      title: "Spam media",
      desc: "Số lượng media spam và cách xử lý.",
      toggleKey: "media_spam_action",
      keys: ["media_spam_max_messages", "media_spam_window_seconds", "media_spam_action", "violation_delete_retry_seconds"]
    },
    {
      key: "ban",
      title: "Cảnh báo & ban",
      desc: "Ngưỡng cảnh báo, thời gian ban và thời hạn xử lý.",
      toggleKey: "ban_after_warnings",
      keys: ["ban_after_warnings", "ban_seconds"]
    }
  ], []);
  const forwardContentBlock = useMemo(() => ({
    key: "forward-content",
    title: "Cho phép forward & lọc loại nội dung",
    desc: "Bật forward có kiểm soát, chỉ cho phép các loại nội dung bạn tin cậy và vẫn scan nội dung đi kèm.",
    toggleKey: "allow_forward_messages",
    keys: [
      "allow_forward_messages",
      "forward_allowed_sources",
      "forward_allowed_content_types",
      "forward_action",
      "forward_warning_reason",
      "forward_warning_text",
      "forward_warning_delete_seconds",
      "inline_keyboard_action"
    ]
  }), []);
  const forwardViolationBlock = useMemo(() => ({
    key: "forward-violation",
    title: "Ngưỡng vi phạm forward",
    desc: "Siết theo số lần forward quá nhanh và số lần vi phạm để restrict hoặc ban.",
    toggleKey: "allow_forward_messages",
    keys: [
      "forward_spam_max_messages",
      "forward_spam_window_seconds",
      "forward_violation_restrict_after",
      "forward_violation_ban_after",
      "spam_restrict_text",
      "warning_text",
      "warning_notice_delete_seconds",
      "spam_notice_delete_seconds"
    ]
  }), []);
  const forwardMode = useMemo<"block" | "controlled" | "allow">(() => {
    const moderationRow = moduleRows.find((row) => String(row.module_key || "").toLowerCase() === "moderation");
    const settings = readSettingsObject(moderationRow?.settings);
    if (String(settings.delete_forwarded_messages).toLowerCase() === "true") {
      return "block";
    }
    if (String(settings.allow_forward_messages).toLowerCase() === "true") {
      return "controlled";
    }
    return "allow";
  }, [moduleRows]);
  const templateConfigBlocks = useMemo(() => [
    {
      key: "general",
      title: "Mẫu cảnh báo & mute",
      desc: "Tin bot gửi khi user vi phạm spam hoặc forward.",
      keys: ["warning_text", "warning_notice_delete_seconds", "forward_warning_reason", "forward_warning_text", "forward_warning_delete_seconds", "spam_restrict_text", "spam_notice_delete_seconds"]
    },
    {
      key: "bio",
      title: "Mẫu cảnh báo bio/link",
      desc: "Tin bot gửi khi phát hiện bio hoặc link không an toàn.",
      keys: ["bio_link_warning_text", "bio_link_notice_delete_seconds"]
    }
  ], []);
  const bioLinkConfigBlocks = useMemo(() => [
    {
      key: "bio",
      title: "Quét bio",
      desc: "Quét link trong bio và xử lý theo rule.",
      toggleKey: "scan_bio_links",
      keys: ["scan_bio_links", "bio_link_delete_message", "bio_link_restrict_seconds", "bio_scan_cache_seconds"]
    },
    {
      key: "link",
      title: "Link ẩn & mention",
      desc: "Quét link ẩn, text link, text mention và @user.",
      toggleKey: "scan_hidden_links",
      keys: ["scan_hidden_links", "scan_text_link", "scan_text_mention", "allow_in_group_mentions", "hidden_link_action", "text_link_action", "text_mention_action", "hidden_link_reason", "hidden_link_delete_notice_seconds"]
    },
    {
      key: "notice",
      title: "Mẫu cảnh báo bio/link",
      desc: "Tin bot gửi và thời gian tự xóa khi phát hiện bio/link.",
      keys: ["bio_link_warning_text", "bio_link_notice_delete_seconds"]
    }
  ], []);
  const otherConfigBlocks = useMemo(() => [
    {
      key: "menu",
      title: "Nội quy & menu",
      desc: "Nội dung /start, /help, nút Quy định và menu lệnh.",
      keys: ["policy_text", "show_policy_button", "policy_button_text", "bot_menu_commands", "help_menu_commands", "start_fallback_text", "help_menu_title"]
    },
    {
      key: "captcha",
      title: "Captcha & verify",
      desc: "Tin nhắn xác minh thành viên mới.",
      keys: ["captcha_text", "captcha_success_text", "captcha_failed_text", "captcha_message_delete_seconds", "verify_success_delete_seconds"]
    },
    {
      key: "send",
      title: "Gửi tin tự động",
      desc: "Tin khi bot khởi động hoặc khi nhóm im lặng.",
      keys: ["send_on_boot", "send_if_silent"]
    },
    {
      key: "scam",
      title: "Scam & báo cáo",
      desc: "Channel duyệt scam và mẫu phản hồi tra cứu.",
    keys: ["scam_review_channel_id", "scam_review_group_id", "admin_only_text", "check_usage_text", "check_not_found_text", "check_result_title", "report_usage_text", "report_received_text", "addscam_usage_text", "addscam_success_text", "scam_review_channel_text", "scam_report_pending_text", "scam_report_confirmed_text", "scam_check_safe_text", "scam_check_found_text"]
    }
  ], []);
  const metricGroups = useMemo(() => {
    const groups: Record<string, Row[]> = {};
    for (const row of dashboardRows) {
      const period = String(row.period || "today");
      groups[period] = groups[period] || [];
      groups[period].push(row);
    }
    return Object.entries(groups);
  }, [dashboardRows]);
  const activeModuleHub = useMemo(() => MODULE_HUBS.find((module) => module.key === activeModule) || MODULE_HUBS[0], [activeModule]);
  const moduleState = useMemo(() => {
    const map = new Map<string, Row>();
    for (const row of moduleRows) {
      map.set(String(row.module_key || ""), row);
    }
    return map;
  }, [moduleRows]);
  const moduleCards = useMemo(() => MODULE_HUBS.map((module) => {
    const keys = module.moduleKeys || [module.key];
    const states = keys.map((key) => moduleState.get(key)).filter(Boolean);
    const isOn = module.key === "analytics" ? true : states.length
      ? states.some((row) => row?.enabled !== false)
      : !MODULES_REQUIRE_EXPLICIT_ENABLE.has(module.key);
    return { ...module, isOn };
  }), [moduleState]);
  const enabledModuleCards = useMemo(() => moduleCards.filter((module) => module.isOn), [moduleCards]);
  const disabledModuleCards = useMemo(() => moduleCards.filter((module) => !module.isOn), [moduleCards]);
  const moduleEnabled = useMemo(() => {
    const keys = activeModuleHub.moduleKeys || [activeModuleHub.key];
    const states = keys.map((key) => moduleState.get(key)).filter(Boolean);
    if (!states.length) {
      return !MODULES_REQUIRE_EXPLICIT_ENABLE.has(activeModuleHub.key);
    }
    return states.some((row) => row?.enabled !== false);
  }, [activeModuleHub, moduleState]);
  const moduleLayers = useMemo(() => enabledModuleCards.map((module) => ({
    key: `module:${module.key}`,
    title: module.title,
    shortTitle: module.title,
    desc: module.desc,
    icon: module.icon,
    tone: module.tone,
    tables: module.tables,
    moduleKey: module.key,
    landingKey: module.configKeys?.length ? "config" : module.tables[0]
  })), [enabledModuleCards]);
  const allModuleLayers = useMemo(() => moduleCards.map((module) => ({
    key: `module:${module.key}`,
    title: module.title,
    shortTitle: module.title,
    desc: module.desc,
    icon: module.icon,
    tone: module.tone,
    tables: module.tables,
    moduleKey: module.key,
    landingKey: module.configKeys?.length ? "config" : module.tables[0],
    isOn: module.isOn
  })), [moduleCards]);
  const sidebarLayers = useMemo(() => [...CORE_LAYERS, ...moduleLayers], [moduleLayers]);
  const advancedLayer = useMemo(() => SYSTEM_LAYERS.find((layer) => layer.key === "advanced"), []);
  const sidebarNavLayers = useMemo(() => {
    const core = CORE_LAYERS.filter((layer) => layer.navSection !== "Nâng cao");
    const advanced = advancedLayer ? [advancedLayer] : [];
    return [...core, ...advanced, ...allModuleLayers];
  }, [advancedLayer, allModuleLayers]);
  const activeLayerHub = useMemo(
    () => sidebarLayers.find((layer) => layer.key === activeLayer) || allModuleLayers.find((layer) => layer.key === activeLayer) || (activeLayer === "advanced" ? advancedLayer : null) || CORE_LAYERS[0],
    [activeLayer, advancedLayer, allModuleLayers, sidebarLayers]
  );
  const activeLayerTone = String(activeLayerHub?.tone || "main") as keyof typeof moduleAccents;
  const activeAccent = moduleAccents[activeLayerTone] || moduleAccents.main;
  const sidebarWidth = sidebarCollapsed ? drawerCollapsedWidth : drawerWidth;
  const ActiveLayerIcon = activeLayerHub.icon;
  const layerTables = useMemo(() => activeLayerHub.tables
    .map((key) => meta?.tables.find((tableItem) => tableItem.key === key))
    .filter((item): item is TableConfig => Boolean(item)), [activeLayerHub, meta?.tables]);
  const activeTaskDefinition = useMemo(() => ADMIN_TASKS.find((task) => (
    task.targetLayer === activeLayer && (task.targetTable === activeKey || activeLayer.startsWith("module:"))
  )), [activeKey, activeLayer]);
  const healthSummary = useMemo(() => {
    const activeBots = lookups.bots.filter((bot) => bot.enabled !== false && bot.status !== "paused").length;
    const disabledBots = lookups.bots.filter((bot) => bot.enabled === false || bot.status === "paused").length;
    const scopedGroups = lookups.groups.filter((group) => !selectedBot || !group.bot_key || group.bot_key === selectedBot);
    const offModules = moduleRows.filter((row) => row.enabled === false).length;
    const groupsMissingMessagePool = scopedGroups.filter((group) => group.daily_enabled !== false && group.message_pool && !messagePoolCounts.has(String(group.message_pool))).length;
    const groupsMissingVideoPool = scopedGroups.filter((group) => group.video_enabled === true && group.video_pool && !videoPoolCounts.has(String(group.video_pool))).length;
    const envMissing = [
      meta?.envStatus && !meta.envStatus.supabaseUrl,
      meta?.envStatus && !meta.envStatus.serviceRoleKey,
      meta?.envStatus && !meta.envStatus.cpPassword
    ].filter(Boolean).length;
    const missingSetup = [
      scopedGroups.length === 0,
      moduleRows.length === 0,
      groupsMissingMessagePool > 0,
      groupsMissingVideoPool > 0,
      envMissing > 0
    ].filter(Boolean).length;
    return {
      activeBots,
      disabledBots,
      groups: scopedGroups.length,
      enabledModules: moduleRows.filter((row) => row.enabled !== false).length,
      offModules,
      pendingScamReports,
      pendingChannelPosts: lookups.channelPosts.filter((row) => !selectedBot || !row.bot_key || row.bot_key === selectedBot).filter((row) => ["pending", "queued", "scheduled"].includes(String(row.status || "").toLowerCase())).length,
      failedChannelPosts: lookups.channelPosts.filter((row) => !selectedBot || !row.bot_key || row.bot_key === selectedBot).filter((row) => ["failed", "delete_failed"].includes(String(row.status || "").toLowerCase())).length,
      groupsMissingMessagePool,
      groupsMissingVideoPool,
      envMissing,
      missingSetup,
      deleteFailures: deleteFailureAlert.recentCount,
      issues: disabledBots + missingSetup + pendingScamReports + (deleteFailureAlert.recentCount > 0 ? 1 : 0)
    };
  }, [deleteFailureAlert.recentCount, lookups.bots, lookups.channelPosts, lookups.groups, messagePoolCounts, meta?.envStatus, moduleRows, pendingScamReports, selectedBot, videoPoolCounts]);
  const commandInsights = useMemo(() => buildCommandInsights({
    disabledBots: healthSummary.disabledBots,
    groups: healthSummary.groups,
    missingSetup: healthSummary.missingSetup,
    pendingScamReports: healthSummary.pendingScamReports,
    deleteFailures: healthSummary.deleteFailures
  }), [healthSummary]);
  const setupChecklist = useMemo(() => ([
    { label: "Bot online", detail: "Bot đã kết nối.", done: healthSummary.activeBots > 0 },
    { label: "Scope", detail: "Có phạm vi đang chọn.", done: Boolean(selectedScopeRow || selectedBot) },
    { label: "Module", detail: "Có module đang bật.", done: healthSummary.enabledModules > 0 }
  ]), [healthSummary.activeBots, healthSummary.enabledModules, selectedBot, selectedScopeRow]);
  const setupIssues = useMemo(() => ([
    ...(healthSummary.activeBots > 0 ? [] : ["Chưa có bot online"]),
    ...(selectedScopeRow || selectedBot ? [] : ["Chưa chọn scope"]),
    ...(healthSummary.enabledModules > 0 ? [] : ["Chưa có module bật"])
  ]), [healthSummary.activeBots, healthSummary.enabledModules, selectedBot, selectedScopeRow]);
  const liveActivity = useMemo(() => buildLiveActivity({
    enabledModules: healthSummary.enabledModules,
    groups: healthSummary.groups,
    visibleCount: visibleRows.length,
    issues: healthSummary.issues,
    pendingScamReports: healthSummary.pendingScamReports,
    deleteFailures: healthSummary.deleteFailures,
    offModules: healthSummary.offModules
  }), [healthSummary, visibleRows.length]);
  const todayAuditLogs = useMemo(() => {
    const botLogs = lookups.auditLogs.filter((row) => !selectedBot || !row.bot_key || row.bot_key === selectedBot);
    const today = vietnamDayKey(new Date());
    return botLogs
      .filter((row) => vietnamDayKey(row.created_at || row.updated_at) === today)
      .sort((left, right) => Date.parse(String(right.created_at || right.updated_at || 0)) - Date.parse(String(left.created_at || left.updated_at || 0)))
      .slice(0, 6);
  }, [lookups.auditLogs, selectedBot]);
  const todayAuditSummary = useMemo(() => {
    const total = todayAuditLogs.length;
    const critical = todayAuditLogs.filter((row) => auditLogSeverity(row) === "critical").length;
    const warning = todayAuditLogs.filter((row) => auditLogSeverity(row) === "warning").length;
    const info = todayAuditLogs.filter((row) => auditLogSeverity(row) === "info").length;
    return { total, critical, warning, info };
  }, [todayAuditLogs]);
  const todayAuditGroups = useMemo(() => {
    const groups: Record<"critical" | "warning" | "info", Row[]> = { critical: [], warning: [], info: [] };
    for (const row of todayAuditLogs) {
      const severity = auditLogSeverity(row);
      if (severity === "critical" || severity === "warning") {
        groups[severity].push(row);
      } else {
        groups.info.push(row);
      }
    }
    return groups;
  }, [todayAuditLogs]);
  const quickFilters = useMemo(() => {
    if (table?.key === "audit_logs") {
      const actions = Array.from(new Set(rows.map((row) => String(row.action || "").toLowerCase()).filter(Boolean))).slice(0, 6);
      return [
        { key: "", label: "Tất cả" },
        ...actions.map((action) => ({ key: action, label: actionBadge({ action }, table) }))
      ];
    }
    const base = [
      { key: "", label: "Tất cả" },
      { key: "active", label: "Chạy" },
      { key: "disabled", label: "Tắt" }
    ];
    const values = Array.from(new Set(rows.flatMap((row) => [row.action, row.match, row.status]).map((value) => String(value || "").toLowerCase()).filter(Boolean))).slice(0, 5);
    return [...base, ...values.map((value) => ({ key: value, label: value.toUpperCase() }))];
  }, [rows, table]);
  const commandItems = useMemo(() => [
    { title: "Mở kiểm duyệt", hint: "Luật chung", action: () => goToInsight({ targetLayer: "module:moderation", targetTable: "config" }) },
    { title: "Kiểm tra quyền bot", hint: "Bot và group", action: () => goToInsight({ targetLayer: "group", targetTable: "groups" }) },
    { title: "Mở preset scam", hint: "Từ khóa và domain", action: () => goToInsight({ targetLayer: "module:moderation", targetTable: "keywords" }) },
    { title: "Mở logs", hint: "Nhật ký gần nhất", action: () => goToInsight({ targetLayer: "logs", targetTable: "audit_logs" }) },
    { title: "Tạo lịch gửi", hint: "Flow hẹn giờ", action: () => startScheduledMessageFlow() },
    { title: "Mở verify", hint: "Captcha", action: () => goToInsight({ targetLayer: "module:verification", targetTable: "verification_settings" }) },
    { title: "Tạo mới", hint: `${table?.label || "màn hiện tại"}`, action: () => startCreate() }
  ], [table?.label]);
  const operationTasks = useMemo(() => buildOperationTasks({
    adminTasks: ADMIN_TASKS as unknown as any[],
    setupIssues: 0,
    groups: healthSummary.groups,
    messagePoolCount: messagePools.length,
    videoPoolCount: videoPools.length,
    pendingScamReports: scamInboxStats.pending,
    startScheduledMessageFlow,
    goToInsight: (task) => goToInsight(task),
    setQuickFilter
  }), [healthSummary.groups, messagePools.length, scamInboxStats.pending, videoPools.length]);
  const filteredCommandItems = useMemo(() => {
    const query = commandSearch.trim().toLowerCase();
    if (!query) {
      return commandItems;
    }
    return commandItems.filter((item) => `${item.title} ${item.hint}`.toLowerCase().includes(query));
  }, [commandItems, commandSearch]);

  async function api(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    if (savedPassword) {
      headers.set("x-cp-password", savedPassword);
    }
    const response = await fetch(path, { ...init, headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        window.localStorage.removeItem("cu_bot_cp_password");
        setSavedPassword("");
      }
      throw new Error(payload.error || "Yêu cầu thất bại.");
    }
    return payload;
  }

  function flashToast(message: string, type: ToastState["type"] = "success") {
    setToast({ message, type });
  }

  async function loadLookups() {
    try {
      const scopedBotQuery = selectedBot ? `?bot_key=${encodeURIComponent(selectedBot)}` : "";
      const scopedGroupQuery = selectedScope ? `${scopedBotQuery ? "&" : "?"}group_id=${encodeURIComponent(selectedScope)}` : "";
      const auditQuery = selectedScope ? `?group_id=${encodeURIComponent(selectedScope)}` : "";
      const [botsPayload, groupsPayload, messagesPayload, videosPayload, modulePayload, scamReportsPayload, scamBroadcastsPayload, auditPayload, channelPostsPayload, giveawayEntriesPayload, shareUnlockCampaignsPayload, shareUnlockInvitesPayload, shareUnlockReferralsPayload] = await Promise.all([
        api("/api/bots"),
        api(`/api/groups${scopedBotQuery}`),
        api(`/api/messages${scopedBotQuery}`),
        api(`/api/video_messages${scopedBotQuery}`),
        api(`/api/module_settings${scopedBotQuery}`),
        api(`/api/scam_reports${scopedBotQuery}`),
        api(`/api/scam_broadcasts${scopedBotQuery}`),
        api(`/api/audit_logs${auditQuery}`),
        api(`/api/channel_posts${scopedBotQuery}`),
        api(`/api/giveaway_entries${scopedBotQuery}`),
        api(`/api/share_unlock_campaigns${scopedBotQuery}`),
        api(`/api/share_unlock_invites${scopedBotQuery}`),
        api(`/api/share_unlock_referrals${scopedBotQuery}`)
      ]);
      const deleteFailedRows = (auditPayload.rows || [])
        .filter((row: Row) => ["delete_message_failed", "delete_message"].includes(String(row.action || "").toLowerCase()))
        .slice(0, 300);
      const cutoff = Date.now() - 12 * 60 * 60 * 1000;
      const recentDeleteFailures = deleteFailedRows.filter((row: Row) => {
        const createdAt = Date.parse(String(row.created_at || ""));
        return Number.isFinite(createdAt) && createdAt >= cutoff;
      });
      const latestRow = deleteFailedRows[0];
      const latestDetails = parseDetails(latestRow?.details);
      const latestReason = String(latestDetails.error || latestDetails.reason || "");
      setDeleteFailureAlert({
        recentCount: recentDeleteFailures.length,
        latestAt: String(latestRow?.created_at || ""),
        latestReason
      });
      setLookups({
        bots: botsPayload.rows || [],
        groups: groupsPayload.rows || [],
        messages: messagesPayload.rows || [],
        videos: videosPayload.rows || [],
        moduleSettings: modulePayload.rows || [],
        scamReports: scamReportsPayload.rows || [],
        scamBroadcasts: scamBroadcastsPayload.rows || [],
        auditLogs: auditPayload.rows || [],
        channelPosts: channelPostsPayload.rows || [],
        giveawayEntries: giveawayEntriesPayload.rows || [],
        shareUnlockCampaigns: shareUnlockCampaignsPayload.rows || [],
        shareUnlockInvites: shareUnlockInvitesPayload.rows || [],
        shareUnlockReferrals: shareUnlockReferralsPayload.rows || []
      });
    } catch {
      setDeleteFailureAlert({ recentCount: 0, latestAt: "", latestReason: "" });
      setLookups({ bots: [], groups: [], messages: [], videos: [], moduleSettings: [], scamReports: [], scamBroadcasts: [], auditLogs: [], channelPosts: [], giveawayEntries: [], shareUnlockCampaigns: [], shareUnlockInvites: [], shareUnlockReferrals: [] });
    }
  }

  async function loadAnalyticsSummary() {
    setAnalyticsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBot) params.set("bot_key", selectedBot);
      if (selectedScope) params.set("group_id", selectedScope);
      const query = params.toString() ? `?${params.toString()}` : "";
      const payload = await api(`/api/analytics/summary${query}`);
      setAnalyticsSummary(payload);
    } catch {
      setAnalyticsSummary(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function loadMemberOverview(nextSearch = search) {
    setMemberOverviewLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("tab", "all");
      if (systemBlacklistActive) {
        params.set("bot_key", "*");
        params.set("page_size", String(memberPageSize));
      } else if (selectedBot) params.set("bot_key", selectedBot);
      if (!systemBlacklistActive && effectiveMemberChatId) params.set("group_id", effectiveMemberChatId);
      if (nextSearch.trim()) params.set("search", nextSearch.trim());
      if (memberFilters.status) params.set("status", memberFilters.status);
      if (memberFilters.source) params.set("source", memberFilters.source);
      if (memberFilters.reason) params.set("reason", memberFilters.reason);
      params.set("sort_by", memberFilters.sortBy);
      params.set("sort_dir", memberFilters.sortDir);
      params.set("page", String(memberPage));
      params.set("page_size", String(memberPageSize));
      const query = params.toString() ? `?${params.toString()}` : "";
      const payload = await api(`/api/members/overview${query}`);
      setMemberOverview(payload);
    } catch {
      setMemberOverview(null);
    } finally {
      setMemberOverviewLoading(false);
    }
  }

  async function loadRows(nextSearch = search) {
    if (!table) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const query = buildScopedQuery(table, nextSearch, selectedBot, selectedScope);
      const payload = await api(`/api/${table.key}${query}`);
      setRows(payload.rows || []);
      setSelected(null);
      setDraft({});
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }

  function openMemberAction(row: Row = {}, action: MemberActionType = "mute") {
    setMemberActionFeedback(null);
    setMemberActionDraft({
      user_id: memberUserId(row),
      username: String(row.username || row.target_username || "").replace(/^@/, ""),
      display_name: memberDisplayName(row),
      action,
      reason: "",
      duration_seconds: action === "mute" ? 3600 : 0,
    });
    setMemberActionOpen(true);
  }

  async function runMemberAction(row: Row, action: MemberActionType) {
    if (!effectiveMemberChatId) {
      const message = "Chọn group trước khi thao tác thành viên.";
      setMemberActionFeedback({ type: "error", message });
      setToast({ type: "error", message });
      return;
    }
    const userId = memberUserId(row).trim();
    if (!userId) {
      const message = "Thiếu Telegram user_id.";
      setMemberActionFeedback({ type: "error", message });
      setToast({ type: "error", message });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        bot_key: effectiveMemberBotKey,
        chat_id: effectiveMemberChatId,
        user_id: userId,
        username: memberUsername(row).replace(/^@/, "").trim(),
        display_name: memberDisplayName(row).trim(),
        action,
        reason: memberReasonOf(row) || "Admin CP member action",
        duration_seconds: action === "mute" ? 3600 : 0,
      };
      const result = await api("/api/members/action", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMemberActionTrace({
        at: new Date().toISOString(),
        action,
        request: payload,
        response: {
          ok: Boolean(result?.ok),
          action: result?.action,
          telegramError: result?.telegramError || "",
          stateDeleted: result?.stateDeleted ?? 0,
          debug: result?.debug || null,
        },
        ok: Boolean(result?.ok) && !String(result?.telegramError || "").trim(),
        scopeSummary: buildMemberScopeSummary(result?.debug),
      });
      const telegramError = String(result?.telegramError || "").trim();
      const stateDeleted = Number(result?.stateDeleted || 0);
      const resultRows = Array.isArray(result?.rows) ? result.rows : [];
      const systemRow = resultRows.find((item: Row) => String(item.bot_key || "") === "*" && String(item.chat_id || "") === "*");
      const appliedRow = systemBlacklistActive ? (systemRow || result?.row) : result?.row;
      applyMemberActionResult(appliedRow, action);
      setSearch("");
      const successMessage = action === "unban"
        ? (stateDeleted > 0
          ? `Gỡ ban thành công trên Telegram và đã xóa ${stateDeleted} trạng thái ban.`
          : "Telegram unban OK nhưng không tìm thấy state ban tương ứng trong database.")
        : `${memberActionLabel[action]} đã ghi nhận.`;
      const hasSoftWarning = action === "unban" && !telegramError && stateDeleted === 0;
      const message = telegramError || successMessage;
      setMemberActionFeedback({ type: telegramError ? "error" : "success", message });
      setToast({ type: telegramError ? "error" : hasSoftWarning ? "info" : "success", message });
      await Promise.all([loadMemberOverview(""), loadLookups()]);
      return result;
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "Không thể thao tác thành viên.";
      const message = rawMessage.includes("Gỡ ban thất bại") ? rawMessage : `Không thể thao tác thành viên. ${rawMessage}`;
      setMemberActionFeedback({ type: "error", message });
      setToast({ type: "error", message });
      throw err;
    } finally {
      setSaving(false);
    }
  }

  function applyMemberActionResult(row: Row | null | undefined, action: MemberActionType) {
    if (!row) return;
    setMemberOverview((current) => {
      const base: MemberOverview = current || { summary: {}, members: [], active: [], muted: [], banned: [], blacklisted: [], logs: [] };
      const removeUser = (rows: Row[] = []) => rows.filter((item) => String(item.user_id || item.target_user_id || "") !== String(row.user_id || row.target_user_id || ""));
      const upsertUser = (rows: Row[] = [], nextRow: Row) => {
        const kept = removeUser(rows);
        return [nextRow, ...kept];
      };
      const normalRow = { ...row, status: "normal", member_status: "normal" };
      const bannedRow = { ...row, status: "banned", member_status: "banned" };
      const mutedRow = { ...row, status: "muted", member_status: "muted" };
      const blacklistedRow = { ...row, status: "blacklisted", member_status: "blacklisted" };
      const next: MemberOverview = {
        ...base,
        active: removeUser(base.active),
        muted: removeUser(base.muted),
        banned: removeUser(base.banned),
        blacklisted: removeUser(base.blacklisted),
        members: removeUser(base.members),
      };
      if (action === "blacklist") {
        next.blacklisted = [blacklistedRow, ...(next.blacklisted || [])];
        next.members = upsertUser(next.members, blacklistedRow);
      } else if (action === "ban") {
        next.banned = [bannedRow, ...(next.banned || [])];
        next.members = upsertUser(next.members, bannedRow);
      } else if (action === "mute") {
        next.muted = [mutedRow, ...(next.muted || [])];
        next.members = upsertUser(next.members, mutedRow);
      } else if (action === "unban" || action === "unmute" || action === "unblacklist") {
        next.members = upsertUser(next.members, normalRow);
      }
      next.summary = {
        ...(base.summary || {}),
        muted: next.muted?.length || 0,
        banned: next.banned?.length || 0,
        blacklisted: next.blacklisted?.length || 0,
        visibleMembers: next.members?.length || 0,
      };
      return next;
    });
  }

  function buildMemberScopeSummary(debug: unknown) {
    const state = (debug as {
      state?: {
        deleted?: number;
        attempted_scopes?: Array<{ bot_key?: string; chat_id?: string; status?: string }>;
        matched_scopes?: Array<{ bot_key?: string; chat_id?: string; status?: string }>;
      };
    } | null)?.state;
    if (!state) return "";
    const deleted = Number(state.deleted || 0);
    const attempted = (state.attempted_scopes || [])
      .map((scope) => `${scope.bot_key || "*"}:${scope.chat_id || "*"}`)
      .join(", ");
    const matched = (state.matched_scopes || [])
      .map((scope) => `${scope.bot_key || "*"}:${scope.chat_id || "*"}`)
      .join(", ");
    if (deleted > 0) {
      return matched ? `Matched scopes: ${matched}` : "";
    }
    return attempted ? `Checked scopes (no match): ${attempted}` : "";
  }

  async function submitMemberAction(event?: FormEvent) {
    event?.preventDefault();
    if (!effectiveMemberChatId) {
      setToast({ type: "error", message: "Chọn group trước khi thao tác thành viên." });
      return;
    }
    if (!memberActionDraft.user_id.trim()) {
      setToast({ type: "error", message: "Thiếu Telegram user_id." });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...memberActionDraft,
        bot_key: effectiveMemberBotKey,
        chat_id: effectiveMemberChatId,
        user_id: memberActionDraft.user_id.trim(),
        username: memberActionDraft.username.replace(/^@/, "").trim(),
        display_name: memberActionDraft.display_name.trim(),
        reason: memberActionDraft.reason.trim(),
        duration_seconds: isBlacklistAction ? 0 : Number(memberActionDraft.duration_seconds || 0),
      };
      const result = await api("/api/members/action", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMemberActionTrace({
        at: new Date().toISOString(),
        action: String(memberActionDraft.action || "mute"),
        request: payload,
        response: {
          ok: Boolean(result?.ok),
          action: result?.action,
          telegramError: result?.telegramError || "",
          stateDeleted: result?.stateDeleted ?? 0,
          debug: result?.debug || null,
        },
        ok: Boolean(result?.ok) && !String(result?.telegramError || "").trim(),
        scopeSummary: buildMemberScopeSummary(result?.debug),
      });
      const telegramError = String(result?.telegramError || "").trim();
      const stateDeleted = Number(result?.stateDeleted || 0);
      const feedbackMessage = memberActionDraft.action === "unban"
        ? (stateDeleted > 0
          ? `Gỡ ban thành công trên Telegram và đã xóa ${stateDeleted} trạng thái ban.`
          : "Telegram unban OK nhưng không tìm thấy state ban tương ứng trong database.")
        : `${memberActionLabel[memberActionDraft.action]} đã ghi nhận.`;
      const hasSoftWarning = memberActionDraft.action === "unban" && !telegramError && stateDeleted === 0;
      setMemberActionFeedback({ type: telegramError ? "error" : "success", message: telegramError || feedbackMessage });
      const resultRows = Array.isArray(result?.rows) ? result.rows : [];
      const systemRow = resultRows.find((item: Row) => String(item.bot_key || "") === "*" && String(item.chat_id || "") === "*");
      const appliedRow = systemBlacklistActive ? (systemRow || result?.row) : result?.row;
      setSearch("");
      setMemberPage(1);
      setMemberTab(memberTabForAction[memberActionDraft.action] || "observed");
      applyMemberActionResult(appliedRow, memberActionDraft.action);
      setToast({
        type: telegramError ? "info" : hasSoftWarning ? "info" : "success",
        message: telegramError
          ? `${memberActionLabel[memberActionDraft.action]} đã lưu. Telegram chưa xử lý ngay: ${telegramError}`
          : memberActionDraft.action === "unban"
            ? (stateDeleted > 0
              ? `Gỡ ban thành công trên Telegram và đã xóa ${stateDeleted} trạng thái ban.`
              : "Telegram unban OK nhưng không tìm thấy state ban tương ứng trong database.")
            : `${memberActionLabel[memberActionDraft.action]} đã ghi nhận.`,
      });
      if (appliedRow) {
        setMemberOverview((current) => {
          const base: MemberOverview = current || { summary: {}, members: [], active: [], muted: [], banned: [], blacklisted: [], logs: [] };
          const userId = String(appliedRow.user_id || appliedRow.target_user_id || "").trim();
          const removeByUser = (rows: Row[] = []) => rows.filter((item) => String(item.user_id || item.target_user_id || "").trim() !== userId);
          const nextRow = {
            ...appliedRow,
            status: memberActionDraft.action === "blacklist" ? "blacklisted" : memberActionDraft.action === "unblacklist" ? "normal" : appliedRow.status,
            member_status: memberActionDraft.action === "blacklist" ? "blacklisted" : memberActionDraft.action === "unblacklist" ? "normal" : appliedRow.member_status || appliedRow.status,
          };
          const next: MemberOverview = {
            ...base,
            active: removeByUser(base.active),
            muted: removeByUser(base.muted),
            banned: removeByUser(base.banned),
            blacklisted: removeByUser(base.blacklisted),
            members: removeByUser(base.members),
            logs: base.logs || [],
          };
          if (memberActionDraft.action === "blacklist") {
            next.blacklisted = [nextRow, ...(next.blacklisted || [])];
            next.members = [nextRow, ...(next.members || [])];
          } else if (memberActionDraft.action === "unblacklist") {
            next.members = [nextRow, ...(next.members || [])];
          }
          next.summary = {
            ...(base.summary || {}),
            muted: next.muted?.length || 0,
            banned: next.banned?.length || 0,
            blacklisted: next.blacklisted?.length || 0,
            visibleMembers: next.members?.length || 0,
          };
          return next;
        });
      }
      await Promise.all([loadMemberOverview(""), loadLookups()]);
      applyMemberActionResult(appliedRow, memberActionDraft.action);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể thao tác thành viên.";
      setMemberActionFeedback({ type: "error", message });
      setToast({ type: "error", message });
    } finally {
      setSaving(false);
    }
  }

  function lookupRefreshNeeded(tableKey: string) {
    return ["bots", "groups", "messages", "video_messages", "module_settings", "scam_reports", "scam_broadcasts"].includes(tableKey);
  }

  async function refreshAfterMutation(tableKey: string, options: { reloadRows?: boolean; reloadLookups?: boolean } = {}) {
    const { reloadRows = true, reloadLookups = lookupRefreshNeeded(tableKey) } = options;
    await Promise.all([
      reloadRows ? loadRows(search) : Promise.resolve(),
      reloadLookups ? loadLookups() : Promise.resolve()
    ]);
  }

  useEffect(() => {
    if (table && (!meta?.passwordRequired || savedPassword)) {
      void loadRows("");
      setSearch("");
      setQuickFilter("");
      setQuickTestInput("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, savedPassword, selectedBot, selectedScope, table?.key]);

  useEffect(() => {
    setChannelPage(1);
  }, [channelTab, search, selectedBot]);

  useEffect(() => {
    if (table?.key !== "channel_posts" || (!savedPassword && meta?.passwordRequired)) {
      return;
    }
    let timer: number | undefined;
    const refreshChannelPosts = async () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      try {
        const query = buildScopedQuery(table, search, selectedBot, "");
        const payload = await api(`/api/channel_posts${query}`);
        setRows(payload.rows || []);
      } catch {
        // Keep the last known state; the next poll will retry.
      }
    };
    const startPolling = () => {
      if (timer === undefined) {
        void refreshChannelPosts();
        timer = window.setInterval(refreshChannelPosts, 30000);
      }
    };
    const stopPolling = () => {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        startPolling();
      } else {
        stopPolling();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    startPolling();
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.passwordRequired, savedPassword, search, selectedBot, table?.key]);

  useEffect(() => {
    if (meta && (!meta.passwordRequired || savedPassword)) {
      void loadLookups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.passwordRequired, savedPassword, selectedBot]);

  useEffect(() => {
    if (meta && (!meta.passwordRequired || savedPassword)) {
      void loadAnalyticsSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.passwordRequired, savedPassword, selectedBot, selectedScope]);

  useEffect(() => {
    if (activeLayer === "blacklist") {
      setMemberTab("moderated");
    } else if (activeLayer === "members" && memberTab === "left") {
      setMemberTab("observed");
    }
    if (meta && (!meta.passwordRequired || savedPassword) && (activeLayer === "members" || activeLayer === "blacklist")) {
      void loadMemberOverview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLayer, memberPage, memberFilters.search, memberFilters.status, memberFilters.source, memberFilters.reason, memberFilters.sortBy, memberFilters.sortDir, meta?.passwordRequired, savedPassword, selectedBot, selectedScope, memberTab]);

  useEffect(() => {
    setMemberPage(1);
  }, [memberFilters.search, memberFilters.status, memberFilters.source, memberFilters.reason, memberFilters.sortBy, memberFilters.sortDir, memberTab]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMemberFilters((current) => ({ ...current, search: memberSearchInput.trim() }));
      setMemberPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [memberSearchInput]);

  useEffect(() => {
    if (!lookups.bots.length || activeKey === "bots") {
      return;
    }
    if (!selectedBot || !lookups.bots.some((bot) => bot.bot_key === selectedBot)) {
      setSelectedBot(String(lookups.bots[0].bot_key || "main"));
    }
  }, [activeKey, lookups.bots, selectedBot]);

  useEffect(() => {
    if (selectedBot) {
      setBulkDefaults((current) => ({ ...current, bot_key: selectedBot }));
    }
  }, [selectedBot]);

  useEffect(() => {
    if (activeLayer.startsWith("module:")) {
      const moduleKey = activeLayer.replace("module:", "");
      if (moduleKey && moduleKey !== activeModule) {
        setActiveModule(moduleKey);
      }
      return;
    }
    const moduleKey = MODULE_TABLE_OWNER[activeKey];
    if (moduleKey && moduleKey !== activeModule) {
      setActiveModule(moduleKey);
    }
  }, [activeKey, activeLayer, activeModule]);

  useEffect(() => {
    if (activeLayer !== "modules" || moduleEnabled || !enabledModuleCards.length) {
      return;
    }
    const nextModule = enabledModuleCards[0];
    setActiveModule(nextModule.key);
    if (!nextModule.tables.includes(activeKey)) {
      setActiveKey(nextModule.tables[0]);
    }
  }, [activeKey, activeLayer, enabledModuleCards, moduleEnabled]);

  useEffect(() => {
    if (!activeLayer.startsWith("module:")) {
      return;
    }
    if (!allModuleLayers.some((layer) => layer.key === activeLayer)) {
      setActiveLayer("modules");
      setActiveKey("module_settings");
    }
  }, [activeLayer, allModuleLayers]);

  useEffect(() => {
    if (table?.key !== "config") {
      return;
    }
    if (activeConfigTab && configTabs.some((section) => section.title === activeConfigTab)) {
      return;
    }
    setActiveConfigTab(configTabs[0]?.title || "");
  }, [activeConfigTab, configTabs, table?.key]);
  useEffect(() => {
    const currentLayer = sidebarLayers.find((layer) => layer.key === activeLayer) || allModuleLayers.find((layer) => layer.key === activeLayer);
    if (currentLayer && layerContainsTable(currentLayer, activeKey)) {
      return;
    }
    const matchingLayer = sidebarLayers.find((layer) => layerContainsTable(layer, activeKey));
    if (matchingLayer) {
      setActiveLayer(matchingLayer.key);
      return;
    }
    if (currentLayer?.tables.length) {
      setActiveKey(currentLayer.tables[0]);
    }
  }, [activeKey, activeLayer, allModuleLayers, sidebarLayers]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setDraft({});
        setSelected(null);
        setWorkMode((current) => (current === "edit" ? "operate" : current));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function selectLayer(layerKey: string) {
    const layer = layerKey === "advanced" ? advancedLayer : sidebarLayers.find((item) => item.key === layerKey) || allModuleLayers.find((item) => item.key === layerKey);
    if (!layer) {
      return;
    }
    if (layer.key === "advanced" && !advancedUnlocked) {
      setAdvancedUnlocked(true);
    }
    setActiveLayer(layer.key);
    if ("moduleKey" in layer && layer.moduleKey) {
      setActiveModule(String(layer.moduleKey));
    }
    const landingKey = "landingKey" in layer ? String((layer as { landingKey?: string }).landingKey || "") : "";
    if (landingKey) {
      setActiveKey(landingKey);
    } else if ("moduleKey" in layer && layer.moduleKey) {
      if (!layerContainsTable(layer, activeKey)) {
        setActiveKey(layer.tables[0]);
      }
    } else {
      setActiveKey(layer.tables[0]);
    }
    setSelected(null);
    setDraft({});
    setSelectedIds(new Set());
    setShowTaskData(layer.key === "advanced");
    setWorkMode(layer.key === "overview" ? "overview" : "operate");
  }

  function openModuleConfigure(moduleKey: string, tableKey?: string) {
    const moduleInfo = MODULE_HUBS.find((module) => module.key === moduleKey);
    const nextTable = tableKey || (moduleInfo?.configKeys?.length ? "config" : moduleInfo?.tables[0]) || "module_settings";
    setActiveModule(moduleKey);
    setActiveLayer(`module:${moduleKey}`);
    setActiveKey(nextTable);
    setSelected(null);
    setDraft({});
    setSelectedIds(new Set());
    setShowTaskData(true);
    setWorkMode("operate");
  }

  function goToInsight(insight: { targetLayer: string; targetTable: string }) {
    selectLayer(insight.targetLayer);
    setActiveKey(insight.targetTable);
    setShowTaskData(false);
    setWorkMode("operate");
  }

  function openTaskData(tableKey: string) {
    setActiveKey(tableKey);
    setShowTaskData(true);
    setSelected(null);
    setDraft({});
    setWorkMode("operate");
  }

  function runCommand(action: () => void) {
    action();
    setCommandOpen(false);
    setCommandSearch("");
  }

  function startCreate() {
    if (!table) {
      return;
    }
    if (table.key === "auto_replies") {
      setAutoReplyCreateOpen(true);
      setNotice("Đã mở popup tạo auto reply.");
      return;
    }
    setSelected(null);
    const nextDraft = emptyValues(table);
    const currentBotKey = activeBotKey || selectedBot || "main";
    if (table.key !== "bots" && table.fields.some((field) => field.key === "bot_key")) {
      nextDraft.bot_key = currentBotKey;
    }
    if (selectedScope && table.key !== "groups") {
      if (table.fields.some((field) => field.key === "group_id")) {
        nextDraft.group_id = selectedScope;
      }
      if (table.fields.some((field) => field.key === "chat_id")) {
        nextDraft.chat_id = selectedScope;
      }
    }
    if (table.key === "scam_reports") {
      nextDraft.status = nextDraft.status || "pending";
    }
    if (table.key === "scam_entities") {
      nextDraft.status = nextDraft.status || "confirmed";
      nextDraft.risk_level = nextDraft.risk_level || "scam";
    }
    setDraft(nextDraft);
    setWorkMode("edit");
    setShowAdvancedFields(false);
    setActiveGroupTab(table.key === "groups" ? "Nhóm" : "Thông tin");
    setNotice(table.key === "auto_replies" ? "Đã mở form tạo auto reply." : "");
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        const element = document.querySelector('[aria-labelledby="focused-panel-title"]');
        element?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function startScheduledMessageFlow() {
    const groupTable = meta?.tables.find((item) => item.key === "groups");
    if (!groupTable) {
      return;
    }
    const groupRow = selectedScope
      ? lookups.groups.find((group) => String(group.group_id || "") === selectedScope)
      : table?.key === "groups"
        ? visibleRows[0]
        : null;
    setActiveLayer("module:automation");
    setActiveModule("automation");
    setActiveKey("groups");
    setSelected(groupRow || null);
    setSelectedIds(new Set());
    setDraft({
      ...(groupRow ? draftFromRow(groupRow) : emptyValues(groupTable)),
      bot_key: selectedBot || "main",
      group_id: selectedScope || groupRow?.group_id || "",
      daily_enabled: true,
      daily_window_start: groupRow?.daily_window_start || "09:00",
      daily_window_end: groupRow?.daily_window_end || "09:00",
      send_if_silent: groupRow?.send_if_silent ?? true,
      message_pool: groupRow?.message_pool || messagePools[0] || "default",
      video_pool: groupRow?.video_pool || videoPools[0] || "",
      enabled: true
    });
    setBulkOpen(false);
    setWorkMode("edit");
    setShowAdvancedFields(false);
    setActiveGroupTab("Lịch gửi");
    setNotice("Flow random tin hẹn giờ đã mở. Nếu cần đích cụ thể, chọn group/channel ngay trong form rồi lưu.");
  }

  async function saveBulk() {
    if (!table) {
      return;
    }
    const parsed = parseBulkRows(table.key, bulkText, bulkDefaults);
    if (!parsed.length) {
      setError("Không nhận diện được dữ liệu. Kiểm tra lại nội dung vừa paste.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api(`/api/${table.key}`, {
        method: "POST",
        body: JSON.stringify({ rows: parsed })
      });
      setNotice(`Đã thêm ${parsed.length} mục.`);
      flashToast(`Đã thêm ${parsed.length} mục.`);
      setBulkText("");
      setBulkOpen(false);
      await refreshAfterMutation(table.key);
    } catch (err) {
      const message = friendlySaveError(err);
      setError(message);
      flashToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(row: Row) {
    setSelected(row);
    setDraft(draftFromRow(row));
    setWorkMode("edit");
    setShowAdvancedFields(false);
    setActiveGroupTab("Thông tin");
    setNotice("");
  }

  function inspectRow(row: Row) {
    setSelected(row);
    setDraft({});
    setWorkMode("operate");
    setShowAdvancedFields(false);
    setNotice("");
  }

  function closeFocusedPanel() {
    setDraft({});
    setSelected(null);
    setShowAdvancedFields(false);
    setWorkMode(activeLayer === "overview" ? "overview" : "operate");
  }

  async function toggleSelectedRowEnabled() {
    if (!selected || !table || !table.fields.some((field) => field.key === "enabled")) {
      return;
    }
    if (table.key === "groups" && selected.enabled !== false && !window.confirm("Tắt group sẽ khiến bot bỏ qua protection/runtime cho group này. Bạn vẫn muốn tắt?")) {
      return;
    }
    await saveRowValues(selected, { ...selected, enabled: selected.enabled === false });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!table) {
      return;
    }
    if (table.key === "groups") {
      const issues = dangerousGroupChanges(draft);
      if (issues.length && !window.confirm(`Cấu hình này có rủi ro:\n- ${issues.join("\n- ")}\n\nBạn vẫn muốn lưu?`)) {
        return;
      }
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const submitDraft = { ...draft };
      if (table.key === "bots") {
        const botKey = String(submitDraft.bot_key || "").trim();
        if (!botKey) {
          throw new Error("Hãy nhập mã bot trước khi lưu.");
        }
        const duplicateBot = lookups.bots.some((bot) => String(bot.bot_key || "").trim() === botKey && String(bot.id || "") !== String(selected?.id || ""));
        if (duplicateBot) {
          throw new Error(`Mã bot \"${botKey}\" đã tồn tại. Hãy chọn mã khác.`);
        }
      }
      if (table.fields.some((field) => field.key === "bot_key") && !String(submitDraft.bot_key || "").trim()) {
        submitDraft.bot_key = activeBotKey || selectedBot || "main";
      }
      if (table.key === "config" && activeLayer === "module:moderation") {
        const fallbackRow = selected || { key: submitDraft.key || "", value: submitDraft.value ?? "", enabled: true };
        await saveRowValues(fallbackRow, submitDraft);
        setWorkMode("operate");
        return;
      }
      if (selected?.id && !(table.key === "config" && isVirtualConfigRow(selected))) {
        await api(`/api/${table.key}`, {
          method: "PATCH",
          body: JSON.stringify({ id: selected.id, values: submitDraft })
        });
      } else {
        await api(`/api/${table.key}`, {
          method: "POST",
          body: JSON.stringify(submitDraft)
        });
      }
      setNotice("Đã lưu thay đổi.");
      flashToast("Đã lưu thay đổi.");
      setWorkMode(activeLayer === "overview" ? "overview" : "operate");
      await refreshAfterMutation(table.key, { reloadRows: true, reloadLookups: table.key === "bots" || table.key === "groups" });
    } catch (err) {
      const message = friendlySaveError(err);
      setError(message);
      flashToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveRowValues(row: Row, values: Row) {
    if (!table) {
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (table.key === "config" && activeLayer === "module:moderation") {
        const key = String(values.key || row.key || "").trim();
        if (!key) {
          throw new Error("Thiếu key cấu hình moderation.");
        }
        if (key === "emoji_spam_max_count" &&
            (String(values.value ?? "").trim() === "" || !Number.isSafeInteger(Number(values.value)) || Number(values.value) < 0)) {
          throw new Error("Ngưỡng emoji phải là số nguyên từ 0 trở lên.");
        }
        const moderationRow = moduleRows.find((item) => String(item.module_key || "").toLowerCase() === "moderation");
        const nextSettings = {
          ...readSettingsObject(moderationRow?.settings),
          [key]: values.value
        };
        const configUpdates = (values as Record<string, unknown>).__configUpdates as Record<string, unknown> | undefined;
        if (configUpdates) {
          for (const [configKey, configValue] of Object.entries(configUpdates)) {
            if (configKey && configKey !== key) {
              nextSettings[configKey] = configValue;
            }
          }
        }
        if (moderationRow?.id) {
          await api("/api/module_settings", {
            method: "PATCH",
            body: JSON.stringify({
              id: moderationRow.id,
              values: {
                ...moderationRow,
                settings: nextSettings
              }
            })
          });
        } else {
          await api("/api/module_settings", {
            method: "POST",
            body: JSON.stringify({
              bot_key: selectedBot || "main",
              module_key: "moderation",
              module_name: "Kiểm duyệt tự động",
              category: "Kiểm duyệt tự động",
              settings: nextSettings,
              enabled: true
            })
          });
        }
        setNotice("Đã lưu cấu hình module kiểm duyệt.");
        flashToast("Đã lưu cấu hình module kiểm duyệt.");
        await refreshAfterMutation("module_settings", { reloadRows: true, reloadLookups: true });
        return;
      }
      if (table.key === "config" && isVirtualConfigRow(row)) {
        await api(`/api/${table.key}`, {
          method: "POST",
          body: JSON.stringify(values)
        });
      } else {
        await api(`/api/${table.key}`, {
          method: "PATCH",
          body: JSON.stringify({ id: row.id, values })
        });
      }
      setNotice("Đã lưu thay đổi.");
      flashToast("Đã lưu thay đổi.");
      await refreshAfterMutation(table.key);
    } catch (err) {
      const message = friendlySaveError(err);
      setError(message);
      flashToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveTableRowValues(tableKey: string, row: Row, values: Row) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api(`/api/${tableKey}`, {
        method: "PATCH",
        body: JSON.stringify({ id: row.id, values })
      });
      setNotice("Đã lưu thay đổi.");
      await refreshAfterMutation(tableKey, { reloadRows: tableKey === table?.key, reloadLookups: lookupRefreshNeeded(tableKey) });
    } catch (err) {
      const message = friendlySaveError(err);
      setError(message);
      flashToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveModerationSetting(key: string, value: string) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const moderationRow = moduleRows.find((item) => String(item.module_key || "").toLowerCase() === "moderation");
      const nextSettings = {
        ...readSettingsObject(moderationRow?.settings),
        [key]: value
      };
      if (moderationRow?.id) {
        await api("/api/module_settings", {
          method: "PATCH",
          body: JSON.stringify({
            id: moderationRow.id,
            values: {
              ...moderationRow,
              settings: nextSettings
            }
          })
        });
      } else {
        await api("/api/module_settings", {
          method: "POST",
          body: JSON.stringify({
            bot_key: selectedBot || "main",
            module_key: "moderation",
            module_name: "Kiểm duyệt tự động",
            category: "Kiểm duyệt tự động",
            settings: nextSettings,
            enabled: true
          })
        });
      }
      setNotice("Đã lưu cấu hình moderation.");
      flashToast("Đã lưu cấu hình moderation.");
      await refreshAfterMutation("module_settings", { reloadRows: true, reloadLookups: true });
    } catch (err) {
      const message = friendlySaveError(err);
      setError(message);
      flashToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveWelcomeSettings(nextValues: { welcome_text?: string; welcome_delete_seconds?: string | number; welcome_enabled?: string }) {
    setSaving(true);
    setError("");
    setNotice("");
    const previousLookups = lookups;
    const previousWelcomeDraftEnabled = welcomeDraftEnabled;
    try {
      if (!selectedScopeRow?.id && !selectedScope) {
        throw new Error("Hãy chọn group trước khi lưu Welcome.");
      }
      const nextWelcomeEnabled = nextValues.welcome_enabled ?? selectedScopeRow?.welcome_enabled ?? true;
      const groupPayload = {
        bot_key: selectedBot || "main",
        group_id: String(selectedScopeRow?.group_id || selectedScope || ""),
        group_name: String(selectedScopeRow?.group_name || selectedScope || ""),
        welcome_enabled: nextWelcomeEnabled,
        welcome_text: nextValues.welcome_text ?? selectedScopeRow?.welcome_text ?? "",
        welcome_buttons_text: welcomeDraftButtonsText,
        welcome_delete_seconds: nextValues.welcome_delete_seconds ?? selectedScopeRow?.welcome_delete_seconds ?? 30
      };
      if (selectedScopeRow?.id || selectedScope) {
        const targetGroupId = String(selectedScopeRow?.group_id || selectedScope || "");
        setLookups((current) => ({
          ...current,
          groups: current.groups.map((group) => {
            const currentGroupId = String(group.group_id || "");
            if (String(group.id || "") === String(selectedScopeRow?.id || "") || currentGroupId === targetGroupId) {
              return {
                ...group,
                ...groupPayload,
              };
            }
            return group;
          })
        }));
      }
      if (selectedScopeRow?.id) {
        await api("/api/groups", {
          method: "PATCH",
          body: JSON.stringify({
            id: selectedScopeRow.id,
            values: groupPayload
          })
        });
      } else {
        await api("/api/groups", {
          method: "POST",
          body: JSON.stringify(groupPayload)
        });
      }
      setNotice("Đã lưu cấu hình Welcome theo group.");
      flashToast("Đã lưu cấu hình Welcome theo group.");
      await refreshAfterMutation("groups", { reloadRows: table?.key === "groups", reloadLookups: true });
    } catch (err) {
      setLookups(previousLookups);
      setWelcomeDraftEnabled(previousWelcomeDraftEnabled);
      const message = friendlySaveError(err);
      setError(message);
      flashToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function testWelcomeRuntime() {
    if (!selectedScopeRow) {
      flashToast("Hãy chọn group trước khi test Welcome.", "error");
      return;
    }
    setWelcomeTesting(true);
    setError("");
    setNotice("");
    try {
      const payload = await api("/api/welcome/test", {
        method: "POST",
        body: JSON.stringify({
          bot_key: selectedBot || "main",
          chat_id: selectedScopeRow.group_id || selectedScope || "",
          group_name: selectedScopeRow.group_name || selectedScope || "",
        }),
      });
      setNotice(String(payload.message || "Đã gửi test Welcome."));
      flashToast(String(payload.message || "Đã gửi test Welcome."));
      await refreshAfterMutation("module_settings", { reloadRows: false, reloadLookups: true });
    } catch (err) {
      const message = friendlySaveError(err);
      setError(message);
      flashToast(message, "error");
      await refreshAfterMutation("module_settings", { reloadRows: false, reloadLookups: true });
    } finally {
      setWelcomeTesting(false);
    }
  }

  async function createGiveawayCampaign(nextValues: {
    chat_id: string;
    title: string;
    prize: string;
    winner_count: number;
    require_keyword: string;
    description: string;
    start_at: string;
    end_at: string;
    join_message: string;
    result_message: string;
    buttons_text: string;
  }) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (!nextValues.chat_id) {
        throw new Error("Hãy chọn group trước khi tạo campaign giveaway.");
      }
      const notes = {
        join_message: nextValues.join_message,
        result_message: nextValues.result_message,
        buttons_text: nextValues.buttons_text,
        group_name: selectedScopeRow?.group_name || ""
      };
      await api("/api/giveaway_campaigns", {
        method: "POST",
        body: JSON.stringify({
          bot_key: selectedBot || "main",
          chat_id: nextValues.chat_id,
          title: nextValues.title,
          prize: nextValues.prize,
          description: nextValues.description,
          status: "open",
          winner_count: nextValues.winner_count,
          require_keyword: nextValues.require_keyword,
          start_at: nextValues.start_at || null,
          end_at: nextValues.end_at || null,
          winners: "",
          enabled: true,
          notes: JSON.stringify(notes)
        })
      });
      setNotice("Đã tạo campaign giveaway.");
      flashToast("Đã tạo campaign giveaway.");
      await refreshAfterMutation("giveaway_campaigns", { reloadRows: true, reloadLookups: true });
      setActiveLayer("module:entertainment");
      setActiveModule("entertainment");
      setActiveKey("giveaway_campaigns");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tạo campaign giveaway.";
      setError(message);
      flashToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  function openGiveawayEntries(campaignId: string) {
    setActiveLayer("module:entertainment");
    setActiveModule("entertainment");
    setActiveKey("giveaway_entries");
    setQuickFilter(campaignId);
  }

  async function drawGiveawayCampaign(campaignId: string) {
    const campaignRow = rows.find((row) => String(row.id) === String(campaignId));
    if (!campaignRow) {
      flashToast("Không tìm thấy campaign.", "error");
      return;
    }
    const entries = lookups.giveawayEntries.filter((row) => String(row.giveaway_id || "") === String(campaignId));
    if (!entries.length) {
      flashToast("Campaign chưa có người tham gia.", "error");
      return;
    }
    const winnerCount = Math.min(Number(campaignRow.winner_count || 1), entries.length);
    const winners = [...entries].sort(() => Math.random() - 0.5).slice(0, winnerCount);
    const winnerText = winners.map((row, index) => `${index + 1}. ${row.display_name || row.username || row.user_id}`).join("\n");
    try {
      await api("/api/giveaway_campaigns", {
        method: "PATCH",
        body: JSON.stringify({
          id: campaignId,
          values: { ...campaignRow, status: "drawn", winners: winnerText }
        })
      });
      flashToast("Đã quay giveaway.");
      await refreshAfterMutation("giveaway_campaigns", { reloadRows: true, reloadLookups: true });
    } catch (err) {
      flashToast(err instanceof Error ? err.message : "Không thể quay giveaway.", "error");
    }
  }

  async function closeGiveawayCampaign(campaignId: string) {
    const campaignRow = rows.find((row) => String(row.id) === String(campaignId));
    if (!campaignRow) {
      flashToast("Không tìm thấy campaign.", "error");
      return;
    }
    try {
      await api("/api/giveaway_campaigns", {
        method: "PATCH",
        body: JSON.stringify({
          id: campaignId,
          values: { ...campaignRow, status: "closed" }
        })
      });
      flashToast("Đã đóng campaign.");
      await refreshAfterMutation("giveaway_campaigns", { reloadRows: true, reloadLookups: true });
    } catch (err) {
      flashToast(err instanceof Error ? err.message : "Không thể đóng campaign.", "error");
    }
  }

  async function createShareUnlockCampaign(nextValues: {
    source_chat_id: string;
    title: string;
    description: string;
    required_invites: number;
    unlock_target_type: string;
    unlock_target_value: string;
    share_message: string;
    unlock_message: string;
    status: string;
    notes: string;
  }) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (!nextValues.source_chat_id) {
        throw new Error("Hay chon group truoc khi tao campaign mo khoa.");
      }
      await api("/api/share_unlock_campaigns", {
        method: "POST",
        body: JSON.stringify({
          bot_key: selectedBot || "main",
          source_chat_id: nextValues.source_chat_id,
          title: nextValues.title,
          description: nextValues.description,
          required_invites: nextValues.required_invites,
          unlock_target_type: nextValues.unlock_target_type,
          unlock_target_value: nextValues.unlock_target_value,
          share_message: nextValues.share_message,
          unlock_message: nextValues.unlock_message,
          status: nextValues.status || "open",
          enabled: true,
          notes: nextValues.notes
        })
      });
      flashToast("Da tao campaign mo khoa.");
      await refreshAfterMutation("share_unlock_campaigns", { reloadRows: true, reloadLookups: true });
      setActiveLayer("module:share_unlock");
      setActiveModule("share_unlock");
      setActiveKey("share_unlock_campaigns");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Khong the tao campaign mo khoa.";
      setError(message);
      flashToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function createAutoReply(nextValues: {
    bot_key: string;
    trigger: string;
    match: string;
    ignore_diacritics: boolean;
    reply: string;
    enabled: boolean;
    notes: string;
  }) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (!nextValues.trigger.trim()) {
        throw new Error("Hãy nhập trigger cho auto reply.");
      }
      const payload = {
        bot_key: nextValues.bot_key || selectedBot || activeBotKey || "main",
        trigger: nextValues.trigger,
        match: nextValues.match || "smart",
        ignore_diacritics: Boolean(nextValues.ignore_diacritics),
        reply: nextValues.reply,
        enabled: Boolean(nextValues.enabled),
        notes: nextValues.notes,
      };
      if (autoReplyEditingId) {
        await api("/api/auto_replies", {
          method: "PATCH",
          body: JSON.stringify({ id: autoReplyEditingId, values: payload })
        });
        setNotice("Đã cập nhật auto reply.");
        flashToast("Đã cập nhật auto reply.");
      } else {
        await api("/api/auto_replies", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        setNotice("Đã tạo auto reply.");
        flashToast("Đã tạo auto reply.");
      }
      await refreshAfterMutation("auto_replies", { reloadRows: true, reloadLookups: true });
      setActiveLayer("module:auto_reply");
      setActiveModule("auto_reply");
      setActiveKey("auto_replies");
      setAutoReplyEditingId(null);
      setAutoReplyDraft({ trigger: "hello", match: "smart", ignore_diacritics: false, reply: "Chào {user}, mình có thể giúp gì cho bạn?", notes: "", enabled: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tạo auto reply.";
      setError(message);
      flashToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAutoReply(row: Row) {
    if (!window.confirm(`Xóa auto reply "${String(row.trigger || "")}"?`)) {
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api(`/api/auto_replies?id=${encodeURIComponent(String(row.id))}`, {
        method: "DELETE"
      });
      setNotice("Đã xóa auto reply.");
      flashToast("Đã xóa auto reply.");
      await refreshAfterMutation("auto_replies", { reloadRows: true, reloadLookups: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể xóa auto reply.";
      setError(message);
      flashToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  function openShareUnlockInvites(campaignId: string) {
    setActiveLayer("module:share_unlock");
    setActiveModule("share_unlock");
    setActiveKey("share_unlock_invites");
    setQuickFilter(campaignId);
  }

  function openShareUnlockReferrals(campaignId: string) {
    setActiveLayer("module:share_unlock");
    setActiveModule("share_unlock");
    setActiveKey("share_unlock_referrals");
    setQuickFilter(campaignId);
  }

  async function toggleShareUnlockCampaignStatus(campaignId: string, nextStatus: "open" | "closed") {
    const campaignRow = lookups.shareUnlockCampaigns.find((row) => String(row.id) === String(campaignId));
    if (!campaignRow) {
      flashToast("Khong tim thay campaign.", "error");
      return;
    }
    try {
      await api("/api/share_unlock_campaigns", {
        method: "PATCH",
        body: JSON.stringify({
          id: campaignId,
          values: {
            ...campaignRow,
            status: nextStatus
          }
        })
      });
      flashToast(nextStatus === "open" ? "Da mo lai campaign." : "Da dong campaign.");
      await refreshAfterMutation("share_unlock_campaigns", { reloadRows: true, reloadLookups: true });
    } catch (err) {
      flashToast(err instanceof Error ? err.message : "Khong the cap nhat campaign.", "error");
    }
  }

  async function toggleModerationHiddenLinks() {
    await saveModerationSetting("scan_hidden_links", moderationHiddenLinksEnabled ? "false" : "true");
  }

  async function toggleModerationScanTextLink() {
    await saveModerationSetting("scan_text_link", moderationScanTextLink ? "false" : "true");
  }

  async function toggleModerationScanTextMention() {
    await saveModerationSetting("scan_text_mention", moderationScanTextMention ? "false" : "true");
  }

  async function toggleModerationAllowInGroupMentions() {
    await saveModerationSetting("allow_in_group_mentions", moderationAllowInGroupMentions ? "false" : "true");
  }

  async function changeModerationHiddenLinkAction(value: string) {
    await saveModerationSetting("hidden_link_action", value);
  }

  async function queueChannelPost(row: Row) {
    if (!row.target_chat_id || !row.content) {
      const message = "Cần nhập Channel/Group nhận bài và Nội dung gửi trước khi gửi.";
      setError(message);
      flashToast(message, "error");
      return;
    }
    await saveTableRowValues("channel_posts", row, {
      status: "pending",
      error: "",
      sent_message_id: "",
      sent_at: ""
    });
    flashToast("Đã đưa bài vào hàng chờ gửi.");
  }

  function openChannelComposer(row?: Row) {
    const source = row || {
      bot_key: selectedBot || "main",
      target_chat_id: selectedScope || "",
      title: "",
      content: "",
      disable_web_page_preview: false,
      scheduled_at: "",
      delete_at: ""
    };
    setChannelComposer({
      ...source,
      scheduled_at: vietnamDateTimeInput(source.scheduled_at),
      delete_at: vietnamDateTimeInput(source.delete_at)
    });
    setChannelButtons(channelButtonsFromText(source.buttons_text));
    setChannelComposerOpen(true);
  }

  function updateChannelButton(index: number, values: Partial<ChannelButtonDraft>) {
    setChannelButtons((current) => current.map((button, buttonIndex) => buttonIndex === index ? { ...button, ...values } : button));
  }

  async function saveChannelPost(mode: "draft" | "send_now" | "schedule") {
    if (!channelComposer.target_chat_id || !String(channelComposer.content || "").trim()) {
      flashToast("Cần chọn channel/group và nhập nội dung bài.", "error");
      return;
    }
    const scheduledAt = vietnamInputToIso(String(channelComposer.scheduled_at || ""));
    const deleteAt = vietnamInputToIso(String(channelComposer.delete_at || ""));
    if (mode === "schedule" && (!scheduledAt || Date.parse(scheduledAt) <= Date.now())) {
      flashToast("Giờ gửi phải nằm trong tương lai, theo giờ Việt Nam.", "error");
      return;
    }
    if (deleteAt && Date.parse(deleteAt) <= Date.now()) {
      flashToast("Giờ tự xóa phải nằm trong tương lai, theo giờ Việt Nam.", "error");
      return;
    }
    if (deleteAt && scheduledAt && Date.parse(deleteAt) <= Date.parse(scheduledAt)) {
      flashToast("Giờ tự xóa phải sau giờ gửi.", "error");
      return;
    }
    setSaving(true);
    try {
      const values = {
        bot_key: channelComposer.bot_key || selectedBot || "main",
        target_chat_id: channelComposer.target_chat_id,
        title: channelComposer.title || "",
        content: channelComposer.content,
        buttons_text: channelButtonsToText(channelButtons),
        parse_mode: "HTML",
        disable_web_page_preview: Boolean(channelComposer.disable_web_page_preview),
        status: mode === "send_now" ? "queued" : mode === "schedule" ? "scheduled" : "draft",
        scheduled_at: mode === "schedule" ? scheduledAt : null,
        delete_at: deleteAt,
        updated_at: new Date().toISOString(),
        created_by: channelComposer.created_by || "admin_cp",
        enabled: true,
        error: "",
        error_code: ""
      };
      if (channelComposer.id) {
        await api("/api/channel_posts", { method: "PATCH", body: JSON.stringify({ id: channelComposer.id, values }) });
      } else {
        await api("/api/channel_posts", { method: "POST", body: JSON.stringify(values) });
      }
      setChannelComposerOpen(false);
      flashToast(mode === "send_now" ? "Đã yêu cầu bot gửi bài ngay." : mode === "schedule" ? "Đã lên lịch gửi theo giờ Việt Nam." : "Đã lưu bản nháp.");
      await refreshAfterMutation("channel_posts", { reloadRows: true, reloadLookups: false });
    } catch (err) {
      flashToast(err instanceof Error ? err.message : "Không thể lưu bài đăng.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function channelPostAction(row: Row, action: string, values: Row = {}) {
    setSaving(true);
    try {
      await api("/api/channel-posts/action", {
        method: "POST",
        body: JSON.stringify({ id: row.id, action, ...values })
      });
      const labels: Record<string, string> = {
        send_now: "Đã yêu cầu gửi ngay.",
        retry: "Đã đưa bài vào hàng chờ thử lại.",
        retry_delete: "Đã yêu cầu bot thử xóa lại.",
        cancel_schedule: "Đã hủy lịch gửi.",
        delete_now: "Đã yêu cầu bot xóa bài.",
        cancel_delete: "Đã hủy lịch xóa."
      };
      flashToast(labels[action] || "Đã cập nhật bài đăng.");
      await refreshAfterMutation("channel_posts", { reloadRows: true, reloadLookups: false });
    } catch (err) {
      flashToast(err instanceof Error ? err.message : "Không thể thực hiện thao tác.", "error");
    } finally {
      setSaving(false);
    }
  }

  function scheduleChannelDelete(row: Row) {
    const suggested = vietnamDateTimeInput(row.delete_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
    const value = window.prompt("Nhập giờ xóa theo giờ Việt Nam (YYYY-MM-DDTHH:mm)", suggested);
    if (!value) return;
    const deleteAt = vietnamInputToIso(value);
    if (!deleteAt || Date.parse(deleteAt) <= Date.now()) {
      flashToast("Giờ xóa phải nằm trong tương lai.", "error");
      return;
    }
    void channelPostAction(row, "schedule_delete", { delete_at: deleteAt });
  }

  async function writeAuditLog(action: string, row: Row, details: Row = {}) {
    try {
      await api("/api/audit_logs", {
        method: "POST",
        body: JSON.stringify({
          bot_key: row.bot_key || selectedBot || "main",
          chat_id: row.chat_id || row.group_id || "",
          actor_user_id: "admin_cp",
          action,
          target_user_id: row.target_uid || row.target_username || row.bank_account || row.phone || "",
          details: JSON.stringify({
            report_id: row.id,
            target: scamReportTarget(row),
            reporter: row.reporter_username || row.reporter_user_id || "",
            ...details
          })
        })
      });
    } catch {
      // Audit log should not block the moderation action.
    }
  }

  async function confirmScamReport(row: Row) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api(`/api/scam_reports/${row.id}/confirm`, {
        method: "POST",
        body: JSON.stringify({
          reviewed_by: "admin_cp",
          reason: row.admin_note || row.reason || "Xác nhận từ báo cáo thành viên",
          scam_percent: Number(row.scam_percent || row.confidence_score || 100),
          confidence_score: Number(row.confidence_score || row.scam_percent || 100)
        })
      });
      await writeAuditLog("scam_report_confirmed", row, { evidence: row.evidence || "" });
      setNotice("Đã xác nhận report và tạo dữ liệu scam.");
      flashToast("Đã xác nhận report và tạo dữ liệu scam.");
      await refreshAfterMutation("scam_reports", { reloadRows: table?.key === "scam_reports", reloadLookups: true });
    } catch (err) {
      const message = friendlySaveError(err);
      setError(message);
      flashToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function rejectScamReport(row: Row) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api(`/api/scam_reports/${row.id}/reject`, {
        method: "POST",
        body: JSON.stringify({
          reviewed_by: "admin_cp",
          admin_note: row.admin_note || ""
        })
      });
      await writeAuditLog("scam_report_rejected", row, { admin_note: row.admin_note || "" });
      setNotice("Đã đánh dấu báo cáo là từ chối.");
      flashToast("Đã đánh dấu báo cáo là từ chối.");
      await refreshAfterMutation("scam_reports", { reloadRows: true, reloadLookups: true });
    } catch (err) {
      const message = friendlySaveError(err);
      setError(message);
      flashToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function duplicateScamReport(row: Row) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api(`/api/scam_reports/${row.id}/duplicate`, {
        method: "POST",
        body: JSON.stringify({
          reviewed_by: "admin_cp",
          duplicate_of: row.duplicate_of || "",
          admin_note: row.admin_note || row.notes || "Đánh dấu trùng từ CP"
        })
      });
      await writeAuditLog("scam_report_duplicate", row, { duplicate_of: row.duplicate_of || "" });
      setNotice("Đã đánh dấu report là trùng.");
      flashToast("Đã đánh dấu report là trùng.");
      await refreshAfterMutation("scam_reports", { reloadRows: true, reloadLookups: true });
    } catch (err) {
      const message = friendlySaveError(err);
      setError(message);
      flashToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function needMoreInfoScamReport(row: Row) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api(`/api/scam_reports/${row.id}/need-more-info`, {
        method: "POST",
        body: JSON.stringify({
          reviewed_by: "admin_cp",
          admin_note: row.admin_note || row.notes || "Cần bổ sung thêm bằng chứng / thông tin"
        })
      });
      await writeAuditLog("scam_report_need_more_info", row, { admin_note: row.admin_note || "" });
      setNotice("Đã chuyển report sang trạng thái cần bổ sung.");
      flashToast("Đã chuyển report sang trạng thái cần bổ sung.");
      await refreshAfterMutation("scam_reports", { reloadRows: true, reloadLookups: true });
    } catch (err) {
      const message = friendlySaveError(err);
      setError(message);
      flashToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  function selectBot(botKey: string) {
    setSelectedBot(botKey);
    setSelectedScope("");
    setSelected(null);
    setDraft({});
    setShowAdvancedFields(false);
    setSelectedIds(new Set());
  }

  async function toggleModule(moduleKey: string) {
    const row = moduleState.get(moduleKey);
    if (!row) {
      const moduleInfo = MODULE_HUBS.find((module) => module.key === moduleKey);
      setSaving(true);
      setError("");
      setNotice("");
      try {
        await api("/api/module_settings", {
          method: "POST",
          body: JSON.stringify({
            bot_key: selectedBot || "main",
            module_key: moduleKey,
            module_name: moduleInfo?.title || moduleKey,
            category: moduleInfo?.title || "Module",
            settings: "{}",
            enabled: true
          })
        });
        setNotice("Đã tạo và bật module.");
        await refreshAfterMutation("module_settings", { reloadRows: false, reloadLookups: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tạo module.");
      } finally {
        setSaving(false);
      }
      return;
    }
    await saveTableRowValues("module_settings", row, {
      ...row,
      enabled: row.enabled === false
    });
  }

  async function toggleConfigValue(row: Row) {
    const nextValue = String(row.value ?? "").trim().toLowerCase() === "true" ? "false" : "true";
    const updates: Record<string, unknown> = { ...row, value: nextValue };
    const configUpdates: Record<string, unknown> = {};
    if (row.key === "allow_forward_messages" && nextValue === "true") {
      configUpdates.delete_forwarded_messages = "false";
    }
    if (row.key === "delete_forwarded_messages" && nextValue === "true") {
      configUpdates.allow_forward_messages = "false";
    }
    if (Object.keys(configUpdates).length) {
      updates.__configUpdates = configUpdates;
    }
    await saveRowValues(row, updates);
  }

  async function setForwardMode(mode: "block" | "controlled" | "allow") {
    const allowRow = moderationConfigRowMap.get("allow_forward_messages");
    if (!allowRow) {
      return;
    }
    const nextAllow = mode === "controlled";
    const nextDelete = mode === "block";
    await saveRowValues(allowRow, {
      ...allowRow,
      value: String(nextAllow),
      __configUpdates: {
        delete_forwarded_messages: String(nextDelete),
      },
    } as Row);
  }

  async function remove(row: Row) {
    if (!table || !window.confirm(`Xóa "${titleFor(row, table)}"?`)) {
      return;
    }
    setError("");
    try {
      await api(`/api/${table.key}?id=${row.id}`, { method: "DELETE" });
      await refreshAfterMutation(table.key);
      setWorkMode(activeLayer === "overview" ? "overview" : "operate");
      setNotice("Đã xóa.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa.");
    }
  }

  async function removeSelected() {
    if (!table || !selectedVisibleRows.length || !window.confirm(`Xóa ${selectedVisibleRows.length} mục đã chọn?`)) {
      return;
    }
    setError("");
    setSaving(true);
    try {
      for (const row of selectedVisibleRows) {
        await api(`/api/${table.key}?id=${row.id}`, { method: "DELETE" });
      }
      setSelectedIds(new Set());
      await refreshAfterMutation(table.key);
      setNotice(`Đã xóa ${selectedVisibleRows.length} mục.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa các mục đã chọn.");
    } finally {
      setSaving(false);
    }
  }

  async function unlock(event: FormEvent) {
    event.preventDefault();
    window.localStorage.setItem("cu_bot_cp_password", password);
    setSavedPassword(password);
  }

  function updateField(field: FieldConfig, value: string | boolean) {
    setDraft((current) => ({
      ...current,
      [field.key]: field.type === "number" ? (value === "" ? "" : Number(value)) : value
    }));
  }

  function updateBulkDefault(key: keyof BulkDefaults, value: string | number | boolean) {
    setBulkDefaults((current) => ({
      ...current,
      [key]: key === "weight" ? Number(value) || 1 : value
    }));
  }

  function goToScheduleContent(tableKey: "messages" | "video_messages") {
    setActiveLayer("module:automation");
    setActiveModule("automation");
    setActiveKey(tableKey);
    setWorkMode("operate");
    setSelected(null);
    setDraft({});
    setShowAdvancedFields(false);
  }

  function startGroupProtectionFlow() {
    setActiveLayer("module:moderation");
    setActiveModule("moderation");
    setActiveKey("config");
    setSelected(null);
    setDraft({});
    setActiveConfigTab("Kiểm duyệt tự động");
    setActiveGroupTab("Thông tin");
    setShowAdvancedFields(false);
    setShowTaskData(true);
    setWorkMode("operate");
    setNotice("Flow module kiểm duyệt đã mở. Luật chung áp dụng cho toàn bộ group.");
  }

  function toggleSelected(id: unknown) {
    const key = String(id);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function toggleAllVisible() {
    setSelectedIds((current) => {
      const visibleIds = visibleRows.map((row) => String(row.id));
      const allSelected = visibleIds.length > 0 && visibleIds.every((id) => current.has(id));
      const next = new Set(current);
      for (const id of visibleIds) {
        if (allSelected) {
          next.delete(id);
        } else {
          next.add(id);
        }
      }
      return next;
    });
  }

  function dataListForField(field: FieldConfig) {
    if (field.key === "bot_key" && table?.key !== "bots") {
      return "bot-options";
    }
    if (field.key === "group_id" || field.key === "chat_id") {
      return "group-options";
    }
    if (field.key === "pool" || field.key === "message_pool") {
      return "message-pool-options";
    }
    if (field.key === "video_pool") {
      return "video-pool-options";
    }
    return undefined;
  }

  function lookupOptionsForField(field: FieldConfig) {
    if (table?.key === "bots" && field.key === "bot_key") {
      return [];
    }
    if (field.key === "bot_key") {
      return lookups.bots.map((bot) => ({ value: String(bot.bot_key || ""), label: String(bot.name || bot.bot_key || "") })).filter((item) => item.value);
    }
    if (table?.key === "groups" && field.key === "group_id") {
      return [];
    }
    if (field.key === "group_id" || field.key === "chat_id") {
      return lookups.groups
        .filter((group) => !selectedBot || !group.bot_key || group.bot_key === selectedBot)
        .map((group) => {
          const value = String(group.group_id || "");
          return { value, label: String(group.group_name || value) };
        })
        .filter((item) => item.value);
    }
    if (field.key === "pool" || field.key === "message_pool") {
      return messagePools.map((pool) => ({ value: pool, label: pool }));
    }
    if (field.key === "video_pool") {
      return videoPools.map((pool) => ({ value: pool, label: pool }));
    }
    return [];
  }

  function commandField(field: FieldConfig) {
    return field.key === "help_menu_commands" || (field.key === "value" && ["bot_menu_commands", "help_menu_commands"].includes(String(draft.key || "")));
  }

  function toggleCommand(field: FieldConfig, command: string) {
    const current = String(draft[field.key] || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const next = current.includes(command) ? current.filter((item) => item !== command) : [...current, command];
    updateField(field, next.join(","));
  }

  const hasFocusedPanel = Boolean(Object.keys(draft).length || selected);
  const moduleWorkbenchActive = activeLayer.startsWith("module:");
  const moduleUsesDedicatedScreenOnly = activeLayer.startsWith("module:") && ["welcome"].includes(activeModuleHub.key);
  const moduleTabsEmbedded = activeLayer.startsWith("module:") && ["automation", "welcome", "moderation"].includes(activeModuleHub.key);
  const setupWorkbench = activeLayer === "bot" || activeLayer === "group";
  const showOverview = workMode === "overview";
  const showOperations = !showOverview;
  const showPrimaryTask = activeLayer !== "modules" && !showOverview && !moduleUsesDedicatedScreenOnly && activeModuleHub.key !== "auto_reply";
  const readOnlyTable = table?.key === "audit_logs";
  const emptyState = emptyStateFor(table?.key || "");
  const scopeCrumbs = useMemo(() => buildScopeCrumbs({
    currentBotName: currentBot?.name || "",
    selectedBot,
    selectedGroupName: selectedScopeRow ? String(selectedScopeRow.group_name || selectedScope) : "",
    selectedGroup: selectedScope,
    activeLayerTitle: activeLayerHub.title,
    tableLabel: table?.label || "",
    tableTaskLabel: table ? TABLE_TASK_LABELS[table.key] || table.label : ""
  }), [activeLayerHub.title, currentBot?.name, selectedBot, selectedScope, selectedScopeRow, table]);
  const groupEditorTabs = useMemo(() => {
    if (table?.key !== "groups") {
      return [];
    }
    return buildGroupEditorTabs({
      table,
      activeLayer,
      showAdvancedFields,
      activeGroupTab,
      groupedFields,
      allowedGroupSectionsForLayer,
      fieldIsAdvanced,
      groupTabLabel,
      sortGroupFieldGroups,
      groupTabOrder: GROUP_TAB_ORDER
    });
  }, [activeGroupTab, activeLayer, showAdvancedFields, table]);
  useEffect(() => {
    if (table?.key !== "groups" || !groupEditorTabs.length) {
      return;
    }
    if (!groupEditorTabs.some((tab) => tab.label === activeGroupTab)) {
      setActiveGroupTab(groupEditorTabs[0].label);
    }
  }, [activeGroupTab, groupEditorTabs, table?.key]);
  const editorFieldGroups = useMemo(() => buildEditorFieldGroups({
    table,
    activeLayer,
    activeGroupTab,
    showAdvancedFields,
    groupedFields,
    allowedGroupSectionsForLayer,
    fieldIsAdvanced,
    groupTabLabel,
    sortGroupFieldGroups
  }), [activeGroupTab, activeLayer, showAdvancedFields, table]);
  const menuConfigRows = useMemo(() => {
    const map = new Map<string, Row>();
    for (const row of scopedConfigRows) {
      map.set(String(row.key || ""), row);
    }
    return map;
  }, [scopedConfigRows]);
  const menuCommandRows = useMemo(
    () => ["bot_menu_commands", "help_menu_commands", "help_menu_title"].map((key) => menuConfigRows.get(key)).filter((row): row is Row => Boolean(row)),
    [menuConfigRows]
  );
  const menuPolicyRows = useMemo(
    () => ["show_policy_button", "policy_button_text", "policy_text"].map((key) => menuConfigRows.get(key)).filter((row): row is Row => Boolean(row)),
    [menuConfigRows]
  );
  const menuContentRows = useMemo(
    () => ["start_fallback_text"].map((key) => menuConfigRows.get(key)).filter((row): row is Row => Boolean(row)),
    [menuConfigRows]
  );
  const menuCommandsEnabled = menuCommandRows.some((row) => row.enabled !== false && String(row.value || "").trim());
  const policyButtonRow = menuConfigRows.get("show_policy_button");
  const policyButtonEnabled = policyButtonRow ? String(policyButtonRow.value || "").trim().toLowerCase() === "true" && policyButtonRow.enabled !== false : false;
  const moderationSettingsMap = useMemo(() => {
    const map = new Map<string, string>();
    if (activeModuleHub.key !== "moderation") return map;
    for (const row of scopedConfigRows) map.set(String(row.key || ""), String(row.value ?? ""));
    return map;
  }, [activeModuleHub.key, scopedConfigRows]);
  const moderationPolicySummary = useMemo(() => buildModerationPolicySummary(moderationSettingsMap), [moderationSettingsMap]);
  const moderationHiddenLinksEnabled = moderationSettingsMap.get("scan_hidden_links") !== "false";
  const moderationScanTextLink = moderationSettingsMap.get("scan_text_link") !== "false";
  const moderationScanTextMention = moderationSettingsMap.get("scan_text_mention") !== "false";
  const moderationAllowInGroupMentions = moderationSettingsMap.get("allow_in_group_mentions") !== "false";
  const moderationHiddenLinkAction = moderationSettingsMap.get("hidden_link_action") || "warn";
  const welcomeModuleRow = useMemo(() => moduleRows.find((row) => String(row.module_key || "").toLowerCase() === "welcome") || null, [moduleRows]);
  const welcomeSettings = useMemo(() => readSettingsObject(welcomeModuleRow?.settings), [welcomeModuleRow?.settings]);
  const welcomeModuleEnabled = welcomeModuleRow ? welcomeModuleRow.enabled !== false : false;
  const welcomeEnabled = welcomeDraftEnabled;
  const welcomeText = String(groupWelcomeContext?.welcome_text || "");
  const welcomeDeleteSeconds = Number(groupWelcomeContext?.welcome_delete_seconds ?? 30) || 30;
  const welcomeButtonsText = String(groupWelcomeContext?.welcome_buttons_text || "");
  const welcomeRuntimeLastEventAt = formatDateTime(welcomeSettings.welcome_runtime_last_event_at);
  const welcomeRuntimeLastSuccessAt = formatDateTime(welcomeSettings.welcome_runtime_last_success_at);
  const welcomeRuntimeLastErrorAt = formatDateTime(welcomeSettings.welcome_runtime_last_error_at);
  const welcomeRuntimeLastErrorMessage = String(welcomeSettings.welcome_runtime_last_error_message || "");
  const welcomeRuntimeLastTestAt = formatDateTime(welcomeSettings.welcome_runtime_last_test_at);
  const welcomeRuntimeLastEventSource = String(welcomeSettings.welcome_runtime_last_event_source || "");
  const welcomeAuditRows = useMemo(
    () =>
      lookups.auditLogs
        .filter((row) => String(row.action || "").startsWith("welcome_"))
        .filter((row) => !selectedBot || !row.bot_key || row.bot_key === selectedBot)
        .filter((row) => !selectedScope || String(row.chat_id || "") === String(selectedScope)),
    [lookups.auditLogs, selectedBot, selectedScope]
  );
  const lastWelcomeDeleteSuccess = useMemo(
    () => welcomeAuditRows.find((row) => String(row.action || "") === "welcome_delete_success") || null,
    [welcomeAuditRows]
  );
  const lastWelcomeDeleteFailure = useMemo(
    () => welcomeAuditRows.find((row) => String(row.action || "") === "welcome_delete_failed") || null,
    [welcomeAuditRows]
  );
  const welcomeDeleteStatus = lastWelcomeDeleteFailure
    ? `Xóa gần nhất lỗi: ${formatDateTime(lastWelcomeDeleteFailure.created_at || lastWelcomeDeleteFailure.updated_at)}`
    : lastWelcomeDeleteSuccess
      ? `Xóa gần nhất OK: ${formatDateTime(lastWelcomeDeleteSuccess.created_at || lastWelcomeDeleteSuccess.updated_at)}`
      : "";
  const welcomeLastSyncedGroupKey = useRef("");
  useEffect(() => {
    if (!welcomeSyncGroupKey || welcomeLastSyncedGroupKey.current === welcomeSyncGroupKey) {
      return;
    }
    welcomeLastSyncedGroupKey.current = welcomeSyncGroupKey;
    setWelcomeDraftEnabled(welcomeGroupEnabled);
    setWelcomeDraftText(welcomeText);
    setWelcomeDraftDeleteSeconds(welcomeDeleteSeconds);
    setWelcomeDraftButtonsText(welcomeButtonsText);
  }, [welcomeButtonsText, welcomeDeleteSeconds, welcomeGroupEnabled, welcomeSyncGroupKey, welcomeText]);
  const autoReplyStats = useMemo(() => {
    const source = table?.key === "auto_replies" ? rows : [];
    return {
      total: source.length,
      enabled: source.filter((row) => row.enabled !== false).length,
      smart: source.filter((row) => String(row.match || "smart") === "smart").length,
      risky: source.filter((row) => String(row.trigger || "").trim().length < 2).length
    };
  }, [rows, table?.key]);
  const scamWorkbenchRows = useMemo(() => buildScamWorkbenchRows({
    tableKey: table?.key,
    visibleRows,
    scamReports: lookups.scamReports,
    selectedBot
  }), [lookups.scamReports, selectedBot, table?.key, visibleRows]);
  const overviewActionCards = [
    { label: "Report scam chờ", value: healthSummary.pendingScamReports, tone: "scam" as const, action: () => goToInsight({ targetLayer: "module:anti_scam", targetTable: "scam_reports" }) },
    { label: "Channel pending", value: healthSummary.pendingChannelPosts, tone: "warning" as const, action: () => goToInsight({ targetLayer: "module:channel_publisher", targetTable: "channel_posts" }) },
    { label: "Channel lỗi", value: healthSummary.failedChannelPosts, tone: "danger" as const, action: () => goToInsight({ targetLayer: "module:channel_publisher", targetTable: "channel_posts" }) },
  ] as Array<{
    label: string;
    value: number;
    tone: "scam" | "warning" | "danger" | "main" | "neutral";
    action: () => void;
  }>;

  if (loading && !meta) {
    return <LoadingScreen label="Đang tải control panel" />;
  }

  if (!meta || !table) {
    return <LoadingScreen label="Đang khởi tạo control panel..." />;
  }

  if (meta.passwordRequired && !savedPassword) {
    return <LoginPanel password={password} setPassword={setPassword} unlock={unlock} />;
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default", color: "text.primary", overflowX: "hidden" }}>
        <Drawer
          variant="permanent"
          sx={{
            width: sidebarWidth,
            flexShrink: 0,
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: sidebarWidth,
              boxSizing: "border-box",
              borderRight: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              p: sidebarCollapsed ? 1.25 : 2,
              transition: "width 180ms ease, padding 180ms ease",
              overflowX: "hidden",
            }
          }}
        >
          <Stack spacing={2} sx={{ minHeight: "100%" }}>
            <Paper variant="outlined" sx={{ p: sidebarCollapsed ? 1.25 : 2, bgcolor: "background.default" }}>
              <Stack spacing={1.25}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0 }}>
                    <Box sx={{ width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: 1, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", flexShrink: 0 }}>
                      <Database size={20} />
                    </Box>
                    {!sidebarCollapsed ? (
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ lineHeight: 1.1, fontWeight: 800 }}>Cu Bot OS</Typography>
                        <Typography variant="caption" color="text.secondary">Ops center</Typography>
                      </Box>
                    ) : null}
                  </Stack>
                  <IconButton onClick={() => setSidebarCollapsed((current) => !current)} title={sidebarCollapsed ? "Mở sidebar" : "Thu sidebar"}>
                    {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>
            <Stack spacing={1.5} component="nav" sx={{ flex: 1 }}>
              {[
                ["Tổng quan", CORE_LAYERS.filter((layer) => layer.navSection === "Tổng quan")],
                ["Vận hành", CORE_LAYERS.filter((layer) => layer.navSection === "Vận hành").filter((layer) => ["bot", "group", "modules", "logs", "analytics", "members", "blacklist"].includes(layer.key))],
                ["Modules", allModuleLayers.filter((layer) => ["moderation", "automation", "welcome", "auto_reply", "anti_scam", "channel_publisher", "share_unlock"].includes(layer.moduleKey || ""))],
                ["Khác", advancedLayer ? [advancedLayer] : []]
              ].map(([title, layers]) => (
                <Stack key={String(title)} spacing={0.75}>
                  {!sidebarCollapsed ? <Typography variant="overline" color="text.secondary">{String(title)}</Typography> : null}
                  {(layers as typeof sidebarNavLayers).map((layer) => {
                    const LayerIcon = layer.icon;
                    const moduleOff = "isOn" in layer && layer.isOn === false;
                    const locked = layer.key === "advanced" && !advancedUnlocked;
                    const active = layer.key === activeLayer;
                    return (
                      <MuiButton
                        key={layer.key}
                        fullWidth
                        variant={active ? "contained" : "text"}
                        color={active ? "primary" : "inherit"}
                        disabled={locked}
                        onClick={() => {
                          if (locked) return;
                          if ("moduleKey" in layer && layer.moduleKey) {
                            if (moduleOff) return;
                            openModuleConfigure(String(layer.moduleKey));
                            return;
                          }
                          selectLayer(layer.key);
                        }}
                        startIcon={<LayerIcon size={17} />}
                        sx={{
                          justifyContent: sidebarCollapsed ? "center" : "flex-start",
                          opacity: moduleOff ? 0.46 : 1,
                          pointerEvents: locked ? "none" : "auto",
                          px: sidebarCollapsed ? 1 : undefined,
                          minWidth: 0,
                          "& .MuiButton-startIcon": {
                            marginRight: sidebarCollapsed ? 0 : 1,
                            marginLeft: sidebarCollapsed ? 0 : undefined,
                          },
                        }}
                      >
                        {!sidebarCollapsed ? (
                          <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>{layer.shortTitle}</Box>
                        ) : null}
                      </MuiButton>
                    );
                  })}
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Drawer>

        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <Topbar
            table={table}
            activeLayer={activeLayer}
            showTaskData={showTaskData}
            moduleWorkbenchActive={moduleWorkbenchActive}
            setupWorkbench={setupWorkbench}
            search={search}
            setSearch={setSearch}
            loadRows={loadRows}
            onBack={() => { setShowTaskData(false); setSelected(null); setDraft({}); }}
            saving={saving}
            selectedBot={selectedBot}
            activeBotKey={activeBotKey}
            bots={lookups.bots}
            selectedScope={selectedScope}
            setSelectedScope={setSelectedScope}
            groups={lookups.groups}
            setSelected={setSelected}
            setDraft={setDraft}
            setSelectedIds={setSelectedIds}
            topbarMenuOpen={topbarMenuOpen}
            setTopbarMenuOpen={setTopbarMenuOpen}
            scanMode={scanMode}
            setScanMode={setScanMode}
            openChannelComposer={() => openChannelComposer()}
            readOnlyTable={readOnlyTable}
            startCreate={startCreate}
            visibleRows={visibleRows}
            selectedVisibleRows={selectedVisibleRows}
            toggleAllVisible={toggleAllVisible}
            removeSelected={removeSelected}
            draft={draft}
            closeFocusedPanel={closeFocusedPanel}
            bulkOpen={bulkOpen}
            setBulkOpen={setBulkOpen}
            tableTaskLabel={TABLE_TASK_LABELS}
            tablePrimaryAction={TABLE_PRIMARY_ACTIONS}
            bulkTables={bulkTables}
            quickFilter={quickFilter}
            quickFilters={quickFilters}
            setQuickFilter={setQuickFilter}
            envStatus={meta?.envStatus}
            openCommand={() => setCommandOpen(true)}
            selectBot={selectBot}
            themeMode={themeMode}
            toggleThemeMode={toggleThemeMode}
            tone={activeLayerTone}
          />

          <Box component="main" sx={{ p: { xs: 1.5, md: 3 }, maxWidth: "100%", overflowX: "hidden" }}>
            <Stack spacing={2}>
              <Section
                eyebrow={
                  showOverview
                    ? "Material operations"
                    : activeLayer === "advanced"
                      ? "Ngoại lệ"
                      : "Tác vụ"
                }
                title={activeLayerHub.title}
                subtitle={activeLayerHub.desc}
                tone={activeLayerTone}
                icon={!showOverview ? <ActiveLayerIcon size={20} /> : undefined}
                actions={
                  showOverview ? (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                      <Chip label={`Bot: ${currentBot?.name || activeBotKey || "Chưa chọn"}`} />
                      <Chip label={`Scope: ${selectedScopeRow ? String(selectedScopeRow.group_name || selectedScope) : selectedScope || "Toàn hệ thống"}`} />
                      <Chip color="success" label={`${healthSummary.enabledModules} module ON`} />
                      <Chip color="default" label={`${moduleCards.length - healthSummary.enabledModules} module OFF`} />
                    </Stack>
                  ) : activeLayer !== "modules" && !activeLayer.startsWith("module:") ? (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                      {layerTables.map((item) => (
                        <MuiButton
                          key={item.key}
                          variant={activeKey === item.key ? "contained" : "outlined"}
                          onClick={() => ((moduleWorkbenchActive || setupWorkbench) ? openTaskData(item.key) : setActiveKey(item.key))}
                        >
                          {activeLayer === "advanced" ? item.label : TABLE_TASK_LABELS[item.key] || item.label}
                        </MuiButton>
                      ))}
                    </Stack>
                  ) : (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                      <Chip label={`Bot: ${currentBot?.name || activeBotKey || "Chưa chọn"}`} />
                      <Chip label={`Scope: ${selectedScopeRow ? String(selectedScopeRow.group_name || selectedScope) : selectedScope || "Toàn hệ thống"}`} />
                    </Stack>
                  )
                }
                sx={{ py: 2.5 }}
              />

        {showOverview ? (
          <Section
            eyebrow="Overview"
            title="Tổng quan vận hành"
            subtitle="Trạng thái, việc cần xử lý, lối vào module."
            tone="main"
          >
            <Stack spacing={2}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2.25,
                  bgcolor: "background.default",
                  backgroundImage: "linear-gradient(135deg, rgba(15, 118, 110, 0.06), transparent 56%)",
                  borderTopColor: "rgba(15, 118, 110, 0.24)",
                }}
              >
                <Stack spacing={1.5}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" } }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="overline" color="text.secondary">Health summary</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {healthSummary.pendingScamReports || healthSummary.pendingChannelPosts || healthSummary.failedChannelPosts ? "Có việc cần xử lý hôm nay" : "Hệ thống đang ổn định"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {healthSummary.pendingScamReports || healthSummary.pendingChannelPosts || healthSummary.failedChannelPosts
                          ? `Còn ${healthSummary.pendingScamReports + healthSummary.pendingChannelPosts + healthSummary.failedChannelPosts} mục cần xử lý.`
                          : "Không có backlog nổi bật."}
                      </Typography>
                    </Box>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ flexWrap: "wrap", justifyContent: { xs: "flex-start", md: "flex-end" }, width: { xs: "100%", md: "auto" } }}>
                      <MuiButton fullWidth={false} sx={{ width: { xs: "100%", sm: "auto" } }} variant="contained" onClick={() => openModuleConfigure("moderation")}>Xem việc cần xử lý</MuiButton>
                      <MuiButton fullWidth={false} sx={{ width: { xs: "100%", sm: "auto" } }} variant="outlined" onClick={() => goToInsight({ targetLayer: "logs", targetTable: "audit_logs" })}>Mở logs</MuiButton>
                    </Stack>
                  </Box>

                  <Grid container spacing={1.25}>
                    {[
                      { label: "Bot online", value: healthSummary.activeBots, body: "Bot đang hoạt động", tone: "success" as const },
                      { label: "Module bật", value: healthSummary.enabledModules, body: "Module đang chạy", tone: "main" as const },
                      { label: "Cảnh báo", value: healthSummary.pendingScamReports + healthSummary.failedChannelPosts, body: "Mục cần chú ý", tone: "warning" as const },
                      { label: "Bot off", value: healthSummary.disabledBots, body: "Bot chưa sẵn sàng", tone: "neutral" as const }
                    ].map((item) => (
                      <Grid key={item.label} size={{ xs: 12, sm: 6, xl: 3 }}>
                        <StatCard compact label={item.label} value={item.value} hint={item.body} tone={item.tone} />
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              </Paper>

              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, lg: 7 }}>
                  <Section eyebrow="Actions" title="Việc cần chú ý" subtitle="Bắt đầu từ cảnh báo, queue và hành động còn thiếu." tone="warning" subtle>
                    <Stack spacing={1.25}>
                      {overviewActionCards.map((item) => (
                        <Paper
                          key={item.label}
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            bgcolor: "background.paper",
                            borderLeft: "3px solid",
                            borderLeftColor: item.tone === "scam" || item.tone === "danger" ? "error.main" : item.tone === "warning" ? "warning.main" : "primary.main",
                          }}
                        >
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", gap: 2 }}>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.label}</Typography>
                              <Typography variant="body2" color="text.secondary">Mục đang chờ xử lý trong ca hiện tại.</Typography>
                            </Box>
                            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0, width: { xs: "100%", sm: "auto" }, justifyContent: { xs: "space-between", sm: "flex-end" } }}>
                              <Chip size="small" variant="outlined" label={String(item.value)} sx={{ borderColor: item.tone === "scam" ? "error.main" : item.tone === "danger" ? "error.main" : item.tone === "warning" ? "warning.main" : item.tone === "main" ? "primary.main" : "divider", color: item.tone === "scam" || item.tone === "danger" ? "error.main" : item.tone === "warning" ? "warning.main" : item.tone === "main" ? "primary.main" : "text.secondary", fontWeight: 700 }} />
                              <MuiButton size="small" variant="outlined" onClick={item.action}>Mở</MuiButton>
                            </Stack>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </Section>
                </Grid>

                <Grid size={{ xs: 12, lg: 5 }}>
                  <Section eyebrow="Quick view" title="Top hôm nay" subtitle="Tóm tắt hành động và group nổi bật." tone="analytics" subtle>
                    <Stack spacing={1.5}>
                      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.paper" }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>Top hành động hôm nay</Typography>
                        <Stack spacing={0.75}>
                          {todayAuditGroups.info.slice(0, 3).map((row) => (
                            <Stack key={String(row.id || row.action)} direction="row" sx={{ justifyContent: "space-between", gap: 2, py: 0.25 }}>
                              <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>{actionBadge(row, { key: "audit_logs", label: "Nhật ký", description: "", titleField: "action", summaryFields: [], fields: [] })}</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>{formatDateTime(row.created_at || row.updated_at)}</Typography>
                            </Stack>
                          ))}
                          {!todayAuditGroups.info.length ? <Typography variant="body2" color="text.secondary">Chưa có action nổi bật.</Typography> : null}
                        </Stack>
                      </Paper>

                      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.paper" }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>Group nổi bật</Typography>
                        <Stack spacing={0.75}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{String(selectedScopeRow?.group_name || selectedScope || "Chưa chọn group")}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {selectedScopeRow ? `Bot: ${selectedScopeRow.bot_key || selectedBot || "main"} · Scope đã chọn` : "Chọn scope để xem group nổi bật trong ngữ cảnh hiện tại."}
                          </Typography>
                        </Stack>
                      </Paper>
                    </Stack>
                  </Section>
                </Grid>
              </Grid>
            </Stack>
          </Section>
        ) : null}

        {showOverview ? (
          <Section eyebrow="Signals" title="Log bot trong ngày" subtitle="Tổng hợp ngắn gọn thay vì dàn đều mọi trạng thái trên một màn hình." tone="analytics">
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Chip label={`Tổng ${todayAuditSummary.total}`} />
                <Chip label={`Cảnh báo ${todayAuditSummary.warning}`} />
                <Chip label={`Nghiêm trọng ${todayAuditSummary.critical}`} />
                <Chip label={`Thông tin ${todayAuditSummary.info}`} />
                <MuiButton variant="outlined" onClick={() => goToInsight({ targetLayer: "logs", targetTable: "audit_logs" })}>Mở Logs</MuiButton>
              </Stack>
              <Grid container spacing={1.25}>
                {(["critical", "warning", "info"] as const).map((severity) => {
                  const group = todayAuditGroups[severity];
                  const titleMap = { critical: "Nghiêm trọng", warning: "Cảnh báo", info: "Thông tin" } as const;
                  return (
                    <Grid key={severity} size={{ xs: 12, lg: 4 }}>
                      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
                        <Stack direction="row" sx={{ justifyContent: "space-between", mb: 1 }}>
                          <Typography variant="subtitle2">{titleMap[severity]}</Typography>
                          <Typography variant="body2" color="text.secondary">{group.length}</Typography>
                        </Stack>
                        {group.length ? group.slice(0, 3).map((row) => {
                          const details = parseDetails(row.details);
                          return (
                            <Paper key={String(row.id || `${row.created_at}-${row.action}`)} variant="outlined" sx={{ p: 1.25, mb: 1, bgcolor: "background.paper" }}>
                              <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
                                <Box>
                                  <Typography variant="subtitle2">{actionBadge(row, { key: "audit_logs", label: "Nhật ký", description: "", titleField: "action", summaryFields: [], fields: [] })}</Typography>
                                  <Typography variant="body2" color="text.secondary">{String(row.message || details.message || details.reason || "Không có mô tả")}</Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary">{formatDateTime(row.created_at || row.updated_at)}</Typography>
                              </Stack>
                            </Paper>
                          );
                        }) : (
                          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.paper" }}>
                            <Typography variant="body2" color="text.secondary">Chưa có log nào thuộc nhóm này trong hôm nay.</Typography>
                          </Paper>
                        )}
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Stack>
          </Section>
        ) : null}

        {showOperations ? (
        <>
        {activeTaskDefinition && activeLayer !== "advanced" ? (
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }}>
            <Stack direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", lg: "center" } }}>
              <Box>
                <Typography variant="overline" color="text.secondary">Mục tiêu</Typography>
                <Typography variant="h6">{activeTaskDefinition.outcome}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 760 }}>{activeTaskDefinition.description}</Typography>
            </Stack>
          </Paper>
        ) : null}

        {activeLayer === "advanced" ? (
          <ErrorAlert
            title="Kỹ thuật"
            message="Chỉ mở khi cần. Dữ liệu kỹ thuật có thể thay đổi hành vi vận hành."
            icon={<Wrench size={18} />}
          />
        ) : null}

        {activeLayer === "modules" ? (
          <ModulesHubView
            enabledModuleCards={enabledModuleCards}
            disabledModuleCards={disabledModuleCards}
            moduleCards={moduleCards}
            moduleState={moduleState}
            lookups={lookups}
            activeAccent={activeAccent}
            saving={saving}
            setActiveModule={setActiveModule}
            toggleModule={toggleModule}
            openModuleConfigure={openModuleConfigure}
          />
        ) : null}

        {activeLayer.startsWith("module:") && !moduleTabsEmbedded ? (
          <Section
            eyebrow={activeModuleHub.key === "anti_scam" ? "Phân khu chống scam" : "Module tabs"}
            title={activeModuleHub.title}
            subtitle={!moduleEnabled ? "Module đang tắt. Bật module để sidebar cho phép vận hành." : "Chọn đúng phân khu để quản lý queue, hồ sơ và thiết lập của module."}
            tone={activeLayerTone}
            padding={1.5}
          >
            <Stack spacing={1.25}>
              <TabsBar
                tone={activeModuleHub.key === "anti_scam" ? "outlined" : "filled"}
                wrapped
                scrollable
                value={activeKey}
                onChange={(key) => openModuleConfigure(activeModuleHub.key, key)}
                items={activeModuleHub.tables.map((key) => {
                  const item = meta?.tables.find((tableItem) => tableItem.key === key);
                  const label = TABLE_TASK_LABELS[key] || item?.label || key;
                  return {
                    key,
                    label,
                  };
                })}
                sx={{
                  minHeight: "unset",
                  "& .MuiTabs-flexContainer": {
                    gap: activeModuleHub.key === "anti_scam" ? 0.5 : 1,
                  },
                }}
              />
            </Stack>
          </Section>
        ) : null}

        {activeLayer.startsWith("module:") && activeModuleHub.key === "automation" ? (
          <AutomationScreen
            scheduleReadiness={scheduleReadiness}
            scheduleIssues={scheduleIssues}
            scheduleSubject={scheduleSubject}
            selectedScope={selectedScope}
            scheduleMessagePool={scheduleMessagePool}
            scheduleMessagePreview={scheduleMessagePreview}
            scheduleVideoPool={scheduleVideoPool}
            scheduleVideoPreview={scheduleVideoPreview}
            goToScheduleContent={goToScheduleContent}
            startScheduledMessageFlow={startScheduledMessageFlow}
            lookupsGroupsLength={lookups.groups.length}
            tabs={activeModuleHub.tables.map((key) => ({
              key,
              label: TABLE_TASK_LABELS[key] || meta?.tables.find((tableItem) => tableItem.key === key)?.label || key,
            }))}
            activeTab={activeKey}
            onChangeTab={(tab) => openModuleConfigure(activeModuleHub.key, tab)}
          />
        ) : null}

        {activeLayer.startsWith("module:") && activeModuleHub.key === "welcome" ? (
          <WelcomeScreen
            moduleEnabled={moduleEnabled}
            welcomeEnabled={welcomeEnabled}
            welcomeText={welcomeDraftText}
            welcomeDeleteSeconds={welcomeDraftDeleteSeconds}
            welcomeButtonsText={welcomeDraftButtonsText}
            hasSavedConfig={Boolean(selectedScopeRow?.id)}
            saving={saving}
            testing={welcomeTesting}
            selectedGroupName={selectedScopeRow ? String(selectedScopeRow.group_name || selectedScope) : ""}
            selectedGroupId={selectedScopeRow ? String(selectedScopeRow.group_id || selectedScope) : ""}
            runtimeLastEventAt={welcomeSettings.welcome_runtime_last_event_at ? welcomeRuntimeLastEventAt : ""}
            runtimeLastSuccessAt={welcomeSettings.welcome_runtime_last_success_at ? welcomeRuntimeLastSuccessAt : ""}
            runtimeLastErrorAt={welcomeSettings.welcome_runtime_last_error_at ? welcomeRuntimeLastErrorAt : ""}
            runtimeLastErrorMessage={welcomeRuntimeLastErrorMessage}
            runtimeLastTestAt={welcomeSettings.welcome_runtime_last_test_at ? welcomeRuntimeLastTestAt : ""}
            runtimeLastEventSource={welcomeRuntimeLastEventSource}
            runtimeDeleteStatus={welcomeDeleteStatus}
            onToggleWelcome={(nextEnabled) => {
              setWelcomeDraftEnabled(nextEnabled);
              void saveWelcomeSettings({ welcome_enabled: nextEnabled ? "true" : "false" });
            }}
            onChangeText={setWelcomeDraftText}
            onChangeDeleteSeconds={(value) => setWelcomeDraftDeleteSeconds(Number(value) || 0)}
            onChangeButtonsText={setWelcomeDraftButtonsText}
            onSave={() => void saveWelcomeSettings({
              welcome_text: welcomeDraftText,
              welcome_delete_seconds: welcomeDraftDeleteSeconds
            })}
            onTestRuntime={() => void testWelcomeRuntime()}
            tabLabel={TABLE_TASK_LABELS.groups || "Cài đặt group"}
          />
        ) : null}

        {activeLayer.startsWith("module:") && activeModuleHub.key === "auto_reply" ? (
          <AutoReplyScreen
            moduleEnabled={moduleEnabled}
            saving={saving}
            selectedBotKey={activeBotKey || selectedBot || "main"}
            selectedBotName={currentBot?.name || activeBotKey || selectedBot || "main"}
            stats={autoReplyStats}
            rows={rows}
            createOpen={autoReplyCreateOpen}
            createDraft={autoReplyDraft}
            editingRuleId={autoReplyEditingId}
            onOpenCreate={() => setAutoReplyCreateOpen(true)}
            onEditAutoReply={(row) => {
              setAutoReplyEditingId(String(row.id || ""));
              setAutoReplyDraft({
                trigger: String(row.trigger || "hello"),
                match: String(row.match || "smart"),
                ignore_diacritics: Boolean(row.ignore_diacritics),
                reply: String(row.reply || ""),
                notes: String(row.notes || ""),
                enabled: row.enabled !== false,
              });
              setAutoReplyCreateOpen(true);
            }}
            onCloseCreate={() => {
              setAutoReplyCreateOpen(false);
              setAutoReplyEditingId(null);
              setAutoReplyDraft({ trigger: "hello", match: "smart", ignore_diacritics: false, reply: "Chào {user}, mình có thể giúp gì cho bạn?", notes: "", enabled: true });
            }}
            onToggleModule={() => void toggleModule("auto_reply")}
            onCreateAutoReply={createAutoReply}
            onDeleteAutoReply={(row) => void deleteAutoReply(row)}
          />
        ) : null}

        {activeLayer.startsWith("module:") && activeModuleHub.key === "entertainment" ? (
          <GiveawayScreen
            moduleEnabled={moduleEnabled}
            campaigns={rows}
            giveawayEntries={lookups.giveawayEntries}
            selectedScope={selectedScope}
            selectedScopeName={selectedScopeRow?.group_name || ""}
            saving={saving}
            onOpenEntries={openGiveawayEntries}
            onDrawCampaign={drawGiveawayCampaign}
            onCloseCampaign={closeGiveawayCampaign}
            onToggleModule={() => void toggleModule("entertainment")}
            onCreateCampaign={createGiveawayCampaign}
          />
        ) : null}

        {activeLayer.startsWith("module:") && activeModuleHub.key === "share_unlock" ? (
          <ShareUnlockScreen
            moduleEnabled={moduleEnabled}
            saving={saving}
            selectedScope={selectedScope}
            selectedScopeName={selectedScopeRow?.group_name || ""}
            campaigns={lookups.shareUnlockCampaigns.filter((row) => !selectedScope || String(row.source_chat_id || "") === String(selectedScope))}
            invites={lookups.shareUnlockInvites}
            referrals={lookups.shareUnlockReferrals}
            onToggleModule={() => void toggleModule("share_unlock")}
            onToggleCampaignStatus={toggleShareUnlockCampaignStatus}
            onCreateCampaign={createShareUnlockCampaign}
            onOpenInvites={openShareUnlockInvites}
            onOpenReferrals={openShareUnlockReferrals}
          />
        ) : null}

        {activeLayer.startsWith("module:") && activeModuleHub.key === "moderation" ? (
          <ModerationScreen
            selectedGroupProtection={selectedScopeProtection}
            moderationPolicySummary={moderationPolicySummary}
            startGroupProtectionFlow={startGroupProtectionFlow}
            openTaskData={openTaskData}
            goToInsight={goToInsight}
            activeTab={activeConfigTab}
            setActiveTab={(tab) => {
              setActiveConfigTab(tab);
              if (tab === "Thiết lập dùng chung") {
                setSelected(null);
                setDraft({});
              }
            }}
            tabs={activeModuleHub.tables.map((key) => ({
              key,
              label: TABLE_TASK_LABELS[key] || meta?.tables.find((tableItem) => tableItem.key === key)?.label || key,
            }))}
            activeWorkspaceTab={activeKey}
            onChangeWorkspaceTab={(tab) => openModuleConfigure(activeModuleHub.key, tab)}
          />
        ) : null}

        {activeLayer === "bot" ? (
          <BotScreen setupChecklist={setupChecklist} openTaskData={openTaskData} selectLayer={selectLayer} />
        ) : null}

        {activeLayer === "group" ? (
          <GroupScreen
            setupIssues={setupIssues}
            setupChecklist={setupChecklist}
            selectedScopeRow={selectedScopeRow}
            selectedScope={selectedScope}
            openTaskData={openTaskData}
            selectLayer={selectLayer}
            startCreate={startCreate}
            tabs={CORE_LAYERS.find((layer) => layer.key === "group")?.tables.map((key) => ({
              key,
              label: TABLE_TASK_LABELS[key] || meta?.tables.find((tableItem) => tableItem.key === key)?.label || key,
            })) || []}
            activeTab={activeKey}
            onChangeTab={(tab) => openTaskData(tab)}
          />
        ) : null}

        {showPrimaryTask ? (
        <>
        <Banners error={error} notice={notice} toast={toast} />

        {table.key === "audit_logs" && activeLayer !== "members" && activeLayer !== "blacklist" ? (
          <AuditConsole auditStats={auditStats} />
        ) : null}

        {activeLayer === "members" || activeLayer === "blacklist" ? (
          <MemberWorkspace
            systemBlacklistActive={systemBlacklistActive}
            loadMemberOverview={loadMemberOverview}
            memberOverviewLoading={memberOverviewLoading}
            openMemberAction={openMemberAction}
            effectiveMemberChatId={effectiveMemberChatId}
            selectedMemberChatId={selectedMemberChatId}
            systemBlacklistStats={systemBlacklistStats}
            memberStatsCards={memberStatsCards}
            memberActionFeedback={memberActionFeedback}
            memberSearchInput={memberSearchInput}
            setMemberSearchInput={setMemberSearchInput}
            memberFilters={memberFilters}
            setMemberFilters={setMemberFilters}
            resetMemberFilters={resetMemberFilters}
            memberActiveMeta={memberActiveMeta}
            memberFilteredRows={memberFilteredRows}
            memberPage={memberPage}
            memberTotalPages={memberTotalPages}
            memberTabItems={memberTabItems}
            memberTab={memberTab}
            memberOverview={memberOverview}
            memberLoadedCount={memberLoadedCount}
            memberPageSize={memberPageSize}
            setMemberPage={setMemberPage}
            openMemberDetail={openMemberDetail}
            runMemberAction={runMemberAction}
            memberReleaseActionFor={memberReleaseActionFor}
            memberTabLabel={memberTabLabel}
            memberLaneDescription={memberLaneDescription}
            memberLaneTone={memberLaneTone}
            memberLaneOfRow={memberLaneOfRow}
            memberUserId={memberUserId}
            memberStatusOf={memberStatusOf}
            memberReasonOf={memberReasonOf}
            memberLastSeen={memberLastSeen}
            memberDisplayName={memberDisplayName}
            memberUsername={memberUsername}
            memberStatusBadgeLabel={memberStatusBadgeLabel}
          />
        ) : null}

        {table.key === "scam_reports" ? (
          <ScamInbox
            scamInboxStats={scamInboxStats}
            scamReports={lookups.scamReports}
            scamBroadcasts={lookups.scamBroadcasts}
            onOpenAllReports={() => {
              setQuickFilter("all");
              setSelected(null);
            }}
            onOpenReport={(id) => {
              const next = lookups.scamReports.find((row) => String(row.id) === String(id));
              if (next) {
                setSelected(next);
              }
            }}
            onConfirm={confirmScamReport}
            onReject={rejectScamReport}
            onDuplicate={duplicateScamReport}
            onNeedMoreInfo={needMoreInfoScamReport}
            onOpenBroadcasts={() => goToInsight({ targetLayer: "module:anti_scam", targetTable: "scam_broadcasts" })}
            onEdit={(row) => startEdit(row)}
          />
        ) : null}

        {table.key === "keywords" ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Luật từ khóa:</strong> nếu action = <code>delete</code> thì bot vẫn xóa tin và cộng cảnh báo nội bộ. Khi user chạm ngưỡng <code>ban_after_warnings</code>, bot sẽ tự ban để tránh spam lách luật.
          </Alert>
        ) : null}

        {bulkOpen && bulkTables.has(table.key) ? (
          <BulkPanel
            tableKey={table.key}
            bulkDefaults={bulkDefaults}
            updateBulkDefault={updateBulkDefault}
            bots={lookups.bots}
            bulkText={bulkText}
            setBulkText={setBulkText}
            saving={saving}
            parsedBulkRows={parsedBulkRows}
            saveBulk={saveBulk}
            bulkHint={bulkHint}
            titleFor={titleFor as (row: Record<string, string | number | boolean | null>, table: { key: string }) => string}
            table={table}
          />
        ) : null}

        {table.key === "channel_posts" ? (
          <ChannelPublisherConsole
            visibleRows={visibleRows}
            channelPostTabFor={channelPostTabFor}
            channelTab={channelTab}
            setChannelTab={setChannelTab}
            channelPageRows={channelPageRows}
            healthState={healthState}
            saving={saving}
            channelPostAction={channelPostAction}
            openChannelComposer={openChannelComposer}
            scheduleChannelDelete={scheduleChannelDelete}
            channelPageCount={channelPageCount}
            channelPage={channelPage}
            setChannelPage={setChannelPage}
          />
        ) : table.key === "bot_metrics" ? (
          <MetricsDashboard
            dashboardRows={dashboardRows}
            loading={loading}
            metricPeriod={metricPeriod}
            metricValue={metricValue}
            metricLabel={metricLabel}
            metricGroups={metricGroups}
            analyticsSummary={analyticsSummary}
            analyticsLoading={analyticsLoading}
            groupNameForId={groupNameForId}
          />
        ) : null}

        {activeLayer === "module:menu_policy" && table.key === "config" ? (
          <MenuPolicyConsole
            menuCommandsEnabled={menuCommandsEnabled}
            policyButtonEnabled={policyButtonEnabled}
            menuCommandRows={menuCommandRows}
            menuPolicyRows={menuPolicyRows}
            menuContentRows={menuContentRows}
            draft={draft}
            saving={saving}
            isConfigBoolean={isConfigBoolean}
            configLabel={configLabel}
            configDescription={configDescription}
            configDisplayValue={configDisplayValue}
            configEditorKind={configEditorKind}
            configSelectOptions={configSelectOptions}
            configPlaceholders={configPlaceholders}
            fieldUnitHint={fieldUnitHint}
            toggleConfigValue={toggleConfigValue}
            startEdit={startEdit}
            closeFocusedPanel={closeFocusedPanel}
            setDraft={setDraft}
            save={save}
          />
        ) : table.key === "channel_posts" ? null : table.key === "config" && activeLayer.startsWith("module:") ? (
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }}>
            <Stack spacing={2}>
              <TabsBar
                tone="outlined"
                wrapped={false}
                scrollable
                value={activeConfigTab || configTabs[0]?.title || ""}
                onChange={(tab) => {
                  setActiveConfigTab(tab);
                  setDraft({});
                  setSelected(null);
                }}
                items={configTabs.map((section) => ({
                  key: section.title,
                  label: `${section.title} (${section.rows.length})`,
                }))}
                sx={{
                  "& .MuiTabs-flexContainer": {
                    gap: 1,
                  },
                }}
              />

            {activeConfigSection ? (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
                <Stack spacing={2}>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    {ActiveConfigIcon ? <ActiveConfigIcon size={22} /> : null}
                  <Box>
                    <Typography variant="h6">{activeConfigSection.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{activeConfigSection.desc}</Typography>
                  </Box>
                </Stack>
                {activeLayer === "module:moderation" ? (
                  <ModerationConfigSections
                    activeConfigSection={activeConfigSection}
                    moderationScanTextLink={moderationScanTextLink}
                    moderationScanTextMention={moderationScanTextMention}
                    moderationAllowInGroupMentions={moderationAllowInGroupMentions}
                    moderationHiddenLinkAction={moderationHiddenLinkAction}
                    toggleModerationScanTextLink={toggleModerationScanTextLink}
                    toggleModerationScanTextMention={toggleModerationScanTextMention}
                    toggleModerationAllowInGroupMentions={toggleModerationAllowInGroupMentions}
                    changeModerationHiddenLinkAction={changeModerationHiddenLinkAction}
                    spamConfigBlocks={spamConfigBlocks}
                    moderationConfigRowMap={moderationConfigRowMap}
                    saving={saving}
                    toggleConfigValue={toggleConfigValue}
                    selected={selected}
                    draft={draft}
                    setDraft={setDraft}
                    startEdit={startEdit}
                    closeFocusedPanel={closeFocusedPanel}
                    save={save}
                    templateConfigBlocks={templateConfigBlocks}
                    bioLinkConfigBlocks={bioLinkConfigBlocks}
                    otherConfigBlocks={otherConfigBlocks}
                    moderationBlocks={moderationBlocks}
                    forwardMode={forwardMode}
                    setForwardMode={setForwardMode}
                    forwardContentBlock={forwardContentBlock}
                    forwardViolationBlock={forwardViolationBlock}
                    defaultView={null}
                  />
                ) : (
                <Grid container spacing={1.5}>
                  {activeConfigSection.rows.map((row) => {
                    const editing = selected?.id === row.id && Object.keys(draft).length > 0;
                    const booleanValue = isConfigBoolean(row);
                    const valueOn = String(row.value).toLowerCase() === "true";
                    const editorKind = configEditorKind(String(row.key || ""));
                    return (
                      <Grid key={row.id || row.key} size={{ xs: 12, lg: 6, xl: 4 }}>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default", opacity: row.enabled === false ? 0.7 : 1 }}>
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
                  {!activeConfigSection.rows.length ? (
                    <Grid size={{ xs: 12 }}>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                          <SlidersHorizontal size={26} />
                          <Box>
                            <Typography variant="subtitle1">Chưa có cài đặt</Typography>
                            <Typography variant="body2" color="text.secondary">Thêm key mới để hiện tại đây.</Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    </Grid>
                  ) : null}
                </Grid>
                )}
                </Stack>
              </Paper>
            ) : (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <SlidersHorizontal size={28} />
                  <Box>
                    <Typography variant="subtitle1">Cài đặt đã chuyển sang workbench</Typography>
                    <Typography variant="body2" color="text.secondary">Mở đúng module để sửa mặc định.</Typography>
                  </Box>
                </Stack>
              </Paper>
        )}
            </Stack>
          </Paper>
        ) : activeLayer !== "members" && activeLayer !== "blacklist" ? (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: hasFocusedPanel
              ? { xs: "1fr", lg: "minmax(0, 1fr) minmax(0, 1.2fr)" }
              : "1fr",
          }}
        >
          <WorkbenchList
            sectionTitle={TABLE_TASK_LABELS[table.key] || table.label}
            sectionSubtitle={scanMode === "scan" ? "Chỉ hiện trạng thái chính." : "Kèm ngữ cảnh và hành động."}
            visibleRows={visibleRows}
            loading={loading}
            scanMode={scanMode}
            selectedIds={selectedIds}
            toggleSelected={toggleSelected}
            selected={selected}
            inspectRow={inspectRow}
            table={table}
            readOnlyTable={readOnlyTable}
            titleFor={titleFor as (row: Record<string, unknown>, table: { key: string }) => string}
            previewText={previewText as (row: Record<string, unknown>, table: { key: string }) => string}
            auditLogSummary={auditLogSummary}
            auditLogCardData={(row) => auditLogCardData(row, groupNameForId)}
            healthState={healthState as (row: Record<string, unknown>, tableKey?: string) => { label: string; className: string }}
            actionBadge={actionBadge as (row: Record<string, unknown>, table: { key: string }) => string}
            scamReportFacts={scamReportFacts}
            auditLogSeverity={auditLogSeverity}
            auditLogDetails={auditLogRows}
            auditLogEssentials={auditLogEssentials}
            auditActionTone={auditActionTone}
            fieldByKey={fieldByKey as (table: { fields?: Array<{ key: string; label?: string }> } & Record<string, unknown>, key: string) => { key: string; label?: string } | undefined}
            displayValue={displayValue}
            saving={saving}
            queueChannelPost={queueChannelPost}
            confirmScamReport={confirmScamReport}
            startEdit={startEdit}
            remove={remove}
            emptyState={emptyState}
            startCreate={startCreate}
            filterTabs={table.key !== "config" && table.key !== "channel_posts" && table.key !== "scam_reports"
              ? quickFilters.map((filter) => ({ key: filter.key || "all", label: filter.label }))
              : undefined}
            activeFilter={table.key !== "config" && table.key !== "channel_posts" && table.key !== "scam_reports" ? (quickFilter || "all") : undefined}
            onChangeFilter={table.key !== "config" && table.key !== "channel_posts" && table.key !== "scam_reports"
              ? (value) => setQuickFilter(value)
              : undefined}
          />

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
                          label: `${tab.label} (${tab.count})`,
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
                              ) : field.type === "select" || (lookupOptions.length && !(table?.key === "bots" && field.key === "bot_key")) ? (
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
                                  {(lookupOptions.length ? lookupOptions : field.options?.map((option: string) => ({
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
        </Box>
        ) : null}
        </>
        ) : null}
        </>
        ) : null}
      <MemberDetailDrawer
        open={memberDetailOpen}
        onClose={() => {
          setMemberDetailOpen(false);
          setMemberDetail(null);
        }}
        memberSelectedRow={memberSelectedRow}
        memberDetail={memberDetail}
        memberOverview={memberOverview}
        memberActionTrace={memberActionTrace}
        memberNoteDraft={memberNoteDraft}
        setMemberNoteDraft={setMemberNoteDraft}
        saveMemberNote={saveMemberNote}
        memberNoteSaving={memberNoteSaving}
        openMemberAction={openMemberAction}
        runMemberAction={runMemberAction}
        memberTimelineFilter={memberTimelineFilter}
        setMemberTimelineFilter={setMemberTimelineFilter}
        memberDetailLoading={memberDetailLoading}
        memberDetailTimeline={memberDetailTimeline}
        timelineToneForType={timelineToneForType}
        timelineToneForSource={timelineToneForSource}
        timelineIconForType={timelineIconForType}
        memberStatusOf={memberStatusOf}
        memberDisplayName={memberDisplayName}
        memberUsername={memberUsername}
        memberUserId={memberUserId}
        memberStatusLabel={memberStatusLabel}
        memberLaneTone={memberLaneTone}
        memberLaneOfRow={memberLaneOfRow}
        memberSourceOf={memberSourceOf}
        memberLastSeen={memberLastSeen}
        memberReasonOf={memberReasonOf}
        memberLaneDescription={memberLaneDescription}
      />

      <MemberActionDialog
        open={memberActionOpen}
        onClose={() => setMemberActionOpen(false)}
        onSubmit={submitMemberAction}
        memberActionDraft={memberActionDraft}
        setMemberActionDraft={setMemberActionDraft}
        memberActionFeedback={memberActionFeedback}
        saving={saving}
        effectiveMemberChatId={effectiveMemberChatId}
        systemBlacklistActive={systemBlacklistActive}
      />
      <ChannelComposer
        open={channelComposerOpen}
        composer={channelComposer}
        setComposer={setChannelComposer}
        buttons={channelButtons}
        setButtons={setChannelButtons}
        updateButton={updateChannelButton}
        bots={lookups.bots}
        groups={lookups.groups}
        selectedBot={selectedBot}
        saving={saving}
        onClose={() => setChannelComposerOpen(false)}
        saveDraft={() => saveChannelPost("draft")}
        schedulePost={() => saveChannelPost("schedule")}
        sendNow={() => saveChannelPost("send_now")}
      />
      <CommandPalette
        open={commandOpen}
        search={commandSearch}
        setSearch={setCommandSearch}
        items={filteredCommandItems}
        onClose={() => setCommandOpen(false)}
        onRun={runCommand}
      />
            </Stack>
          </Box>
        </Box>
      </Box>
  );
}
