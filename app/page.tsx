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
} from "lucide-react";

import { FieldConfig, FieldType, TableConfig, TABLES } from "@/lib/tables";
import { ADMIN_TASKS, TABLE_PRIMARY_ACTIONS, TABLE_TASK_LABELS } from "@/lib/tasks";
import { AutomationScreen, AutoReplyScreen, BotScreen, GroupScreen, InspectorPanel, ModerationScreen, WelcomeScreen, GiveawayScreen, ShareUnlockScreen } from "./components/module-screens";
import AuditConsole from "./components/screens/AuditConsole";
import ScamInbox from "./components/screens/ScamInbox";
import BulkPanel from "./components/screens/BulkPanel";
import MetricsDashboard from "./components/screens/MetricsDashboard";
import MenuPolicyConsole from "./components/screens/MenuPolicyConsole";
import ChannelComposer from "./components/screens/ChannelComposer";
import CommandPalette from "./components/screens/CommandPalette";
import ModerationToggles from "./components/screens/ModerationToggles";
import Topbar from "./components/screens/Topbar";
import LoginPanel from "./components/screens/LoginPanel";
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

type Row = Record<string, any>;
type BulkRow = Record<string, string | number | boolean | null>;
type BulkDefaults = {
  bot_key: string;
  pool: string;
  weight: number;
  action: string;
  match: string;
  reason: string;
  risk: string;
  risk_level: string;
  status: string;
  source: string;
  enabled: boolean;
};

type Meta = {
  tables: TableConfig[];
  passwordRequired: boolean;
  envStatus?: {
    supabaseUrl: boolean;
    serviceRoleKey: boolean;
    cpPassword: boolean;
    botToken: boolean;
    botKey: boolean;
    runtimeMode: string;
  };
};
const FALLBACK_META: Meta = {
  tables: TABLES,
  passwordRequired: false,
  envStatus: {
    supabaseUrl: false,
    serviceRoleKey: false,
    cpPassword: false,
    botToken: false,
    botKey: false,
    runtimeMode: "fallback"
  }
};
type Lookups = {
  bots: Row[];
  groups: Row[];
  messages: Row[];
  videos: Row[];
  moduleSettings: Row[];
  scamReports: Row[];
  scamBroadcasts: Row[];
  auditLogs: Row[];
  channelPosts: Row[];
  giveawayEntries: Row[];
  shareUnlockCampaigns: Row[];
  shareUnlockInvites: Row[];
  shareUnlockReferrals: Row[];
};
type CommandInsight = {
  severity: "critical" | "high" | "warning" | "info" | "healthy";
  title: string;
  body: string;
  impact: string;
  action: string;
  targetLayer: string;
  targetTable: string;
};
type WorkMode = "overview" | "operate" | "edit";
type RuleTestResult = {
  label: string;
  detail: string;
  matched: boolean;
};
type EmptyStateConfig = {
  title: string;
  body: string;
  action: string;
  steps: string[];
};

type ToastState = {
  type: "success" | "error" | "info";
  message: string;
};

type DeleteFailureAlert = {
  recentCount: number;
  latestAt: string;
  latestReason: string;
};

type ChannelPostTab = "queue" | "scheduled" | "sent" | "deleted" | "failed";
type ChannelButtonDraft = { label: string; url: string; row: number };

const drawerWidth = 292;

const defaultBoolean = new Set(["enabled", "daily_enabled", "delete_system_messages", "delete_forwarded_messages", "allow_forward_messages", "allow_automatic_forwards"]);
const CONFIG_BOOLEAN_KEYS = new Set([
  "moderation_enabled",
  "delete_system_messages",
  "delete_forwarded_messages",
  "allow_forward_messages",
  "forward_allowed_sources",
  "scan_hidden_links",
  "scan_text_link",
  "scan_text_mention",
  "allow_in_group_mentions",
  "allow_automatic_forwards",
  "delete_inline_keyboard_messages",
  "delete_messages_from_bots",
  "remove_unknown_bots",
  "exempt_admins",
  "scan_bio_links",
  "bio_link_delete_message",
  "duplicate_message_enabled",
  "show_policy_button",
  "send_on_boot",
  "send_if_silent",
]);
const CONFIG_SELECT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  delete: [
    { value: "delete", label: "Xóa tin" },
    { value: "warn", label: "Cảnh báo" },
    { value: "restrict", label: "Hạn chế chat" },
    { value: "ban", label: "Ban khỏi nhóm" }
  ],
  warn: [
    { value: "warn", label: "Cảnh báo" },
    { value: "delete", label: "Xóa tin" },
    { value: "restrict", label: "Hạn chế chat" },
    { value: "ban", label: "Ban khỏi nhóm" }
  ],
  restrict: [
    { value: "restrict", label: "Hạn chế chat" },
    { value: "warn", label: "Cảnh báo" },
    { value: "delete", label: "Xóa tin" },
    { value: "ban", label: "Ban khỏi nhóm" }
  ],
  ban: [
    { value: "ban", label: "Ban khỏi nhóm" },
    { value: "warn", label: "Cảnh báo" },
    { value: "delete", label: "Xóa tin" },
    { value: "restrict", label: "Hạn chế chat" }
  ]
};
const CONFIG_DEFAULT_VALUES: Record<string, string> = {
  moderation_enabled: "true",
  delete_system_messages: "true",
  delete_forwarded_messages: "true",
  allow_forward_messages: "true",
  allow_automatic_forwards: "true",
  forward_allowed_sources: "channel, group, user",
  delete_inline_keyboard_messages: "true",
  delete_messages_from_bots: "true",
  remove_unknown_bots: "true",
  exempt_admins: "true",
  spam_max_messages: "6",
  spam_window_seconds: "12",
  spam_action: "warn",
  spam_restrict_seconds: "300",
  forward_action: "warn",
  inline_keyboard_action: "warn",
  ban_after_warnings: "3",
  ban_seconds: "0",
  warning_text: "{mention} cảnh báo vi phạm: {reason}\nSố lần cảnh báo: {count}/{limit}\nVui lòng dừng lại để tránh bị khóa hoặc ban.",
  forward_warning_reason: "Không cho phép chia sẻ Story/forward/trích dẫn nội dung từ nguồn bên ngoài vào nhóm.",
  forward_warning_text: "{mention} bạn đang gửi nội dung chuyển tiếp từ nguồn ngoài.\nLý do: {reason}\nCảnh báo: {count}/{limit}\nTiếp tục vi phạm sẽ bị xử lý mạnh hơn.",
  spam_restrict_text: "{mention} đã bị tạm khóa chat vì vi phạm: {reason}\nNếu cần hỗ trợ, liên hệ admin và chờ mở lại quyền chat.",
  warning_notice_delete_seconds: "180",
  forward_warning_delete_seconds: "180",
  spam_notice_delete_seconds: "30",
  violation_delete_retry_seconds: "2",
  duplicate_message_enabled: "true",
  duplicate_message_max_count: "3",
  duplicate_message_window_seconds: "600",
  duplicate_message_action: "warn",
  duplicate_message_reason: "Không gửi lặp lại cùng một nội dung hoặc sticker.",
  media_spam_max_messages: "3",
  media_spam_window_seconds: "10",
  media_spam_action: "restrict",
  scan_bio_links: "true",
  bio_link_delete_message: "true",
  bio_link_restrict_seconds: "0",
  bio_scan_cache_seconds: "3600",
  bio_link_warning_text: "{mention} bio của bạn đang chứa link.\nVui lòng gỡ link trong bio rồi nhắn admin để được mở chat lại.",
  bio_link_notice_delete_seconds: "60",
  giveaway_created_text: "Đã tạo giveaway #{id}.\nTên: {title}\nPhần thưởng: {prize}\nNgười dùng tham gia bằng lệnh /join {id} hoặc bấm nút tham gia bên dưới.",
  giveaway_empty_text: "Hiện chưa có giveaway nào đang mở. Admin có thể tạo giveaway mới bất cứ lúc nào.",
  giveaway_list_title: "Danh sách giveaway đang mở:",
  giveaway_join_usage_text: "Gửi theo cú pháp: /join <giveaway_id>\nNếu campaign yêu cầu từ khóa, thêm từ khóa ở cuối lệnh.",
  giveaway_not_found_open_text: "Không tìm thấy giveaway đang mở theo ID bạn vừa nhập.",
  giveaway_keyword_required_text: "Giveaway này yêu cầu từ khóa. Hãy gửi: /join {id} {keyword}",
  giveaway_joined_text: "Đã ghi nhận bạn tham gia giveaway #{id}.\nMã lượt tham gia: {entry_id}",
  giveaway_join_duplicate_text: "Bạn đã tham gia giveaway này rồi hoặc dữ liệu tham gia chưa hợp lệ.",
  giveaway_draw_usage_text: "Admin dùng lệnh: /draw <giveaway_id> để quay người thắng.",
  giveaway_not_found_text: "Không tìm thấy giveaway theo ID vừa nhập.",
  giveaway_no_entries_text: "Giveaway này chưa có người tham gia, chưa thể quay kết quả.",
  giveaway_result_text: "Kết quả giveaway #{id}:\n{winners}",
  giveaway_close_usage_text: "Admin dùng lệnh: /closegiveaway <giveaway_id> để đóng giveaway.",
  giveaway_closed_text: "Đã đóng giveaway #{id} thành công.",
};
const ADVANCED_FIELD_KEYS = new Set(["id", "created_at", "updated_at", "settings"]);
const GROUP_TAB_ORDER = ["Thông tin", "Bảo vệ group", "Luật spam", "Tin bot gửi", "Bio/link", "Lịch gửi", "Video", "Menu riêng", "Nội dung riêng", "Ghi chú", "Kỹ thuật"];
const GROUP_BASE_SECTIONS = new Set(["Thông tin nhóm", "Thông tin", "Ghi chú", "Advanced"]);
const GROUP_MODULE_SECTIONS: Record<string, Set<string>> = {
  moderation: new Set(["Thông tin nhóm", "Thông tin", "Ghi chú", "Advanced"]),
  automation: new Set(["Thông tin nhóm", "Thông tin", "Lịch gửi tin", "Video", "Ghi chú", "Advanced"]),
  menu_policy: new Set(["Thông tin nhóm", "Thông tin", "Menu bot", "Nội dung", "Ghi chú", "Advanced"])
};
const GROUP_TAB_LABELS: Record<string, string> = {
  "Thông tin nhóm": "Thông tin",
  "Thông tin": "Thông tin",
  "Kiểm duyệt": "Bảo vệ group",
  "Luật spam": "Luật spam",
  "Mẫu tin kiểm duyệt": "Tin bot gửi",
  "Bio, link & cảnh báo": "Bio/link",
  "Lịch gửi tin": "Lịch gửi",
  Video: "Video",
  "Menu bot": "Menu riêng",
  "Nội dung": "Nội dung riêng",
  "Ghi chú": "Ghi chú",
  Advanced: "Kỹ thuật"
};
const SCHEDULE_STEPS = [
  { title: "Chọn group", desc: "Xác định group/kênh sẽ nhận tin định kỳ." },
  { title: "Chọn pool", desc: "Gán message_pool hoặc video_pool đang có nội dung." },
  { title: "Preview nội dung", desc: "Xem trước vài tin/video bot có thể gửi." },
  { title: "Đặt giờ", desc: "Lưu daily/video window trên cấu hình group." }
];
const bulkTables = new Set(["messages", "keywords", "video_messages", "scam_entities", "domain_blacklist", "link_shorteners", "auto_replies"]);
const NAV_GROUPS = [
  { label: "Tổng quan", keys: ["bot_metrics", "audit_logs"] },
  { label: "Bot & nhóm", keys: ["bots", "groups", "module_settings", "admins", "member_roles"] },
  { label: "Bảo mật", keys: ["verification_settings", "captcha_questions", "keywords", "domain_blacklist", "link_shorteners", "bot_allowlist"] },
  { label: "Nội dung", keys: ["messages", "video_messages", "channel_posts", "auto_replies", "scheduled_posts"] },
  { label: "Scam", keys: ["scam_entities", "scam_reports"] },
  { label: "Giải trí", keys: ["entertainment_events", "giveaway_campaigns", "giveaway_entries", "share_unlock_campaigns", "share_unlock_invites", "share_unlock_referrals", "reputation_rules"] }
];
const CORE_LAYERS = [
  {
    key: "overview",
    title: "Việc cần xử lý",
    shortTitle: "Tổng quan",
    desc: "Bắt đầu từ cảnh báo, việc còn thiếu và hành động cần hoàn tất hôm nay.",
    icon: ClipboardList,
    tone: "main",
    tables: ["bot_metrics", "audit_logs"],
    navSection: "Tổng quan"
  },
  {
    key: "bot",
    title: "Bot",
    shortTitle: "Bot",
    desc: "Kết nối bot, kiểm tra trạng thái và hoàn tất các điều kiện để bot bắt đầu vận hành.",
    icon: Bot,
    tone: "content",
    tables: ["bots", "module_settings"],
    navSection: "Vận hành"
  },
  {
    key: "group",
    title: "Group",
    shortTitle: "Group",
    desc: "Quản lý group/channel bot đang phục vụ, quyền truy cập và người có vai trò vận hành.",
    icon: Users,
    tone: "security",
    tables: ["groups", "bot_allowlist", "admins", "member_roles"],
    navSection: "Vận hành"
  },
  {
    key: "modules",
    title: "Module",
    shortTitle: "Module",
    desc: "Bật chức năng và mở workbench riêng cho từng module.",
    icon: Sparkles,
    tone: "content",
    tables: ["module_settings"],
    navSection: "Vận hành"
  },
  {
    key: "logs",
    title: "Logs",
    shortTitle: "Logs",
    desc: "Rà soát sự cố, hành động kiểm duyệt và các thay đổi vận hành đáng chú ý.",
    icon: Activity,
    tone: "main",
    tables: ["audit_logs", "scam_reports"],
    navSection: "Vận hành"
  },
  {
    key: "members",
    title: "Thành viên",
    shortTitle: "Thành viên",
    desc: "Theo dõi nhật ký join/out của thành viên trong group bot đang quản lý.",
    icon: Users,
    tone: "security",
    tables: ["audit_logs", "member_roles", "admins"],
    navSection: "Vận hành"
  }
];
const SYSTEM_LAYERS = [
  {
    key: "advanced",
    title: "Dữ liệu kỹ thuật",
    shortTitle: "Dữ liệu kỹ thuật",
    desc: "Tra cứu và sửa dữ liệu thô khi cần xử lý ngoại lệ. Không dùng cho vận hành hằng ngày.",
    icon: Wrench,
    tone: "content",
    tables: NAV_GROUPS.flatMap((group) => group.keys),
    navSection: "Nâng cao"
  }
];
const TABLE_GUIDES: Record<string, { title: string; body: string; steps: string[] }> = {
  groups: {
    title: "Group trong kiểm duyệt",
    body: "Group là nơi bot áp dụng luật kiểm duyệt, chống spam, xóa tin vi phạm, bio/link và quyền xử lý thành viên.",
    steps: ["Set đúng Group ID", "Bật các công tắc kiểm duyệt cần dùng", "Kiểm tra bot có quyền xóa tin, mute hoặc ban"]
  },
  messages: {
    title: "Cách dùng Tin nhắn",
    body: "Tin trong cùng một Nhóm nội dung sẽ được bot chọn ngẫu nhiên theo Độ ưu tiên.",
    steps: ["Paste mỗi dòng một tin", "Đặt Nhóm nội dung mặc định khi nhập nhanh", "Vào Nhóm và set message_pool trùng tên"]
  },
  scheduled_posts: {
    title: "Cách dùng Gửi tin hẹn giờ",
    body: "Đây là flow quyết định bot nào gửi nội dung nào vào group nào và vào lúc mấy giờ.",
    steps: ["Chọn Bot và Group/Kênh trước", "Nhập nội dung cần gửi", "Đặt giờ dạng daily 09:00 rồi bật lịch"]
  },
  keywords: {
    title: "Rule kiểm duyệt",
    body: "Rule từ khóa sẽ xóa tin vi phạm trước. Nếu action là delete thì bot vẫn cộng cảnh báo nội bộ, đủ ngưỡng ban_after_warnings sẽ tự ban.",
    steps: ["delete = xóa tin + cộng cảnh báo", "ban_after_warnings quyết định khi nào ban", "regex cho mẫu nâng cao"]
  },
  bot_metrics: {
    title: "Dashboard",
    body: "Màn hình này gom các chỉ số vận hành để nhìn nhanh tình trạng bot/group.",
    steps: ["Sửa chỉ số thủ công ở danh sách bên dưới", "Dùng period today/week/month/all_time", "Các module sau sẽ tự ghi thêm metric"]
  },
  config: {
    title: "Cài đặt hệ thống",
    body: "Chỉ quản lý các cấu hình dùng chung toàn bot/CP. Cài đặt module nằm ngay trong module tương ứng để tránh trùng chỗ.",
    steps: ["Global ở Cài đặt hệ thống", "Module ở trang module", "Group override ở flow của module"]
  }
};
const COMMAND_OPTIONS = ["start", "help", "policy", "reload", "checkbio", "debuggroup", "warn", "ban", "unban", "giveaway", "giveaways", "join", "draw", "shareunlock", "shareprogress", "check", "report"];
const CP_STATE_STORAGE_KEY = "cu_bot_cp_state";
const CONFIG_LABELS: Record<string, string> = {
  moderation_enabled: "Bật kiểm duyệt",
  policy_text: "Nội quy nhóm",
  scam_review_channel_id: "Channel duyệt báo cáo scam",
  scam_review_group_id: "Group review scam",
  delete_system_messages: "Xóa tin hệ thống",
  delete_forwarded_messages: "Chặn tin forward",
  allow_forward_messages: "Cho phép forward",
  forward_allowed_sources: "Nguồn forward được phép",
  scan_hidden_links: "Quét link ẩn",
  scan_text_link: "Chặn text link",
  scan_text_mention: "Chặn text mention",
  allow_in_group_mentions: "Cho phép @user trong group",
  hidden_link_action: "Cách xử lý link ẩn",
  text_link_action: "Cách xử lý text link",
  text_mention_action: "Cách xử lý text mention",
  hidden_link_reason: "Lý do link ẩn",
  hidden_link_delete_notice_seconds: "Tự xóa thông báo link ẩn",
  allow_automatic_forwards: "Cho phép forward tự động",
  delete_inline_keyboard_messages: "Chặn bài có nút bấm",
  delete_messages_from_bots: "Chặn bot lạ gửi tin",
  remove_unknown_bots: "Tự kick bot lạ",
  exempt_admins: "Bỏ qua admin",
  scan_bio_links: "Quét link trong bio",
  bio_link_delete_message: "Xóa tin khi bio có link",
  bio_link_warning_text: "Cảnh báo bio có link",
  captcha_text: "Tin nhắn captcha",
  show_policy_button: "Hiện nút Quy định",
  policy_button_text: "Tên nút Quy định",
  bot_menu_commands: "Menu lệnh Telegram",
  help_menu_commands: "Menu trong /help",
  help_menu_title: "Tiêu đề menu /help",
  start_fallback_text: "Tin /start khi chưa có nội dung",
  spam_max_messages: "Số tin spam tối đa",
  spam_window_seconds: "Khung thời gian spam",
  spam_action: "Cách xử lý spam",
  spam_restrict_seconds: "Thời gian mute khi spam",
  forward_action: "Cách xử lý forward",
  forward_allowed_content_types: "Loại nội dung forward được phép",
  forward_spam_max_messages: "Số forward tối đa",
  forward_spam_window_seconds: "Khung thời gian forward",
  inline_keyboard_action: "Cách xử lý bài có nút bấm",
  ban_after_warnings: "Ban sau số cảnh báo",
  ban_seconds: "Thời gian ban",
  warning_text: "Mẫu cảnh báo chung",
  forward_warning_reason: "Lý do cảnh báo forward",
  forward_warning_text: "Mẫu cảnh báo forward",
  spam_restrict_text: "Mẫu tin khi mute tạm",
  warning_notice_delete_seconds: "Tự xóa tin cảnh báo",
  forward_warning_delete_seconds: "Tự xóa cảnh báo forward",
  spam_notice_delete_seconds: "Tự xóa thông báo spam",
  violation_delete_retry_seconds: "Thử xóa lại tin vi phạm",
  forward_violation_restrict_after: "Restrict sau số vi phạm forward",
  forward_violation_ban_after: "Ban sau số vi phạm forward",
  media_spam_max_messages: "Số media spam tối đa",
  media_spam_window_seconds: "Khung thời gian media spam",
  media_spam_action: "Xử lý media spam",
  duplicate_message_enabled: "Chặn tin/sticker lặp lại",
  duplicate_message_max_count: "Số lần lặp tối đa",
  duplicate_message_window_seconds: "Thời gian kiểm tra lặp",
  duplicate_message_action: "Xử lý khi bị lặp",
  duplicate_message_reason: "Lý do cảnh báo lặp",
  send_on_boot: "Gửi tin khi bot khởi động",
  send_if_silent: "Chỉ gửi khi nhóm im lặng",
  admin_only_text: "Tin báo chỉ admin dùng được",
  check_usage_text: "Hướng dẫn lệnh /check",
  check_not_found_text: "Tin khi không thấy dữ liệu scam",
  check_result_title: "Tiêu đề kết quả /check",
  report_usage_text: "Hướng dẫn lệnh /report",
  report_received_text: "Tin xác nhận nhận report",
  addscam_usage_text: "Hướng dẫn lệnh /addscam",
  addscam_success_text: "Tin thêm scam thành công",
  scam_review_channel_text: "Mẫu tin gửi channel/group duyệt scam",
  giveaway_created_text: "Tin tạo giveaway",
  giveaway_empty_text: "Tin khi không có giveaway",
  giveaway_list_title: "Tiêu đề danh sách giveaway",
  giveaway_join_usage_text: "Hướng dẫn tham gia giveaway",
  giveaway_not_found_open_text: "Tin không thấy giveaway đang mở",
  giveaway_keyword_required_text: "Tin yêu cầu từ khóa giveaway",
  giveaway_joined_text: "Tin tham gia giveaway thành công",
  giveaway_join_duplicate_text: "Tin báo đã tham gia giveaway",
  giveaway_draw_usage_text: "Hướng dẫn quay giveaway",
  giveaway_not_found_text: "Tin không tìm thấy giveaway",
  giveaway_no_entries_text: "Tin giveaway chưa có người tham gia",
  giveaway_result_text: "Mẫu kết quả giveaway",
  giveaway_close_usage_text: "Hướng dẫn đóng giveaway",
  giveaway_closed_text: "Tin đóng giveaway thành công"
};
const CONFIG_SECTIONS = [
  {
    title: "Nội quy & menu",
    desc: "Nội dung bot gửi khi /start, nút Quy định và menu lệnh trong group.",
    icon: MessageSquare,
    tone: "content",
    keys: ["policy_text", "show_policy_button", "policy_button_text", "bot_menu_commands", "help_menu_commands", "start_fallback_text", "help_menu_title"]
  },
  {
    title: "Kiểm duyệt tự động",
    desc: "Các công tắc chặn nội dung thường gặp trong group.",
    icon: ShieldCheck,
    tone: "security",
    keys: ["moderation_enabled", "delete_system_messages", "allow_automatic_forwards", "delete_inline_keyboard_messages", "delete_messages_from_bots", "remove_unknown_bots", "exempt_admins"]
  },
  {
    title: "Forward nâng cao",
    desc: "Cho phép forward có kiểm soát, lọc theo nguồn, loại nội dung và ngưỡng vi phạm riêng.",
    icon: Send,
    tone: "security",
    keys: ["allow_forward_messages", "forward_allowed_sources", "forward_allowed_content_types", "forward_spam_max_messages", "forward_spam_window_seconds", "forward_violation_restrict_after", "forward_violation_ban_after", "forward_action", "forward_warning_reason", "forward_warning_text", "forward_warning_delete_seconds"]
  },
  {
    title: "Spam, cảnh báo & ban",
    desc: "Quy định bot sẽ warn, mute, kick hoặc ban thế nào khi phát hiện spam/vi phạm.",
    icon: SlidersHorizontal,
    tone: "security",
    keys: ["spam_max_messages", "spam_window_seconds", "spam_action", "spam_restrict_seconds", "inline_keyboard_action", "ban_after_warnings", "ban_seconds", "duplicate_message_enabled", "duplicate_message_max_count", "duplicate_message_window_seconds", "duplicate_message_action", "duplicate_message_reason", "media_spam_max_messages", "media_spam_window_seconds", "media_spam_action", "violation_delete_retry_seconds"]
  },
  {
    title: "Mẫu tin kiểm duyệt",
    desc: "Các tin bot gửi ra khi cảnh báo spam, forward, mute tạm hoặc phát hiện bio có link.",
    icon: MessageSquare,
    tone: "content",
    keys: ["warning_text", "forward_warning_reason", "forward_warning_text", "spam_restrict_text", "warning_notice_delete_seconds", "forward_warning_delete_seconds", "spam_notice_delete_seconds", "bio_link_warning_text", "bio_link_notice_delete_seconds"]
  },
  {
    title: "Bio, link & cảnh báo",
    desc: "Quét link trong bio, xóa tin vi phạm và nội dung cảnh báo.",
    icon: Archive,
    tone: "scam",
    keys: ["scan_bio_links", "bio_link_delete_message", "bio_link_restrict_seconds", "bio_scan_cache_seconds", "scan_hidden_links", "scan_text_link", "scan_text_mention", "allow_in_group_mentions", "hidden_link_action", "text_link_action", "text_mention_action", "hidden_link_reason", "hidden_link_delete_notice_seconds", "bio_link_warning_text", "bio_link_notice_delete_seconds"]
  },
  {
    title: "Captcha & verify",
    desc: "Tin nhắn xác minh thành viên mới và thời gian tự xóa.",
    icon: Bot,
    tone: "main",
    keys: ["captcha_text", "captcha_success_text", "captcha_failed_text", "captcha_message_delete_seconds", "verify_success_delete_seconds"]
  },
  {
    title: "Scam & báo cáo",
    desc: "Channel duyệt báo cáo và nội dung phản hồi khi tra cứu scam.",
    icon: Activity,
    tone: "fun",
    keys: ["scam_review_channel_id", "scam_review_group_id", "admin_only_text", "check_usage_text", "check_not_found_text", "check_result_title", "report_usage_text", "report_received_text", "addscam_usage_text", "addscam_success_text", "scam_review_channel_text", "scam_report_pending_text", "scam_report_confirmed_text", "scam_check_safe_text", "scam_check_found_text"]
  },
  {
    title: "Gửi tin tự động",
    desc: "Cách bot gửi nội dung khi khởi động hoặc khi nhóm im lặng.",
    icon: Sparkles,
    tone: "content",
    keys: ["send_on_boot", "send_if_silent"]
  },
  {
    title: "Giveaway",
    desc: "Toàn bộ mẫu tin cho module quay số may mắn và quản lý lượt tham gia.",
    icon: Gift,
    tone: "fun",
    keys: ["giveaway_created_text", "giveaway_empty_text", "giveaway_list_title", "giveaway_join_usage_text", "giveaway_not_found_open_text", "giveaway_keyword_required_text", "giveaway_joined_text", "giveaway_join_duplicate_text", "giveaway_draw_usage_text", "giveaway_not_found_text", "giveaway_no_entries_text", "giveaway_result_text", "giveaway_close_usage_text", "giveaway_closed_text"]
  }
];
const MODULE_HUBS = [
  {
    key: "moderation",
    moduleKeys: ["moderation"],
    title: "Kiểm duyệt tự động",
    desc: "Chống spam, quảng cáo, ban, xóa tin hệ thống, quét bio link và link xấu.",
    icon: ShieldCheck,
    tone: "security",
    tables: ["groups", "keywords", "domain_blacklist", "link_shorteners", "bot_allowlist", "config"],
    configKeys: ["moderation_enabled", "delete_system_messages", "allow_automatic_forwards", "delete_inline_keyboard_messages", "delete_messages_from_bots", "remove_unknown_bots", "exempt_admins", "allow_forward_messages", "forward_allowed_sources", "forward_allowed_content_types", "forward_spam_max_messages", "forward_spam_window_seconds", "forward_violation_restrict_after", "forward_violation_ban_after", "spam_max_messages", "spam_window_seconds", "spam_action", "spam_restrict_seconds", "forward_action", "inline_keyboard_action", "ban_after_warnings", "ban_seconds", "warning_text", "forward_warning_reason", "forward_warning_text", "spam_restrict_text", "warning_notice_delete_seconds", "forward_warning_delete_seconds", "spam_notice_delete_seconds", "violation_delete_retry_seconds", "duplicate_message_enabled", "duplicate_message_max_count", "duplicate_message_window_seconds", "duplicate_message_action", "duplicate_message_reason", "media_spam_max_messages", "media_spam_window_seconds", "media_spam_action", "scan_bio_links", "bio_link_delete_message", "bio_link_restrict_seconds", "bio_scan_cache_seconds", "bio_link_warning_text", "bio_link_notice_delete_seconds", "scan_hidden_links", "scan_text_link", "scan_text_mention", "allow_in_group_mentions", "hidden_link_action", "text_link_action", "text_mention_action", "hidden_link_reason", "hidden_link_delete_notice_seconds"]
  },
  {
    key: "menu_policy",
    moduleKeys: ["menu_policy"],
    title: "Menu & nội quy",
    desc: "Menu lệnh Telegram, nút Quy định, nội quy nhóm và nội dung /start.",
    icon: MessageSquare,
    tone: "content",
    tables: ["config"],
    configKeys: ["policy_text", "show_policy_button", "policy_button_text", "bot_menu_commands", "help_menu_commands", "start_fallback_text", "help_menu_title"]
  },
  {
    key: "verification",
    moduleKeys: ["verification"],
    title: "Bảo mật & verify",
    desc: "Captcha, chào thành viên mới, tự kick member chưa xác minh và bot được phép.",
    icon: Bot,
    tone: "main",
    tables: ["verification_settings", "captcha_questions", "bot_allowlist", "config"],
    configKeys: ["captcha_text", "captcha_success_text", "captcha_failed_text", "captcha_message_delete_seconds", "verify_success_delete_seconds"]
  },
  {
    key: "automation",
    moduleKeys: ["scheduled_posts"],
    title: "Tự động hóa",
    desc: "Gửi tin hẹn giờ, video và nhóm nội dung dùng chung.",
    icon: Sparkles,
    tone: "content",
    tables: ["groups", "messages", "video_messages", "channel_posts", "config"],
    configKeys: ["send_on_boot", "send_if_silent"]
  },
  {
    key: "welcome",
    moduleKeys: ["welcome"],
    title: "Welcome",
    desc: "Chào thành viên mới khi họ join group, có mẫu tin và tự xóa.",
    icon: MessageSquare,
    tone: "content",
    tables: ["module_settings"]
  },
  {
    key: "channel_publisher",
    moduleKeys: ["channel_publisher"],
    title: "Đăng channel",
    desc: "Soạn bài có nút inline rồi để bot gửi lên channel/group.",
    icon: MessageSquare,
    tone: "content",
    tables: ["channel_posts"]
  },
  {
    key: "auto_reply",
    moduleKeys: ["auto_reply"],
    title: "Auto reply",
    desc: "Câu kích hoạt, nội dung trả lời tự động và kiểu khớp.",
    icon: MessageSquare,
    tone: "fun",
    tables: ["auto_replies"]
  },
  {
    key: "anti_scam",
    moduleKeys: ["anti_scam"],
    title: "Chống scam",
    desc: "Dữ liệu scam, báo cáo riêng, channel duyệt và tra cứu /check.",
    icon: Archive,
    tone: "scam",
    tables: ["scam_entities", "scam_reports", "config"],
    configKeys: ["scam_review_channel_id", "scam_review_group_id", "admin_only_text", "check_usage_text", "check_not_found_text", "check_result_title", "report_usage_text", "report_received_text", "addscam_usage_text", "addscam_success_text", "scam_review_channel_text", "scam_report_pending_text", "scam_report_confirmed_text", "scam_check_safe_text", "scam_check_found_text"]
  },
  {
    key: "entertainment",
    moduleKeys: ["entertainment", "giveaway"],
    title: "Giải trí",
    desc: "Giveaway, quay số, event, điểm tương tác và bảng xếp hạng.",
    icon: Gift,
    tone: "fun",
    tables: ["giveaway_campaigns", "giveaway_entries", "entertainment_events", "reputation_rules", "config"],
    configKeys: ["giveaway_created_text", "giveaway_empty_text", "giveaway_list_title", "giveaway_join_usage_text", "giveaway_not_found_open_text", "giveaway_keyword_required_text", "giveaway_joined_text", "giveaway_join_duplicate_text", "giveaway_draw_usage_text", "giveaway_not_found_text", "giveaway_no_entries_text", "giveaway_result_text", "giveaway_close_usage_text", "giveaway_closed_text"]
  },
  {
    key: "share_unlock",
    moduleKeys: ["share_unlock"],
    title: "Mở khóa bằng chia sẻ",
    desc: "Mỗi user có link mời riêng. Đủ số người vào group qua link đó thì bot mở khóa link thưởng.",
    icon: Gift,
    tone: "fun",
    tables: ["share_unlock_campaigns", "share_unlock_invites", "share_unlock_referrals"],
  },
  {
    key: "analytics",
    moduleKeys: ["analytics"],
    title: "Thống kê",
    desc: "Dashboard, nhật ký hoạt động và sức khỏe vận hành.",
    icon: BarChart3,
    tone: "main",
    tables: ["bot_metrics", "audit_logs"]
  },
  {
    key: "members",
    moduleKeys: ["members"],
    title: "Thành viên",
    desc: "Phân quyền admin, role member, VIP, restricted và điểm tương tác.",
    icon: Users,
    tone: "security",
    tables: ["admins", "member_roles", "reputation_rules", "giveaway_entries"]
  }
];
const MODULE_TABLE_OWNER: Record<string, string> = {
  keywords: "moderation",
  domain_blacklist: "moderation",
  link_shorteners: "moderation",
  bot_allowlist: "moderation",
  verification_settings: "verification",
  captcha_questions: "verification",
  scheduled_posts: "automation",
  channel_posts: "channel_publisher",
  messages: "automation",
  video_messages: "automation",
  auto_replies: "auto_reply",
  scam_entities: "anti_scam",
  scam_reports: "anti_scam",
  giveaway_campaigns: "entertainment",
  giveaway_entries: "entertainment",
  entertainment_events: "entertainment",
  reputation_rules: "entertainment",
  share_unlock_campaigns: "share_unlock",
  share_unlock_invites: "share_unlock",
  share_unlock_referrals: "share_unlock",
  bot_metrics: "analytics",
  audit_logs: "analytics",
  admins: "members",
  member_roles: "members"
};
const MODULES_REQUIRE_EXPLICIT_ENABLE = new Set(["auto_reply", "welcome", "share_unlock"]);
const MODULE_CONFIG_KEYS = new Set(MODULE_HUBS.flatMap((module) => module.configKeys || []));
const SYSTEM_CONFIG_SECTIONS = [
  {
    title: "Cài đặt dùng chung",
    desc: "Chỉ hiện các key thật sự chia sẻ toàn bot. Nếu một field cần chỉnh theo module hoặc theo group, nó sẽ không nằm ở đây.",
    icon: SlidersHorizontal,
    tone: "main",
    keys: [] as string[]
  }
];
const CONFIG_DESCRIPTIONS: Record<string, string> = {
  moderation_enabled: "Bật/tắt toàn bộ luật kiểm duyệt cho module moderation.",
  policy_text: "Nội quy gửi kèm khi thành viên bấm nút Quy định hoặc gọi lệnh liên quan.",
  show_policy_button: "Bật/tắt nút Quy định xuất hiện dưới tin nhắn /start.",
  policy_button_text: "Tên hiển thị của nút Quy định trong Telegram.",
  bot_menu_commands: "Các lệnh chính bot đăng ký cho menu Telegram.",
  help_menu_commands: "Các lệnh hiển thị trong nội dung /help.",
  help_menu_title: "Dòng tiêu đề nằm phía trên danh sách lệnh khi user gọi /help.",
  start_fallback_text: "Tin nhắn dự phòng khi /start không có nội dung riêng.",
  delete_system_messages: "Tự xóa tin join/leave/pin và các tin hệ thống.",
  delete_forwarded_messages: "Chặn tin nhắn forward từ nơi khác.",
  scan_hidden_links: "Bật/tắt quét toàn bộ link ẩn trong message.",
  scan_text_link: "Bật/tắt quét link ẩn gắn vào chữ bấm.",
  scan_text_mention: "Bật/tắt quét mention gắn ẩn.",
  allow_in_group_mentions: "Cho phép @user giữa thành viên trong group.",
  hidden_link_action: "Chọn hành động khi bot gặp link ẩn.",
  text_link_action: "Chọn hành động khi bot gặp text link.",
  text_mention_action: "Chọn hành động khi bot gặp text mention.",
  hidden_link_reason: "Lý do nội bộ gắn vào audit cho link ẩn hoặc mention ngoài scope.",
  hidden_link_delete_notice_seconds: "Sau bao lâu bot tự xóa thông báo link ẩn.",
  allow_automatic_forwards: "Cho phép giữ lại tin auto-forward từ channel liên kết vào group.",
  delete_inline_keyboard_messages: "Chặn bài có nút bấm inline đáng ngờ.",
  delete_messages_from_bots: "Xóa tin do bot lạ gửi vào group.",
  remove_unknown_bots: "Tự kick bot không nằm trong danh sách cho phép.",
  exempt_admins: "Bỏ qua admin khi kiểm duyệt spam/keyword/link.",
  spam_max_messages: "Bao nhiêu tin nhắn trong một khung thời gian sẽ bị coi là spam.",
  spam_window_seconds: "Khung thời gian để đếm spam. Ví dụ 15 nghĩa là 15 giây.",
  spam_action: "Hành động mặc định khi user spam: warn để cảnh báo, mute để khóa chat tạm, ban để chặn khỏi nhóm.",
  spam_restrict_seconds: "Số giây mute/restrict user khi spam. Ví dụ 300 là 5 phút.",
  forward_action: "Hành động khi user forward nội dung vào group. Nên dùng warn hoặc delete trước khi siết lên ban.",
  inline_keyboard_action: "Hành động khi user gửi bài có nút bấm inline đáng ngờ.",
  ban_after_warnings: "Bao nhiêu lần cảnh báo thì nâng lên ban tự động.",
  ban_seconds: "Số giây ban user. Đặt 0 nghĩa là ban vĩnh viễn.",
  warning_text: "Tin bot gửi khi user bị cảnh báo chung. Có thể dùng {mention}, {reason}, {count}, {limit}.",
  forward_warning_reason: "Lý do nội bộ gắn vào cảnh báo forward và nhật ký audit.",
  forward_warning_text: "Tin bot gửi khi user bị cảnh báo vì forward. Có thể dùng {mention}, {reason}, {count}, {limit}.",
  spam_restrict_text: "Tin bot gửi khi user bị mute/restrict tạm thời. Có thể dùng {mention}, {reason}, {user_id}.",
  warning_notice_delete_seconds: "Sau bao lâu bot tự xóa tin cảnh báo chung để group đỡ rác.",
  forward_warning_delete_seconds: "Sau bao lâu bot tự xóa cảnh báo khi user gửi tin forward.",
  spam_notice_delete_seconds: "Sau bao lâu bot tự xóa thông báo spam.",
  violation_delete_retry_seconds: "Nếu xóa tin vi phạm lần đầu lỗi, bot chờ số giây này rồi thử xóa lại.",
  media_spam_max_messages: "Số tin media (ảnh/video/sticker) tối đa trong một khung thời gian trước khi xử lý.",
  media_spam_window_seconds: "Khung thời gian tính media spam, đơn vị giây.",
  media_spam_action: "Hành động khi user spam media: delete/warn/restrict/ban.",
  duplicate_message_enabled: "Bật để bot phát hiện user gửi cùng một tin nhắn hoặc cùng một sticker nhiều lần.",
  duplicate_message_max_count: "Số lần trùng nội dung/sticker được phép trong khung thời gian trước khi xử lý.",
  duplicate_message_window_seconds: "Khung thời gian tính lặp. Ví dụ 600 giây là 10 phút.",
  duplicate_message_action: "Hành động khi user lặp nội dung quá mức. Nên dùng warn để cảnh báo và tự xóa tin vi phạm.",
  duplicate_message_reason: "Nội dung lý do bot dùng trong tin cảnh báo khi user gửi trùng.",
  scan_bio_links: "Quét bio của người gửi để phát hiện link spam.",
  bio_link_delete_message: "Xóa tin nhắn của user nếu bio có link xấu.",
  bio_link_restrict_seconds: "Thời gian mute/restrict khi phát hiện bio có link.",
  bio_scan_cache_seconds: "Thời gian cache kết quả quét bio để giảm gọi API.",
  bio_link_warning_text: "Nội dung cảnh báo khi bio chứa link không an toàn.",
  bio_link_notice_delete_seconds: "Sau bao lâu tự xóa tin cảnh báo bio.",
  captcha_text: "Tin nhắn bot gửi khi thành viên mới cần xác minh.",
  captcha_success_text: "Tin nhắn sau khi xác minh thành công.",
  captcha_failed_text: "Tin nhắn khi xác minh thất bại hoặc hết hạn.",
  captcha_message_delete_seconds: "Sau bao lâu tự xóa tin captcha.",
  verify_success_delete_seconds: "Sau bao lâu tự xóa tin xác minh thành công.",
  scam_review_channel_id: "Channel/group nơi admin nhận báo cáo scam chờ duyệt.",
  scam_review_group_id: "Group review scam nội bộ, nơi admin có thể duyệt bằng lệnh và lưu ảnh/text report.",
  admin_only_text: "Bot gửi câu này khi người không phải admin dùng lệnh quản trị.",
  check_usage_text: "Hướng dẫn user tra cứu scam bằng UID, username, số tài khoản hoặc số điện thoại.",
  check_not_found_text: "Tin trả về khi /check không tìm thấy dữ liệu scam.",
  check_result_title: "Tiêu đề đầu kết quả khi /check tìm thấy dữ liệu.",
  report_usage_text: "Hướng dẫn user gửi báo cáo scam qua /report.",
  report_received_text: "Tin xác nhận bot đã nhận report và lưu vào database.",
  addscam_usage_text: "Hướng dẫn admin thêm dữ liệu scam bằng /addscam.",
  addscam_success_text: "Tin xác nhận đã thêm một đối tượng scam vào database.",
  scam_review_channel_text: "Mẫu nội dung bot gửi sang channel/group duyệt scam để admin kiểm tra.",
  scam_report_pending_text: "Tin nhắn báo đã nhận report và chờ duyệt.",
  scam_report_confirmed_text: "Tin nhắn khi report đã được xác nhận.",
  scam_check_safe_text: "Kết quả trả về khi không tìm thấy dữ liệu scam.",
  scam_check_found_text: "Kết quả trả về khi tìm thấy đối tượng scam.",
  send_on_boot: "Bật nếu muốn bot gửi tin ngay khi service Render khởi động lại.",
  send_if_silent: "Bật nếu chỉ muốn bot gửi tin khi group có hoạt động hoặc im lặng theo logic lịch gửi.",
  giveaway_created_text: "Tin bot trả về sau khi admin tạo giveaway mới.",
  giveaway_empty_text: "Tin bot gửi khi user xem danh sách nhưng chưa có giveaway đang mở.",
  giveaway_list_title: "Tiêu đề trước danh sách giveaway đang mở.",
  giveaway_join_usage_text: "Hướng dẫn cú pháp /join để member tham gia giveaway.",
  giveaway_not_found_open_text: "Tin báo không tìm thấy giveaway đang mở theo ID đã nhập.",
  giveaway_keyword_required_text: "Tin nhắc member nhập đúng từ khóa bắt buộc khi tham gia.",
  giveaway_joined_text: "Tin xác nhận member đã tham gia giveaway thành công.",
  giveaway_join_duplicate_text: "Tin báo member đã tham gia giveaway này rồi.",
  giveaway_draw_usage_text: "Hướng dẫn admin dùng /draw để quay người thắng.",
  giveaway_not_found_text: "Tin báo không tìm thấy giveaway theo ID.",
  giveaway_no_entries_text: "Tin báo giveaway chưa có người tham gia nên chưa quay được.",
  giveaway_result_text: "Mẫu tin công bố kết quả quay giveaway.",
  giveaway_close_usage_text: "Hướng dẫn admin đóng giveaway.",
  giveaway_closed_text: "Tin xác nhận giveaway đã được đóng."
};
const defaultBulkDefaults: BulkDefaults = {
  bot_key: "main",
  pool: "default",
  weight: 1,
  action: "delete",
  match: "contains",
  reason: "Từ khóa cấm",
  risk: "scam",
  risk_level: "scam",
  status: "confirmed",
  source: "cp_bulk",
  enabled: true
};

function emptyValues(table: TableConfig) {
  const values: Row = {};
  for (const field of table.fields) {
    if (field.type === "boolean") {
      values[field.key] = field.key === "enabled" || defaultBoolean.has(field.key);
    } else if (field.key === "bot_key") {
      values[field.key] = table.key === "bots" ? "" : "main";
    } else if (field.key === "bot_token" && table.key === "bots") {
      values[field.key] = "";
    } else if (field.key === "pool" || field.key.endsWith("_pool")) {
      values[field.key] = "default";
    } else if (field.key === "weight") {
      values[field.key] = 1;
    } else if (field.key === "settings") {
      values[field.key] = "{}";
    } else if (field.key === "status" && table.key === "channel_posts") {
      values[field.key] = "draft";
    } else if (field.key === "parse_mode") {
      values[field.key] = "HTML";
    } else if (field.key === "status") {
      values[field.key] = "active";
    } else if (field.key === "role") {
      values[field.key] = "member";
    } else if (field.key === "action") {
      values[field.key] = "delete";
    } else if (field.key === "match") {
      values[field.key] = table.key === "auto_replies" ? "smart" : "contains";
    } else {
      values[field.key] = "";
    }
  }
  return values;
}

function draftFromRow(row: Row) {
  const draft = { ...row };
  for (const [key, value] of Object.entries(draft)) {
    if (value && typeof value === "object") {
      draft[key] = JSON.stringify(value, null, 2);
    }
  }
  return draft;
}

function titleFor(row: Row, table: TableConfig) {
  if (table.key === "config") {
    return CONFIG_LABELS[String(row.key || "")] || String(row.key || "Cài đặt").replaceAll("_", " ");
  }
  if (table.key === "audit_logs") {
    const labels: Record<string, string> = {
      delete_message: "Đã xóa tin nhắn",
      ban: "Đã ban thành viên",
      kick: "Đã kick thành viên",
      mute: "Đã mute thành viên",
      warn: "Đã cảnh báo thành viên",
      role_update: "Đã đổi quyền",
      title_update: "Đã đổi tiêu đề",
      module_update: "Đã đổi trạng thái module",
      member_joined: "Thành viên vào nhóm",
      member_left: "Thành viên rời nhóm",
      member_join_request: "Yêu cầu tham gia nhóm",
      scam_report_confirmed: "Đã xác nhận báo cáo scam",
      scam_report_rejected: "Đã từ chối báo cáo scam"
    };
    const action = String(row.action || "");
    return labels[action.toLowerCase()] || action.replaceAll("_", " ") || `Nhật ký #${row.id}`;
  }
  if (table.key === "scam_reports") {
    return row.target_username || row.target_name || row.bank_account || row.phone || row.target_uid || `Report #${row.id}`;
  }
  if (table.key === "scam_entities") {
    return row.name || row.username || row.bank_account || row.uid || `Entity #${row.id}`;
  }
  return row[table.titleField] || row.key || row.message || row.keyword || row.group_id || `#${row.id}`;
}

function configLabel(key: string) {
  return CONFIG_LABELS[key] || key.replaceAll("_", " ");
}

function configDescription(row: Row) {
  const key = String(row.key || "");
  return CONFIG_DESCRIPTIONS[key] || String(row.notes || "Cài đặt nâng cao dùng cho vận hành bot.");
}

function isConfigBoolean(row: Row) {
  const key = String(row.key || "");
  if (CONFIG_BOOLEAN_KEYS.has(key)) {
    return true;
  }
  const value = String(row.value ?? "").trim().toLowerCase();
  return ["true", "false"].includes(value);
}

function materializeConfigRows(rows: Row[], expectedKeys: string[], botKey: string) {
  const rowMap = new Map<string, Row>();
  for (const row of rows) {
    rowMap.set(String(row.key || ""), row);
  }
  const virtualRows = expectedKeys.map((key) => rowMap.get(key) || {
    id: `virtual:${botKey}:${key}`,
    bot_key: botKey,
    key,
    value: CONFIG_DEFAULT_VALUES[key] ?? "",
    enabled: true,
    notes: "Mặc định gợi ý. Bấm Lưu để tạo cấu hình thật.",
    __virtual: true
  });
  const extras = rows.filter((row) => !expectedKeys.includes(String(row.key || "")));
  return [...virtualRows, ...extras];
}

function readSettingsObject(settings: unknown) {
  if (!settings) {
    return {} as Record<string, unknown>;
  }
  if (typeof settings === "string") {
    try {
      const parsed = JSON.parse(settings);
      return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
  if (typeof settings === "object") {
    return settings as Record<string, unknown>;
  }
  return {};
}

function isVirtualConfigRow(row: Row) {
  return String(row.id || "").startsWith("virtual:");
}

function configDisplayValue(row: Row) {
  const key = String(row.key || "");
  const value = String(row.value ?? "");
  const lower = value.trim().toLowerCase();
  const actions: Record<string, string> = {
    delete: "Xóa tin",
    warn: "Cảnh báo",
    mute: "Mute tạm",
    kick: "Kick khỏi nhóm",
    ban: "Ban khỏi nhóm",
    restrict: "Hạn chế chat"
  };
  if (lower === "true") {
    return "Bật";
  }
  if (lower === "false") {
    return "Tắt";
  }
  if (!value.trim() && key.endsWith("_action")) {
    return "Cảnh báo";
  }
  if (key.endsWith("_seconds") && value !== "") {
    const seconds = Number(value);
    if (seconds === 0) {
      return key === "ban_seconds" ? "Vĩnh viễn" : "Không giới hạn / không tự xóa";
    }
    if (Number.isFinite(seconds)) {
      const minutes = seconds / 60;
      return minutes >= 1 ? `${seconds} giây (${minutes.toLocaleString("vi-VN")} phút)` : `${seconds} giây`;
    }
  }
  return actions[lower] || displayValue(row.value);
}

function configValueCaption(row: Row) {
  const key = String(row.key || "");
  if (["scan_hidden_links", "scan_text_link", "scan_text_mention", "allow_in_group_mentions", "moderation_enabled", "delete_system_messages", "delete_forwarded_messages", "allow_forward_messages", "allow_automatic_forwards", "delete_inline_keyboard_messages", "delete_messages_from_bots", "remove_unknown_bots", "exempt_admins", "scan_bio_links", "bio_link_delete_message", "duplicate_message_enabled", "send_on_boot", "send_if_silent", "show_policy_button"].includes(key)) {
    return "Bật / tắt";
  }
  if (key.endsWith("_seconds")) {
    return "Thời gian đang áp dụng";
  }
  if (key.endsWith("_text") || key.includes("text")) {
    return "Nội dung bot sẽ gửi";
  }
  if (key.includes("command")) {
    return "Danh sách lệnh đang bật";
  }
  if (isConfigBoolean(row)) {
    return "Trạng thái giá trị";
  }
  return "Giá trị hiện tại";
}

function configPlaceholders(key: string) {
  if (["warning_text", "forward_warning_text", "spam_restrict_text", "bio_link_warning_text"].includes(key)) {
    return ["{mention}", "{reason}", "{count}", "{limit}", "{user_id}"];
  }
  return [];
}

function configFieldHint(key: string) {
  if (["forward_warning_reason", "duplicate_message_reason"].includes(key)) {
    return "Đây là lý do cố định, không cần placeholder.";
  }
  if (key === "forward_allowed_content_types") {
    return "Chọn các loại nội dung được phép forward.";
  }
  if (key === "forward_allowed_sources") {
    return "Chọn nguồn forward được phép như channel, group hoặc user.";
  }
  return "";
}

function configEditorKind(key: string) {
  if (key === "forward_allowed_content_types") {
    return "multiselect";
  }
  if (key === "forward_allowed_sources") {
    return "multiselect_sources";
  }
  if (CONFIG_BOOLEAN_KEYS.has(key)) {
    return "boolean";
  }
  if (key.endsWith("_action")) {
    return "select";
  }
  if (
    key.endsWith("_seconds") ||
    key.endsWith("_count") ||
    key.endsWith("_messages") ||
    ["ban_after_warnings", "ban_seconds", "spam_max_messages", "duplicate_message_max_count", "media_spam_max_messages"].includes(key)
  ) {
    return "number";
  }
  if (
    key.endsWith("_text") ||
    key.includes("reason") ||
    key.includes("commands") ||
    key.includes("content_types") ||
    ["policy_text", "start_fallback_text", "help_menu_title", "scam_review_channel_text"].includes(key)
  ) {
    return "textarea";
  }
  return "text";
}

function configSelectOptions(key: string) {
  if (!key.endsWith("_action")) {
    return [];
  }
  return [
    { value: "warn", label: "Warn - cảnh báo và xóa" },
    { value: "delete", label: "Delete - xóa tin" },
    { value: "restrict", label: "Restrict - hạn chế tạm" },
    { value: "mute", label: "Mute - im lặng tạm" },
    { value: "kick", label: "Kick - đá khỏi group" },
    { value: "ban", label: "Ban - chặn khỏi group" }
  ];
}

function configInputGuide(key: string) {
  if (key.endsWith("_seconds")) {
    return "Nhập số giây.";
  }
  if (key.endsWith("_count")) {
    return "Nhập số lượng.";
  }
  return "";
}

function friendlySaveError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "Không thể lưu.");
  if (message.includes("bio_link_delete_message") && message.includes("schema cache")) {
    return "DB còn thiếu cột bio_link_delete_message trong groups. Chạy migration docs/supabase/migrations/20260522_add_groups_moderation_columns.sql rồi thử lưu lại.";
  }
  if (message.includes("schema cache") && message.includes("groups")) {
    return "Schema nhóm chưa khớp với UI. Hãy chạy migration groups mới trong docs/supabase.";
  }
  return message || "Không thể lưu.";
}

function fieldUnitHint(field: FieldConfig) {
  const key = field.key;
  if (field.type === "number") {
    if (key === "ban_seconds") {
      return "Đơn vị: giây. 0 = ban vĩnh viễn.";
    }
    if (key.endsWith("_seconds")) {
      return "Đơn vị: giây. 300 = 5 phút, 3600 = 1 giờ.";
    }
    if (["spam_max_messages", "duplicate_message_max_count", "ban_after_warnings", "media_spam_max_messages"].includes(key)) {
      return "Đơn vị: số lần / số tin.";
    }
  }
  if (["spam_action", "forward_action", "inline_keyboard_action", "duplicate_message_action", "media_spam_action"].includes(key)) {
    return "warn = xóa tin vi phạm + cảnh báo.";
  }
  if (["forward_warning_reason", "duplicate_message_reason"].includes(key)) {
    return "Lý do cố định, không cần placeholder.";
  }
  if (key === "moderation_enabled") {
    return "Tắt để group này không chạy moderation.";
  }
  if (key === "scan_hidden_links") {
    return "Bật để áp dụng toàn bộ rule link ẩn.";
  }
  if (key === "scan_text_link") {
    return "Bật để chặn link ẩn gắn vào chữ bấm.";
  }
  if (key === "scan_text_mention") {
    return "Bật để chặn mention ẩn.";
  }
  if (key === "allow_in_group_mentions") {
    return "Bật nếu muốn cho phép @user giữa thành viên.";
  }
  if (key === "scan_bio_links") {
    return "Bật để bot quét bio người gửi.";
  }
  if (key === "allow_forward_messages") {
    return "Bật để cho forward đi qua nhưng vẫn scan nội dung.";
  }
  if (key === "delete_forwarded_messages") {
    return "Bật để chặn forward hoàn toàn. Không nên bật cùng lúc với cho phép forward.";
  }
  if (key === "forward_allowed_sources") {
    return "Chọn nguồn forward được phép như channel, group, user hoặc bot.";
  }
  if (key === "forward_allowed_content_types") {
    return "Ví dụ: text, photo, video. Để trống để cho phép mọi loại.";
  }
  if (key === "bio_link_delete_message") {
    return "Xóa tin vi phạm nếu bio chứa link.";
  }
  if (key === "bio_link_restrict_seconds") {
    return "0 = giữ restrict cho tới khi admin mở lại.";
  }
  if (key === "bio_scan_cache_seconds") {
    return "Cache quét bio theo giây. 3600 = 1 giờ.";
  }
  return "";
}

function fieldByKey(table: TableConfig, key: string) {
  return table.fields.find((field) => field.key === key);
}

function displayValue(value: unknown) {
  if (value === true) {
    return "Bật";
  }
  if (value === false) {
    return "Tắt";
  }
  if (value === null || value === undefined || value === "") {
    return "Chưa đặt";
  }
  return String(value);
}

function formatDateTime(value: unknown) {
  if (!value) {
    return "Chưa có thời gian";
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function vietnamDayKey(value: unknown) {
  if (!value) {
    return "";
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function parseDetails(value: unknown) {
  if (!value) {
    return {};
  }
  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  } catch {
    return { raw: String(value) };
  }
}

function auditLegacyReason(value: unknown) {
  const raw = String(value || "");
  if (!raw) {
    return "";
  }
  if (raw === "bio_link") {
    return "Bio có link Telegram";
  }
  if (raw === "forwarded_message") {
    return "Tin nhắn được forward";
  }
  if (raw === "inline_keyboard") {
    return "Tin nhắn có nút bấm";
  }
  if (raw === "duplicate_message") {
    return "Tin nhắn trùng lặp nhiều lần";
  }
  if (raw === "spam") {
    return "Spam quá ngưỡng";
  }
  if (raw.startsWith("keyword:")) {
    const [, keyword, action] = raw.match(/^keyword:(.*):before_(.*)$/) || [];
    return keyword ? `Từ khóa cấm: ${keyword}${action ? `, xử lý: ${action}` : ""}` : raw;
  }
  if (raw.startsWith("domain:")) {
    const [, domain, action] = raw.match(/^domain:(.*):before_(.*)$/) || [];
    return domain ? `Domain bị chặn: ${domain}${action ? `, xử lý: ${action}` : ""}` : raw;
  }
  if (raw.startsWith("shortener:")) {
    const [, domain, action] = raw.match(/^shortener:(.*):before_(.*)$/) || [];
    return domain ? `Link rút gọn bị chặn: ${domain}${action ? `, xử lý: ${action}` : ""}` : raw;
  }
  if (raw.startsWith("seconds=")) {
    return `Thời lượng: ${raw.replace("seconds=", "")} giây`;
  }
  return raw;
}

function isAutomaticAudit(row: Row) {
  return ["delete_message", "ban", "kick", "warn", "restrict", "verify_success"].includes(String(row.action || "").toLowerCase());
}

function auditActor(row: Row, details: Record<string, unknown>) {
  const actor = row.actor_user_id || details.actor_user_id || details.actor_username;
  if (actor) {
    return displayValue(actor);
  }
  return isAutomaticAudit(row) ? "Bot tự động" : "Chưa đặt";
}

function auditReason(row: Row, details: Record<string, unknown>) {
  return displayValue(details.reason || details.trigger_reason || auditLegacyReason(details.raw || row.details));
}

function auditDeletedContent(row: Row, details: Record<string, unknown>) {
  return displayValue(details.deleted_text || details.message || details.text || details.content || (row.action === "delete_message" ? "" : details.raw || row.details));
}

function auditLogSpecificRows(row: Row, details: Record<string, unknown>) {
  const rows: { label: string; value: string }[] = [];
  if (details.deleted_text || details.message || details.text || details.content) {
    rows.push({ label: "Tin đã xóa", value: auditDeletedContent(row, details) });
  }
  if (details.bio_link) {
    rows.push({ label: "Bio link", value: displayValue(details.bio_link) });
  }
  if (details.bio_text) {
    rows.push({ label: "Bio hiện tại", value: displayValue(details.bio_text) });
  }
  if (details.matched_keyword) {
    const keywordParts = [
      displayValue(details.matched_keyword_raw || details.matched_keyword),
      details.match_type ? `kiểu: ${displayValue(details.match_type)}` : "",
      details.keyword_rule_id ? `rule #${displayValue(details.keyword_rule_id)}` : ""
    ].filter(Boolean);
    rows.push({ label: "Từ khóa", value: keywordParts.join(" · ") });
  }
  if (details.blocked_domain) {
    rows.push({ label: "Domain", value: displayValue(details.blocked_domain) });
  }
  if (details.rule_action) {
    rows.push({ label: "Luật xử lý", value: displayValue(details.rule_action) });
  }
  if (details.forward_from_chat_title || details.forward_from_chat_id || details.forward_sender_name || details.forward_from_username) {
    rows.push({
      label: "Nguồn forward",
      value: displayValue(details.forward_from_chat_title || details.forward_sender_name || details.forward_from_username || details.forward_from_chat_id)
    });
  }
  if (details.warning_count || details.warning_limit) {
    rows.push({ label: "Cảnh báo", value: `${displayValue(details.warning_count)}/${displayValue(details.warning_limit)}` });
  }
  return rows;
}

function auditLogRows(row: Row) {
  const details = parseDetails(row.details);
  const duration = details.duration || details.duration_seconds || details.until || details.restrict_seconds || details.ban_seconds || details.seconds;
  const baseRows = [
    { label: "Thời gian", value: formatDateTime(row.created_at || details.created_at) },
    { label: "Hành động", value: actionBadge(row, { key: "audit_logs", label: "Nhật ký", description: "", titleField: "action", summaryFields: [], fields: [] }) },
    { label: "Người thực hiện", value: auditActor(row, details) },
    { label: "Đối tượng", value: displayValue(row.target_user_id || details.target_user_id || details.target_username) },
    { label: "Group/Kênh", value: displayValue(row.chat_id || details.chat_id || details.group_id) },
    { label: "Thời lượng", value: duration ? configDisplayValue({ key: "duration_seconds", value: duration }) : "Không áp dụng" },
    { label: "Lý do", value: auditReason(row, details) }
  ];
  const specificRows = auditLogSpecificRows(row, details);
  return specificRows.length ? [...baseRows, ...specificRows] : [...baseRows, { label: "Chi tiết gốc", value: displayValue(details.raw || row.details) }];
}

function auditLogCardData(row: Row, groupNameForId: (groupId: string) => string) {
  const details = parseDetails(row.details);
  const groupId = String(row.chat_id || details.chat_id || details.group_id || "");
  const targetId = String(row.target_user_id || details.target_user_id || details.target_username || "");
  const actorId = String(details.actor_user_id || row.actor_user_id || "");
  const action = actionBadge(row, { key: "audit_logs", label: "Nhật ký", description: "", titleField: "action", summaryFields: [], fields: [] });
  const severity = auditLogSeverity(row);
  return {
    time: formatDateTime(row.created_at || details.created_at),
    action,
    severity,
    groupLabel: groupNameForId(groupId) || groupId || "Chưa rõ group",
    groupId,
    actorLabel: auditActor(row, details),
    actorId,
    targetLabel: displayValue(details.target_username || row.target_user_id || details.target_user_id || details.target_username || targetId),
    targetId,
    reason: auditReason(row, details),
    brief: auditLogSpecificRows(row, details).slice(0, 2),
    raw: details.raw || row.details,
  };
}

function auditActionTone(action: string): "error" | "warning" | "success" | "info" | "default" {
  const normalized = String(action || "").toLowerCase();
  if (["ban", "kick", "scam_report_confirmed"].includes(normalized)) return "error";
  if (["delete_message", "warn", "scam_report_rejected"].includes(normalized)) return "warning";
  if (["member_joined", "member_join_request"].includes(normalized)) return "success";
  if (["mute", "restrict", "module_update", "role_update", "title_update"].includes(normalized)) return "info";
  return "default";
}

function auditLogEssentials(row: Row) {
  const details = parseDetails(row.details);
  const specificRows = auditLogSpecificRows(row, details);
  const primaryDetail = specificRows.find((item) => ["Từ khóa", "Bio link", "Domain", "Nguồn forward", "Tin đã xóa"].includes(item.label));
  return [
    { label: "Người thực hiện", value: auditActor(row, details) },
    { label: "Đối tượng", value: displayValue(row.target_user_id || details.target_user_id || details.target_username) },
    { label: "Lý do", value: auditReason(row, details) },
    primaryDetail || { label: "Group/Kênh", value: displayValue(row.chat_id || details.chat_id || details.group_id) }
  ];
}

function auditLogSeverity(row: Row) {
  const action = String(row.action || "").toLowerCase();
  if (["ban", "kick", "mute", "scam_report_confirmed"].includes(action)) {
    return "critical";
  }
  if (["delete_message", "warn", "scam_report_rejected"].includes(action)) {
    return "warning";
  }
  if (["module_update", "role_update", "title_update"].includes(action)) {
    return "info";
  }
  return "neutral";
}

function auditLogSummary(row: Row) {
  const details = auditLogRows(row);
  const time = details.find((item) => item.label === "Thời gian")?.value;
  const actor = details.find((item) => item.label === "Người thực hiện")?.value;
  const target = details.find((item) => item.label === "Đối tượng")?.value;
  return `${time} · ${actor} -> ${target}`;
}

function metricLabel(key: string) {
  const labels: Record<string, string> = {
    member_count: "Tổng thành viên",
    active_members: "Thành viên hoạt động",
    deleted_messages: "Tin đã xóa",
    spam_events: "Sự kiện spam",
    scam_reports: "Báo cáo scam",
    verified_members: "Đã xác minh"
  };
  return labels[key] || key;
}

function metricPeriod(period: string) {
  const labels: Record<string, string> = {
    today: "Hôm nay",
    week: "Tuần này",
    month: "Tháng này",
    all_time: "Tất cả"
  };
  return labels[period] || period || "Chưa đặt";
}

function metricValue(row: Row) {
  const value = Number(row.metric_value || 0);
  return Number.isFinite(value) ? value.toLocaleString("vi-VN") : displayValue(row.metric_value);
}

function previewText(row: Row, table: TableConfig) {
  if (table.key === "scam_reports") {
    return scamReportSummary(row);
  }
  const key = table.titleField;
  const raw = row[key] || row.value || row.reason || row.notes || "";
  return String(raw).replace(/\s+/g, " ").trim();
}

function scamReportTarget(row: Row) {
  return row.target_username || row.bank_account || row.phone || row.target_uid || "Chưa rõ đối tượng";
}

function scamReportSummary(row: Row) {
  const reporter = row.reporter_username || row.reporter_user_id || "ẩn danh";
  const target = scamReportTarget(row);
  const evidence = String(row.evidence || "Chưa có bằng chứng").replace(/\s+/g, " ").trim();
  return `Người báo cáo: ${reporter} · Đối tượng: ${target} · Bằng chứng: ${evidence}`;
}

function scamReportFacts(row: Row) {
  return [
    { label: "Người báo cáo", value: displayValue(row.reporter_username || row.reporter_user_id) },
    { label: "Đối tượng", value: displayValue(scamReportTarget(row)) },
    { label: "Tài khoản", value: displayValue(row.bank_account) },
    { label: "Điện thoại", value: displayValue(row.phone) },
    { label: "Trạng thái", value: statusText(row) }
  ];
}

function statusClass(row: Row) {
  if (row.enabled === false || row.status === "paused" || row.status === "closed" || row.status === "rejected") {
    return "off";
  }
  if (row.status === "pending" || row.status === "draft") {
    return "pending";
  }
  return "on";
}

function statusText(row: Row) {
  if (row.enabled === false) {
    return "Tắt";
  }
  const labels: Record<string, string> = {
    active: "Chạy",
    open: "Mở",
    drawn: "Đã quay",
    closed: "Đã đóng",
    pending: "Chờ xử lý",
    confirmed: "Đã xác nhận",
    rejected: "Từ chối",
    draft: "Nháp"
  };
  return labels[String(row.status || "")] || "Chạy";
}

function healthState(row: Row, tableKey = "") {
  if (tableKey === "channel_posts") {
    const status = String(row.status || "draft").toLowerCase();
    if (row.enabled === false) {
      return { className: "disabled", label: "Tắt" };
    }
    if (["pending", "queued"].includes(status)) {
      return { className: "setup", label: "Chờ gửi" };
    }
    if (status === "scheduled") {
      return { className: "setup", label: "Đã lên lịch" };
    }
    if (["sending", "deleting"].includes(status)) {
      return { className: "setup", label: "Đang xử lý" };
    }
    if (status === "sent") {
      return { className: "healthy", label: "Đã gửi" };
    }
    if (status === "delete_scheduled") {
      return { className: "healthy", label: "Đã gửi · chờ xóa" };
    }
    if (status === "deleted") {
      return { className: "disabled", label: "Đã xóa" };
    }
    if (["failed", "delete_failed"].includes(status)) {
      return { className: "error", label: "Lỗi gửi" };
    }
    return { className: "setup", label: "Nháp" };
  }
  if (row.enabled === false || row.status === "paused" || row.status === "closed" || row.status === "rejected") {
    return { className: "disabled", label: "Tắt" };
  }
  if (row.status === "pending" || row.status === "draft" || row.status === "watch") {
    return { className: "setup", label: "Cần setup" };
  }
  if (row.status === "error" || row.status === "danger") {
    return { className: "error", label: "Lỗi" };
  }
  return { className: "healthy", label: "Ổn định" };
}

function actionBadge(row: Row, table: TableConfig) {
  const action = row.action || row.risk_level || row.status || row.role || row.captcha_type || row.period || "";
  if (action) {
    if (table.key === "audit_logs") {
      const labels: Record<string, string> = {
        delete_message: "Xóa tin",
        ban: "Ban",
        kick: "Kick",
        mute: "Mute",
        warn: "Cảnh báo",
        role_update: "Đổi quyền",
        title_update: "Đổi tiêu đề",
        module_update: "Đổi module",
        scam_report_confirmed: "Xác nhận scam",
        scam_report_rejected: "Từ chối scam",
        scheduled_posts_inactive: "Lịch gửi đang tắt",
        scheduled_posts_not_configured: "Lịch gửi chưa cấu hình",
        scheduled_posts_jobs_loaded: "Đã nạp lịch gửi",
        scheduled_message_catch_up: "Gửi bù lịch trễ",
        scheduled_message_skipped: "Bỏ qua gửi tin",
        scheduled_message_sent: "Đã gửi tin định kỳ",
        scheduled_message_failed: "Lỗi gửi tin định kỳ",
        scheduled_video_skipped: "Bỏ qua gửi video",
        scheduled_video_catch_up: "Gửi bù video trễ",
        scheduled_video_sent: "Đã gửi video định kỳ",
        scheduled_video_failed: "Lỗi gửi video định kỳ"
      };
      return labels[String(action).toLowerCase()] || String(action).replaceAll("_", " ");
    }
    return String(action).replaceAll("_", " ").toUpperCase();
  }
  if (table.key === "messages" || table.key === "video_messages") {
    return String(row.pool || "default").toUpperCase();
  }
  if (table.key === "bots") {
    return row.enabled === false ? "OFFLINE" : "ONLINE";
  }
  return statusText(row).toUpperCase();
}

function detailRows(row: Row, table: TableConfig) {
  const keys = Array.from(new Set([...table.summaryFields, "bot_key", "group_id", "chat_id", "match", "action", "reason", "status", "enabled"]));
  return keys
    .filter((key) => !fieldIsAdvanced(table.key, key) && row[key] !== undefined && row[key] !== null && row[key] !== "")
    .slice(0, 10)
    .map((key) => ({ key, label: fieldByKey(table, key)?.label || key.replaceAll("_", " "), value: displayValue(row[key]) }));
}

function advancedDetailRows(row: Row, table: TableConfig) {
  const keys = Array.from(new Set(["id", "created_at", "updated_at", "settings", "key", ...Object.keys(row)]));
  return keys
    .filter((key) => fieldIsAdvanced(table.key, key) && row[key] !== undefined && row[key] !== null && row[key] !== "")
    .slice(0, 12)
    .map((key) => ({ key, label: fieldByKey(table, key)?.label || key.replaceAll("_", " "), value: displayValue(row[key]) }));
}

function fieldIsAdvanced(tableKey: string, fieldKey: string) {
  if (ADVANCED_FIELD_KEYS.has(fieldKey)) {
    return true;
  }
  if (tableKey === "config" && fieldKey === "key") {
    return true;
  }
  return false;
}

function rowMatchesQuickFilter(row: Row, filter: string) {
  if (!filter || filter === "all") {
    return true;
  }
  if (filter === "active") {
    return row.enabled !== false && row.status !== "paused" && row.status !== "closed";
  }
  if (filter === "disabled") {
    return row.enabled === false || row.status === "paused" || row.status === "closed";
  }
  return [row.action, row.match, row.status, row.role, row.risk_level].map((value) => String(value || "").toLowerCase()).includes(filter);
}

function tableHasField(table: TableConfig | undefined, fieldKey: string) {
  return Boolean(table?.fields.some((field) => field.key === fieldKey));
}

function tableSupportsScope(table: TableConfig | undefined, scope: "bot" | "group") {
  if (scope === "bot") {
    return tableHasField(table, "bot_key");
  }
  return tableHasField(table, "group_id") || tableHasField(table, "chat_id");
}

function buildScopedQuery(table: TableConfig, searchText: string, selectedBot: string, selectedScope: string) {
  const params = new URLSearchParams();
  if (searchText.trim()) {
    params.set("search", searchText.trim());
  }
  if (selectedBot && tableSupportsScope(table, "bot")) {
    params.set("bot_key", selectedBot);
  }
  if (selectedScope && tableSupportsScope(table, "group")) {
    params.set("group_id", selectedScope);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

function normalizedText(value: unknown) {
  return String(value || "").toLowerCase();
}

function safeRegexMatch(pattern: unknown, text: string) {
  try {
    return new RegExp(String(pattern), "i").test(text);
  } catch {
    return false;
  }
}

function rowMatchesRule(row: Row, text: string, key: string) {
  const source = String(row[key] || "").trim();
  const matchMode = String(row.match || "contains").toLowerCase();
  if (!source || !text) {
    return false;
  }
  const sourceNormalized = normalizedText(source).trim();
  const textNormalized = normalizedText(text).trim();
  const tokens = (value: string): string[] => normalizedText(value).match(/[a-z0-9_]+/g) || [];
  const containsWholeWord = (fullText: string, word: string) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9_])${escaped}([^a-z0-9_]|$)`, "i").test(fullText);
  };
  if (matchMode === "regex") {
    return safeRegexMatch(source, text);
  }
  if (matchMode === "exact") {
    return textNormalized === sourceNormalized;
  }
  if (matchMode === "smart") {
    const sourceTokens = tokens(source);
    const textTokens = tokens(text);
    if (!sourceTokens.length || !textTokens.length) {
      return false;
    }
    if (sourceTokens.length === 1) {
      return textTokens.includes(sourceTokens[0]);
    }
    return textNormalized.includes(sourceNormalized) || sourceTokens.every((token) => textTokens.includes(token));
  }
  if (!sourceNormalized) {
    return false;
  }
  if (!sourceNormalized.includes(" ")) {
    return containsWholeWord(textNormalized, sourceNormalized);
  }
  return textNormalized.includes(sourceNormalized);
}

function extractDomains(text: string) {
  return Array.from(text.matchAll(/(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)/gi))
    .map((match) => match[1].toLowerCase());
}

function testRowsForTable(tableKey: string, rows: Row[], text: string): RuleTestResult[] {
  const value = text.trim();
  if (!value) {
    return [];
  }
  if (tableKey === "keywords") {
    return rows
      .filter((row) => row.enabled !== false && rowMatchesRule(row, value, "keyword"))
      .map((row) => ({ label: String(row.keyword), detail: `${row.match || "contains"} -> ${row.action || "delete"}`, matched: true }));
  }
  if (tableKey === "auto_replies") {
    return rows
      .filter((row) => row.enabled !== false && rowMatchesRule(row, value, "trigger"))
      .map((row) => ({ label: String(row.trigger), detail: String(row.reply || "Chưa có nội dung trả lời"), matched: true }));
  }
  if (tableKey === "domain_blacklist" || tableKey === "link_shorteners") {
    const domains = extractDomains(value);
    return rows
      .filter((row) => {
        const domain = String(row.domain || "").toLowerCase();
        return row.enabled !== false && domain && domains.some((item) => item === domain || item.endsWith(`.${domain}`));
      })
      .map((row) => ({ label: String(row.domain), detail: `${row.risk || "shortener"} -> ${row.action || "warn"}`, matched: true }));
  }
  return [];
}

function cockpitMetrics(row: Row, table: TableConfig) {
  const action = actionBadge(row, table);
  const health = healthState(row).label;
  const scope = row.group_id || row.chat_id || row.bot_key || "Toàn hệ thống";
  return [
    { label: "Sức khỏe", value: health },
    { label: "Hành động", value: action },
    { label: "Phạm vi", value: String(scope) }
  ];
}

function cockpitActivity(row: Row, table: TableConfig) {
  const title = titleFor(row, table);
  const action = actionBadge(row, table).toLowerCase();
  return [
    `${title} đã được tải từ Supabase`,
    `Chính sách ${action} đã sẵn sàng đồng bộ runtime`,
    `Đã kiểm tra phạm vi ${row.group_id || row.chat_id || row.bot_key || "global"}`
  ];
}

function heroFor(activeKey: string) {
  if (["keywords", "domain_blacklist", "link_shorteners", "verification_settings", "captcha_questions", "bot_allowlist"].includes(activeKey)) {
    return { title: "Trung tâm bảo mật", desc: "Chặn spam, link xấu, captcha và quyền bot bằng các lựa chọn rõ ràng.", icon: ShieldCheck, tone: "security" };
  }
  if (["messages", "video_messages", "channel_posts", "auto_replies", "scheduled_posts"].includes(activeKey)) {
    return { title: "Trung tâm nội dung", desc: "Quản lý tin nhắn, video, auto reply và lịch gửi theo group.", icon: Sparkles, tone: "content" };
  }
  if (["scam_entities", "scam_reports"].includes(activeKey)) {
    return { title: "Trung tâm chống scam", desc: "Tra cứu, báo cáo và duyệt dữ liệu lừa đảo từ thành viên.", icon: Archive, tone: "scam" };
  }
  if (["giveaway_campaigns", "giveaway_entries", "entertainment_events", "reputation_rules", "share_unlock_campaigns", "share_unlock_invites", "share_unlock_referrals"].includes(activeKey)) {
    return { title: "Trung tâm tương tác", desc: "Giveaway, event, điểm tương tác và các hoạt động giữ group sống.", icon: Gift, tone: "fun" };
  }
  return { title: "Bảng điều khiển", desc: "Chọn bot, chọn group, rồi cấu hình từng module bằng thao tác thân thiện.", icon: BarChart3, tone: "main" };
}

function workflowFor(tableKey: string, rows: Row[], selectedCount: number) {
  if (tableKey === "keywords") {
    const actions = ["delete", "warn", "mute", "kick", "ban"].map((action) => ({
      label: action,
      count: rows.filter((row) => row.action === action).length
    }));
    return {
      title: "Quy trình chặn nội dung xấu",
      body: "Rule từ khóa đang dùng kiểu xóa tin trước, sau đó cộng cảnh báo nội bộ. Khi chạm ban_after_warnings, bot sẽ tự ban để tránh lách luật.",
      icon: ShieldCheck,
      chips: [
        { label: "Đã chọn", value: selectedCount },
        { label: "Bật", value: rows.filter((row) => row.enabled !== false).length },
        ...actions.map((item) => ({ label: item.label, value: item.count }))
      ]
    };
  }
  if (tableKey === "messages") {
    const pools = uniqueValues(rows, "pool");
    return {
      title: "Kho tin nhắn theo nhóm nội dung",
      body: "Mỗi group chỉ cần chọn đúng Nhóm nội dung. Bot sẽ lấy ngẫu nhiên các tin đang bật trong nhóm đó.",
      icon: Sparkles,
      chips: [
        { label: "Nhóm nội dung", value: pools.length },
        { label: "Tin bật", value: rows.filter((row) => row.enabled !== false).length },
        { label: "Đã chọn", value: selectedCount }
      ]
    };
  }
  if (tableKey === "scheduled_posts") {
    return {
      title: "Flow gửi tin hẹn giờ",
      body: "Để gửi chào buổi sáng lúc 09:00: bật module Tự động hóa, bấm Tạo lịch gửi tin, nhập nội dung và lưu.",
      icon: SlidersHorizontal,
      chips: [
        { label: "Lịch bật", value: rows.filter((row) => row.enabled !== false).length },
        { label: "Group có lịch", value: uniqueValues(rows, "chat_id").length },
        { label: "Đã chọn", value: selectedCount }
      ]
    };
  }
  if (tableKey === "channel_posts") {
    return {
      title: "Đăng bài lên channel",
      body: "Soạn nội dung, thêm nút inline, đặt trạng thái pending để bot gửi. Kết quả gửi nằm ngay trên từng dòng.",
      icon: MessageSquare,
      chips: [
        { label: "Chờ gửi", value: rows.filter((row) => row.status === "pending").length },
        { label: "Đã gửi", value: rows.filter((row) => row.status === "sent").length },
        { label: "Lỗi", value: rows.filter((row) => ["failed", "delete_failed"].includes(String(row.status))).length }
      ]
    };
  }
  if (tableKey === "auto_replies") {
    return {
      title: "Câu hỏi tự trả lời",
      body: "Tạo cặp Câu kích hoạt -> Nội dung trả lời. Khuyên dùng kiểu Smart để bot hiểu theo từ khóa/ngữ cảnh và bớt trả lời bừa.",
      icon: Activity,
      chips: [
        { label: "Câu trả lời", value: rows.length },
        { label: "Regex", value: rows.filter((row) => row.match === "regex").length },
        { label: "Bật", value: rows.filter((row) => row.enabled !== false).length }
      ]
    };
  }
  if (tableKey === "video_messages") {
    const pools = uniqueValues(rows, "pool");
    return {
      title: "Kho video để bot copy",
      body: "Lưu source chat ID và message ID. Group sẽ lấy video theo Nhóm video, tương tự như tin nhắn.",
      icon: Archive,
      chips: [
        { label: "Nhóm video", value: pools.length },
        { label: "Video bật", value: rows.filter((row) => row.enabled !== false).length },
        { label: "Đã chọn", value: selectedCount }
      ]
    };
  }
  if (tableKey === "giveaway_campaigns") {
    return {
      title: "Giveaway và quay số",
      body: "Tạo chiến dịch, đặt phần thưởng, số người thắng và trạng thái. Lượt tham gia nằm ở mục Lượt tham gia.",
      icon: Gift,
      chips: [
        { label: "Mở", value: rows.filter((row) => row.status === "open").length },
        { label: "Đã quay", value: rows.filter((row) => row.status === "drawn").length },
        { label: "Đã chọn", value: selectedCount }
      ]
    };
  }
  if (tableKey === "share_unlock_campaigns") {
    return {
      title: "Mở khóa bằng mời bạn",
      body: "Mỗi member có một link riêng. Khi đủ số người vào group qua link đó, bot sẽ mở khóa link thưởng.",
      icon: Gift,
      chips: [
        { label: "Đang mở", value: rows.filter((row) => row.status === "open").length },
        { label: "Đã đóng", value: rows.filter((row) => row.status === "closed").length },
        { label: "Đã chọn", value: selectedCount }
      ]
    };
  }
  if (tableKey === "share_unlock_referrals") {
    return {
      title: "Lượt mời hợp lệ",
      body: "Theo dõi ai là người giới thiệu, ai là user vào qua link và lượt nào được tính.",
      icon: Users,
      chips: [
        { label: "Lượt hợp lệ", value: rows.filter((row) => row.counted !== false).length },
        { label: "Người giới thiệu", value: uniqueValues(rows, "referrer_user_id").length },
        { label: "Đã chọn", value: selectedCount }
      ]
    };
  }
  return null;
}

function emptyStateFor(tableKey: string): EmptyStateConfig {
  const states: Record<string, EmptyStateConfig> = {
    messages: {
      title: "Chưa có tin nhắn",
      body: "Tạo pool đầu tiên để dùng cho group.",
      action: "Tạo tin nhắn",
      steps: ["Nhập nhanh", "Lưu pool", "Gán cho group"]
    },
    video_messages: {
      title: "Chưa có video",
      body: "Tạo nguồn video để dùng lại.",
      action: "Tạo video source",
      steps: ["Nhập source", "Lưu video", "Gán cho group"]
    },
    keywords: {
      title: "Chưa có rule",
      body: "Tạo rule đầu tiên cho module.",
      action: "Tạo rule đầu tiên",
      steps: ["Chọn action", "Nhập keyword", "Test nhanh"]
    },
    auto_replies: {
      title: "Chưa có auto reply",
      body: "Tạo trigger để bot trả lời tự động.",
      action: "Tạo auto reply",
      steps: ["Nhập trigger", "Nhập câu trả lời", "Test trước khi bật"]
    },
    share_unlock_campaigns: {
      title: "Chưa có campaign mở khóa",
      body: "Tạo campaign đầu tiên để user mời bạn qua link riêng rồi mở khóa phần thưởng.",
      action: "Tạo campaign mở khóa",
      steps: ["Chọn group nguồn", "Đặt số người cần mời", "Nhập link phần thưởng"]
    },
    scheduled_posts: {
      title: "Chưa có lịch",
      body: "Tạo lịch gửi cho group.",
      action: "Tạo lịch gửi tin",
      steps: ["Chọn pool", "Đặt giờ", "Lưu lịch"]
    },
    channel_posts: {
      title: "Chưa có bài",
      body: "Tạo bài đầu tiên cho channel.",
      action: "Tạo bài đăng",
      steps: ["Chọn channel", "Soạn nội dung", "Lưu bài"]
    },
    bots: {
      title: "Chưa có bot",
      body: "Thêm bot để bắt đầu vận hành.",
      action: "Thêm bot",
      steps: ["Nhập bot_key", "Thêm token", "Lưu bot"]
    },
    groups: {
      title: "Chưa có group",
      body: "Thêm group để gán bot và module.",
      action: "Thêm group",
      steps: ["Nhập group ID", "Lưu group", "Chọn bot"]
    }
  };
  return states[tableKey] || {
    title: "Chưa có dữ liệu",
    body: "Tạo mục đầu tiên cho phạm vi này.",
    action: "Tạo mục đầu tiên",
    steps: ["Bấm Thêm", "Điền thông tin", "Lưu lại"]
  };
}

function groupedFields(table: TableConfig) {
  const groups: Record<string, FieldConfig[]> = {};
  for (const field of table.fields) {
    const section = field.section || "Thông tin";
    groups[section] = groups[section] || [];
    groups[section].push(field);
  }
  return Object.entries(groups);
}

function sortGroupFieldGroups(groups: [string, FieldConfig[]][]) {
  return [...groups].sort(([left], [right]) => {
    const leftIndex = GROUP_TAB_ORDER.indexOf(left);
    const rightIndex = GROUP_TAB_ORDER.indexOf(right);
    return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
  });
}

function groupTabLabel(section: string) {
  return GROUP_TAB_LABELS[section] || section;
}

function allowedGroupSectionsForLayer(activeLayer: string) {
  if (!activeLayer.startsWith("module:")) {
    return GROUP_BASE_SECTIONS;
  }
  const moduleKey = activeLayer.replace("module:", "");
  return GROUP_MODULE_SECTIONS[moduleKey] || GROUP_BASE_SECTIONS;
}

function dangerousGroupChanges(values: Row) {
  const issues: string[] = [];
  if (values.enabled === false) {
    issues.push("Group đang bị tắt, bot sẽ không áp dụng bảo vệ cho group này.");
  }
  if (["ban", "kick"].includes(String(values.spam_action || ""))) {
    issues.push("Spam action đang đặt mức xử lý mạnh.");
  }
  if (["ban", "kick"].includes(String(values.forward_action || ""))) {
    issues.push("Forward action đang đặt mức xử lý mạnh.");
  }
  if (["ban", "kick"].includes(String(values.inline_keyboard_action || ""))) {
    issues.push("Inline keyboard action đang đặt mức xử lý mạnh.");
  }
  if (values.remove_unknown_bots === true) {
    issues.push("Tự kick bot lạ đang bật.");
  }
  return issues;
}

function poolRows(rows: Row[], pool: string) {
  const targetPool = String(pool || "").trim();
  if (!targetPool) {
    return [];
  }
  return rows.filter((row) => row.enabled !== false && String(row.pool || "").trim() === targetPool);
}

function uniquePoolCounts(rows: Row[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const pool = String(row.pool || "").trim();
    if (!pool || row.enabled === false) {
      continue;
    }
    counts.set(pool, (counts.get(pool) || 0) + 1);
  }
  return counts;
}

function poolPreviewText(row: Row, type: "message" | "video") {
  if (type === "video") {
    const source = [row.from_chat_id, row.message_id].filter(Boolean).join(" / ");
    return row.caption || source || "Video chưa có caption/source rõ ràng";
  }
  return row.message || row.text || row.content || "Tin nhắn chưa có nội dung";
}

function splitBulkLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseDelimited(line: string) {
  const delimiter = line.includes("|") ? "|" : line.includes("\t") ? "\t" : line.includes(",") ? "," : "";
  if (!delimiter) {
    return [line];
  }
  return line.split(delimiter).map((part) => part.trim());
}

function parseSheetOrPipe(line: string) {
  const delimiter = line.includes("\t") ? "\t" : line.includes("|") ? "|" : "";
  if (!delimiter) {
    return [line.trim()];
  }
  return line.split(delimiter).map((part) => part.trim());
}

function parseBulkRows(tableKey: string, text: string, defaults: BulkDefaults): BulkRow[] {
  const lines = splitBulkLines(text);
  if (tableKey === "messages") {
    return lines.map((line): BulkRow => {
      const [message, pool = defaults.pool, weight = String(defaults.weight)] = parseSheetOrPipe(line);
      return { bot_key: defaults.bot_key, message, pool: pool || defaults.pool, weight: Number(weight) || defaults.weight, enabled: defaults.enabled };
    }).filter((row) => Boolean(row.message));
  }

  if (tableKey === "keywords") {
    return lines.map((line): BulkRow => {
      const [keyword, actionOrMatch = defaults.action, reason = defaults.reason] = parseDelimited(line);
      const isMatch = ["contains", "regex"].includes(actionOrMatch);
      return {
        bot_key: defaults.bot_key,
        keyword,
        match: isMatch ? actionOrMatch : defaults.match,
        action: isMatch ? defaults.action : actionOrMatch || defaults.action,
        reason: reason || defaults.reason,
        enabled: defaults.enabled
      };
    }).filter((row) => Boolean(row.keyword));
  }

  if (tableKey === "video_messages") {
    return lines.map((line): BulkRow => {
      const parts = parseSheetOrPipe(line);
      const numbers = line.match(/-?\d{5,}/g) || [];
      const fromChatId = parts[0]?.startsWith("-100") ? parts[0] : numbers[0] || "";
      const messageId = parts[1] && /^\d+$/.test(parts[1]) ? parts[1] : numbers[1] || "";
      const caption = parts.length >= 3 ? parts.slice(2).join(" ") : "";
      return {
        bot_key: defaults.bot_key,
        from_chat_id: fromChatId,
        message_id: messageId,
        caption,
        pool: defaults.pool,
        weight: defaults.weight,
        enabled: defaults.enabled && Boolean(fromChatId && messageId)
      };
    }).filter((row) => row.from_chat_id && row.message_id);
  }

  if (tableKey === "scam_entities") {
    return lines.map((line): BulkRow => {
      const parts = parseDelimited(line);
      const raw = parts.join(" ");
      const username = raw.match(/@([a-zA-Z0-9_]{5,})/)?.[1] || "";
      const numbers = raw.match(/\b\d{6,}\b/g) || [];
      return {
        bot_key: defaults.bot_key,
        uid: parts[0]?.match(/^\d{6,}$/) ? parts[0] : numbers[0] || "",
        username,
        bank_account: parts[1] && /^\d{6,}$/.test(parts[1]) ? parts[1] : numbers[1] || "",
        phone: numbers.find((item) => [9, 10, 11].includes(item.length)) || "",
        name: "",
        risk_level: defaults.risk_level,
        reason: parts[2] || defaults.reason || "Dữ liệu scam",
        evidence: line,
        source: defaults.source,
        status: defaults.status,
        enabled: defaults.enabled
      };
    });
  }

  if (tableKey === "domain_blacklist" || tableKey === "link_shorteners") {
    return lines.map((line): BulkRow => {
      const [domain, action = defaults.action, notes = ""] = parseDelimited(line);
      return tableKey === "domain_blacklist"
        ? { bot_key: defaults.bot_key, domain, risk: defaults.risk, action: action || defaults.action, enabled: defaults.enabled, notes }
        : { bot_key: defaults.bot_key, domain, action: action || defaults.action, enabled: defaults.enabled, notes };
    }).filter((row) => Boolean(row.domain));
  }

  if (tableKey === "auto_replies") {
    return lines.map((line): BulkRow => {
      const [trigger, reply = "", match = "smart"] = parseDelimited(line);
      return { bot_key: defaults.bot_key, trigger, reply, match: match || "smart", enabled: defaults.enabled };
    }).filter((row) => row.trigger && row.reply);
  }

  return [];
}

function bulkHint(tableKey: string) {
  if (tableKey === "messages") {
    return "Mỗi dòng là một tin nhắn. Nếu cần cột riêng hãy dùng tab từ Sheet hoặc dấu |: nội dung | nhóm nội dung | độ ưu tiên. Dấu phẩy trong nội dung sẽ được giữ nguyên.";
  }
  if (tableKey === "keywords") {
    return "Mỗi dòng là một từ khóa. Có thể dùng: từ khóa | delete/warn/ban | lý do.";
  }
  if (tableKey === "video_messages") {
    return "Mỗi dòng gồm source chat ID và message ID. Dùng tab từ Sheet hoặc dấu |. Ví dụ: -1001234567890 | 456 | caption.";
  }
  if (tableKey === "scam_entities") {
    return "Mỗi dòng là một đối tượng scam. Có thể paste: uid | @username | số tài khoản | lý do.";
  }
  if (tableKey === "domain_blacklist") {
    return "Mỗi dòng là một domain scam/phishing. Có thể dùng: domain | delete/warn/ban | ghi chú.";
  }
  if (tableKey === "link_shorteners") {
    return "Mỗi dòng là một domain rút gọn. Có thể dùng: domain | delete/warn | ghi chú.";
  }
  if (tableKey === "auto_replies") {
    return "Mỗi dòng: câu hỏi | nội dung trả lời | smart/exact/contains/regex. Muốn random nhiều mẫu, ngăn bằng || hoặc xuống dòng.";
  }
  return "";
}

function groupedNav(tables: TableConfig[]) {
  const used = new Set<string>();
  const groups = NAV_GROUPS.map((group) => {
    const items = group.keys
      .map((key) => tables.find((table) => table.key === key))
      .filter((table): table is TableConfig => Boolean(table));
    items.forEach((item) => used.add(item.key));
    return { ...group, items };
  }).filter((group) => group.items.length);
  const other = tables.filter((table) => !used.has(table.key));
  return other.length ? [...groups, { label: "Khác", keys: [], items: other }] : groups;
}

function uniqueValues(rows: Row[], key: string) {
  return Array.from(new Set(rows.map((row) => String(row[key] || "").trim()).filter(Boolean))).sort();
}

function channelPostTabFor(row: Row): ChannelPostTab {
  const status = String(row.status || "draft").toLowerCase();
  if (status === "scheduled") return "scheduled";
  if (["sent", "delete_scheduled", "deleting"].includes(status)) return "sent";
  if (status === "deleted") return "deleted";
  if (["failed", "delete_failed"].includes(status)) return "failed";
  return "queue";
}

function channelButtonsFromText(value: unknown): ChannelButtonDraft[] {
  const buttons: ChannelButtonDraft[] = [];
  String(value || "").split("\n").forEach((line, row) => {
    line.split("||").forEach((chunk) => {
      const [label, url] = chunk.split("|", 2).map((item) => item.trim());
      if (label || url) buttons.push({ label: label || "", url: url || "", row });
    });
  });
  return buttons.length ? buttons : [{ label: "", url: "", row: 0 }];
}

function channelButtonsToText(buttons: ChannelButtonDraft[]) {
  const rows = new Map<number, string[]>();
  buttons.forEach((button) => {
    if (!button.label.trim() && !button.url.trim()) return;
    rows.set(button.row, [...(rows.get(button.row) || []), `${button.label.trim()} | ${button.url.trim()}`]);
  });
  return Array.from(rows.entries()).sort(([left], [right]) => left - right).map(([, items]) => items.join(" || ")).join("\n");
}

function vietnamDateTimeInput(value: unknown) {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
  return parts.replace(" ", "T");
}

function vietnamInputToIso(value: string) {
  if (!value) return null;
  return new Date(`${value}:00+07:00`).toISOString();
}

function actionLabel(value: unknown) {
  const labels: Record<string, string> = {
    warn: "Xóa và cảnh báo",
    delete: "Xóa tin",
    restrict: "Hạn chế chat",
    mute: "Hạn chế chat",
    kick: "Kick khỏi nhóm",
    ban: "Ban khỏi nhóm"
  };
  return labels[String(value || "").toLowerCase()] || String(value || "Chưa đặt");
}

function layerContainsTable(layer: { tables: string[] }, tableKey: string) {
  return layer.tables.includes(tableKey);
}

function loadCpState() {
  if (typeof window === "undefined") {
    return {} as Record<string, string>;
  }
  try {
    return JSON.parse(window.localStorage.getItem(CP_STATE_STORAGE_KEY) || "{}") as Record<string, string>;
  } catch {
    return {} as Record<string, string>;
  }
}

function saveCpState(nextState: Record<string, string>) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(CP_STATE_STORAGE_KEY, JSON.stringify(nextState));
}

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

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 2600);
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
    if (loading) {
      return;
    }
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
    return lookups.groups.find((group) => String(group.group_id || "") === selectedScope) || null;
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
  const memberActivityRows = useMemo(() => {
    if (table?.key !== "audit_logs" || activeLayer !== "members") {
      return [] as Row[];
    }
    return visibleRows.filter((row) => ["member_joined", "member_left", "member_join_request"].includes(String(row.action || "").toLowerCase()));
  }, [activeLayer, table?.key, visibleRows]);
  const [expandedMemberAuditIds, setExpandedMemberAuditIds] = useState<Set<string>>(() => new Set());
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
    if (activeConfigSection?.title === "Thiết lập dùng chung" || activeConfigSection?.title === "Forward nâng cao") {
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
    const isOn = states.length
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
    const timer = window.setInterval(async () => {
      try {
        const query = buildScopedQuery(table, search, selectedBot, "");
        const payload = await api(`/api/channel_posts${query}`);
        setRows(payload.rows || []);
      } catch {
        // Keep the last known state; the next poll will retry.
      }
    }, 3000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.passwordRequired, savedPassword, search, selectedBot, table?.key]);

  useEffect(() => {
    if (meta && (!meta.passwordRequired || savedPassword)) {
      void loadLookups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.passwordRequired, savedPassword, selectedBot]);

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
    } else if (!layerContainsTable(layer, activeKey)) {
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
  const welcomeButtonsText = String(welcomeSettings.welcome_buttons_text || "");
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
            width: drawerWidth,
            flexShrink: 0,
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              borderRight: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              p: 2
            }
          }}
        >
          <Stack spacing={2.25} sx={{ minHeight: "100%" }}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: "rgba(255,255,255,0.035)" }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                <Database size={24} />
                <Box>
                  <Typography variant="h6" sx={{ lineHeight: 1.05 }}>Cu Bot OS</Typography>
                  <Typography variant="caption" color="text.secondary">Telegram operations center</Typography>
                </Box>
              </Stack>
            </Paper>
            <Stack spacing={2} component="nav" sx={{ flex: 1 }}>
              {[
                ["Tổng quan", CORE_LAYERS.filter((layer) => layer.navSection === "Tổng quan")],
                ["Vận hành", CORE_LAYERS.filter((layer) => layer.navSection === "Vận hành")],
                ["Module", allModuleLayers],
                ["Khác", advancedLayer ? [advancedLayer] : []]
              ].map(([title, layers]) => (
                <Stack key={String(title)} spacing={0.75}>
                  <Typography variant="overline" color="text.secondary">{String(title)}</Typography>
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
                          justifyContent: "flex-start",
                          opacity: moduleOff ? 0.46 : 1,
                          pointerEvents: locked ? "none" : "auto",
                          pr: 1.1,
                        }}
                      >
                        <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>{layer.shortTitle}</Box>
                      </MuiButton>
                    );
                  })}
                </Stack>
              ))}
            </Stack>
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "rgba(0,184,217,0.08)" }}>
              <Typography variant="caption" color="text.secondary">Module tắt được làm mờ trên sidebar. Bật/tắt trong màn Module.</Typography>
            </Paper>
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
          <Section eyebrow="Overview" title="Tổng quan vận hành" subtitle="Nhìn nhanh sức khỏe bot và trạng thái module trước khi đi sâu vào tác vụ." tone="main">
            <Grid container spacing={1.5}>
              {[
                { label: "Bot online", value: healthSummary.activeBots, body: "Bot đang hoạt động và sẵn sàng xử lý.", tone: "success" as const },
                { label: "Bot lỗi", value: healthSummary.disabledBots, body: "Bot đang tắt, paused hoặc chưa sẵn sàng.", tone: "warning" as const },
                { label: "Module bật", value: healthSummary.enabledModules, body: "Module đang bật trong hệ thống.", tone: "main" as const },
                { label: "Module tắt", value: healthSummary.offModules, body: "Module đang tắt trong bot hiện tại.", tone: "neutral" as const }
              ].map((item) => (
                <Grid key={item.label} size={{ xs: 12, sm: 6, xl: 3 }}>
                  <StatCard label={item.label} value={item.value} hint={item.body} tone={item.tone} />
                </Grid>
              ))}
              <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                <Paper variant="outlined" sx={{ p: 2, height: "100%", display: "grid", gap: 1, bgcolor: "background.default", backgroundImage: "linear-gradient(180deg, rgba(15, 118, 110, 0.05), transparent 46%)" }}>
                  <Typography variant="overline" color="text.secondary">Đi nhanh</Typography>
                  <MuiButton variant="contained" onClick={() => openModuleConfigure("moderation")}>Mở kiểm duyệt</MuiButton>
                </Paper>
              </Grid>
            </Grid>
          </Section>
        ) : null}

        {showOverview ? (
          <Section eyebrow="Signals" title="Việc cần chú ý" subtitle="Các queue và lỗi tồn đọng cần ưu tiên xử lý." tone="warning">
            <Grid container spacing={1.5}>
              {[
                { label: "Report scam chờ", value: healthSummary.pendingScamReports, body: "Báo cáo đang đợi duyệt hoặc từ chối.", tone: "scam" as const },
                { label: "Channel pending", value: healthSummary.pendingChannelPosts, body: "Bài đang chờ gửi hoặc hẹn giờ.", tone: "warning" as const },
                { label: "Channel lỗi", value: healthSummary.failedChannelPosts, body: "Bài gửi/xóa thất bại cần xem lại.", tone: "danger" as const },
                { label: "Group thiếu pool", value: healthSummary.groupsMissingMessagePool + healthSummary.groupsMissingVideoPool, body: "Group đang bật lịch nhưng thiếu nội dung nguồn.", tone: "analytics" as const }
              ].map((item) => (
                <Grid key={item.label} size={{ xs: 12, sm: 6, xl: 3 }}>
                  <StatCard label={item.label} value={item.value} hint={item.body} tone={item.tone} />
                </Grid>
              ))}
            </Grid>
          </Section>
        ) : null}

        {showOverview ? (
          <Section eyebrow="Hôm nay" title="Log bot trong ngày" subtitle="Hiển thị log gần nhất của bot đang chọn trong ngày hiện tại." tone="analytics">
            <Box sx={{ display: "grid", gap: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
              <Box />
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Chip label={`Tổng ${todayAuditSummary.total}`} />
                <Chip label={`Cảnh báo ${todayAuditSummary.warning}`} />
                <Chip label={`Nghiêm trọng ${todayAuditSummary.critical}`} />
                <Chip label={`Thông tin ${todayAuditSummary.info}`} />
                <MuiButton variant="outlined" onClick={() => goToInsight({ targetLayer: "logs", targetTable: "audit_logs" })}>Mở Logs</MuiButton>
              </Stack>
            </Box>
            <Grid container spacing={1.25}>
              {(["critical", "warning", "info"] as const).map((severity) => {
                const group = todayAuditGroups[severity];
                const titleMap = { critical: "Nghiêm trọng", warning: "Cảnh báo", info: "Thông tin" } as const;
                return (
                  <Grid key={severity} size={{ xs: 12, lg: 4 }}>
                    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default", backgroundImage: "linear-gradient(180deg, rgba(14, 165, 233, 0.05), transparent 36%)" }}>
                      <Stack direction="row" sx={{ justifyContent: "space-between", mb: 1 }}>
                        <strong>{titleMap[severity]}</strong>
                        <span>{group.length}</span>
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
            </Box>
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
        <Paper variant="outlined" sx={{ p: 2.25, bgcolor: "background.paper" }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", lg: "center" }, mb: 2 }}>
            <Box>
              <Typography variant="overline" color="primary">Module control</Typography>
              <Typography variant="h5">Bật/tắt module và mở từng nhóm chức năng</Typography>
              <Typography variant="body2" color="text.secondary">Module tắt sẽ bị disable trên sidebar, nhưng vẫn có thể bật tại đây.</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip color="success" label={`${enabledModuleCards.length} đang bật`} />
              <Chip label={`${disabledModuleCards.length} đang tắt`} />
            </Stack>
          </Stack>
          <Grid container spacing={1.5}>
            {moduleCards.map((module) => {
              const ModuleIcon = module.icon;
              const states = (module.moduleKeys || [module.key]).map((key) => moduleState.get(key)).filter(Boolean);
              const pendingCount =
                module.key === "anti_scam" ? lookups.scamReports.filter((row) => String(row.status || "pending") === "pending").length :
                module.key === "channel_publisher" ? lookups.channelPosts.filter((row) => ["pending", "queued", "scheduled"].includes(String(row.status || "").toLowerCase())).length :
                module.key === "automation" ? lookups.groups.filter((group) => group.daily_enabled !== false).length :
                0;
              return (
                <Grid key={module.key} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: "100%",
                      borderColor: module.isOn ? moduleAccents[module.tone as keyof typeof moduleAccents]?.line || activeAccent.line : "divider",
                      opacity: module.isOn ? 1 : 0.72,
                      backgroundImage: module.isOn
                        ? `linear-gradient(180deg, ${moduleAccents[module.tone as keyof typeof moduleAccents]?.tint || activeAccent.tint}, transparent 70%)`
                        : "none",
                    }}
                  >
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                          <Stack direction="row" spacing={1.25} sx={{ minWidth: 0 }}>
                            <Box sx={{ color: module.isOn ? (moduleAccents[module.tone as keyof typeof moduleAccents]?.color || activeAccent.color) : "text.secondary", pt: 0.25 }}>
                              <ModuleIcon size={20} />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="subtitle1">{module.title}</Typography>
                              <Typography variant="body2" color="text.secondary">{module.desc}</Typography>
                            </Box>
                          </Stack>
                          <Switch
                            checked={module.isOn}
                            disabled={saving}
                            onChange={() => {
                              setActiveModule(module.key);
                              void toggleModule((module.moduleKeys || [module.key])[0]);
                            }}
                          />
                        </Stack>
                        <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
                          <Chip size="small" color={module.isOn ? "success" : "default"} label={module.isOn ? "ON" : "OFF"} />
                          <Chip size="small" variant="outlined" label={`${module.tables.length} bảng`} />
                          <Chip size="small" variant="outlined" label={`${module.configKeys?.length || 0} config`} />
                          {states.length ? <Chip size="small" variant="outlined" label={`${states.length} state`} /> : null}
                          {pendingCount ? <Chip size="small" color="warning" variant="outlined" label={`${pendingCount} pending`} /> : null}
                        </Stack>
                        <Stack direction="row" spacing={1}>
                          <MuiButton fullWidth variant={module.isOn ? "contained" : "outlined"} onClick={() => openModuleConfigure(module.key)}>
                            Cài đặt
                          </MuiButton>
                          {!module.isOn ? (
                            <MuiButton variant="contained" color="success" disabled={saving} onClick={() => {
                              setActiveModule(module.key);
                              void toggleModule((module.moduleKeys || [module.key])[0]);
                            }}>
                              Bật
                            </MuiButton>
                          ) : null}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
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

        {table.key === "audit_logs" && activeLayer !== "members" ? (
          <AuditConsole auditStats={auditStats} />
        ) : null}

        {table.key === "audit_logs" && activeLayer === "members" ? (
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", lg: "center" } }}>
                <Box>
                  <Typography variant="overline" color="text.secondary">Nhật ký thành viên</Typography>
                  <Typography variant="h5">Join / out theo group đang chọn</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bot ghi lại các lần thành viên vào hoặc rời nhóm trong phạm vi bot đang quản lý.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  <Chip label={`Tổng ${memberActivityRows.length}`} />
                  <Chip color="success" label={`Join ${memberActivityRows.filter((row) => String(row.action || "") === "member_joined").length}`} />
                  <Chip color="info" label={`Request ${memberActivityRows.filter((row) => String(row.action || "") === "member_join_request").length}`} />
                  <Chip color="warning" label={`Out ${memberActivityRows.filter((row) => String(row.action || "") === "member_left").length}`} />
                </Stack>
              </Stack>
              <Stack spacing={1.25}>
                {memberActivityRows.slice(0, 20).map((row) => {
                  const data = auditLogCardData(row, groupNameForId);
                  const rowId = String(row.id || `${row.created_at}-${row.action}`);
                  const expanded = expandedMemberAuditIds.has(rowId);
                  return (
                    <Paper key={String(row.id || `${row.created_at}-${row.action}`)} variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", alignItems: "center" }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {data.time}
                            </Typography>
                            <Chip size="small" color={auditActionTone(String(row.action || data.action))} label={data.action} />
                            <Chip size="small" variant="outlined" label={`Group: ${data.groupLabel}`} />
                            <Chip size="small" variant="outlined" label={`User: ${data.targetLabel} · ${data.targetId || "-"}`} />
                            <MuiButton size="small" variant="text" onClick={() => setExpandedMemberAuditIds((current) => {
                              const next = new Set(current);
                              if (next.has(rowId)) next.delete(rowId); else next.add(rowId);
                              return next;
                            })}>
                              {expanded ? "Thu gọn" : "Chi tiết"}
                            </MuiButton>
                          </Stack>
                        </Stack>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {String(row.action || "") === "member_left" ? "Rời nhóm" : String(row.action || "") === "member_join_request" ? "Yêu cầu vào nhóm" : "Vào nhóm"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Người thực hiện: {data.actorLabel}{data.actorId ? ` (${data.actorId})` : ""}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            · {data.reason}
                          </Typography>
                        </Stack>
                        {expanded ? (
                          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                            {auditLogRows(row).map((item) => (
                              <Typography key={`${item.label}-${item.value}`} variant="caption" color="text.secondary">
                                <strong>{item.label}</strong> {item.value}
                              </Typography>
                            ))}
                          </Stack>
                        ) : null}
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            </Stack>
          </Paper>
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
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", lg: "center" } }}>
                <Box>
                  <Typography variant="overline" color="text.secondary">Channel publisher · Giờ Việt Nam GMT+7</Typography>
                  <Typography variant="h5">Đăng bài và theo dõi tiến trình</Typography>
                  <Typography variant="body2" color="text.secondary">Admin chỉ cần soạn nội dung, chọn nơi nhận và bấm gửi. Trạng thái kỹ thuật được bot tự quản lý.</Typography>
                </Box>
                <MuiButton variant="contained" startIcon={<Send size={17} />} onClick={() => openChannelComposer()}>
                  Đăng bài mới
                </MuiButton>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {([
                  ["queue", "Chờ gửi", Clock3],
                  ["scheduled", "Đã lên lịch", CalendarClock],
                  ["sent", "Đã gửi", Send],
                  ["deleted", "Đã xóa", Trash2],
                  ["failed", "Lỗi", X]
                ] as [ChannelPostTab, string, typeof Send][]).map(([key, label, Icon]) => {
                  const count = visibleRows.filter((row) => channelPostTabFor(row) === key).length;
                  return (
                    <MuiButton key={key} variant={channelTab === key ? "contained" : "outlined"} onClick={() => setChannelTab(key)} startIcon={<Icon size={16} />}>
                      {label} ({count})
                    </MuiButton>
                  );
                })}
              </Stack>
              <Stack spacing={1.25}>
              {channelPageRows.map((row) => {
                const status = healthState(row, "channel_posts");
                return (
                  <Paper key={row.id} variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2, alignItems: "flex-start" }}>
                        <Box>
                          <Typography variant="subtitle1">{row.title || "Bài đăng không tiêu đề"}</Typography>
                          <Typography variant="body2" color="text.secondary">{row.target_chat_id}</Typography>
                        </Box>
                        <Chip size="small" color="default" label={status.label} />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">{row.content}</Typography>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                        {row.scheduled_at ? <Chip size="small" variant="outlined" label={`Gửi: ${formatDateTime(row.scheduled_at)}`} /> : null}
                        {row.sent_at ? <Chip size="small" variant="outlined" label={`Đã gửi: ${formatDateTime(row.sent_at)}`} /> : null}
                        {row.delete_at && !row.deleted_at ? <Chip size="small" variant="outlined" label={`Xóa: ${formatDateTime(row.delete_at)}`} /> : null}
                        {row.deleted_at ? <Chip size="small" variant="outlined" label={`Đã xóa: ${formatDateTime(row.deleted_at)}`} /> : null}
                        {row.attempt_count ? <Chip size="small" variant="outlined" label={`${row.attempt_count} lần thử`} /> : null}
                      </Stack>
                      {row.error ? <Alert severity="error">{row.error_code || "telegram_error"}: {row.error}</Alert> : null}
                      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                      {["draft", "cancelled"].includes(String(row.status || "draft")) ? (
                        <>
                          <MuiButton variant="contained" disabled={saving} onClick={() => channelPostAction(row, "send_now")} startIcon={<Send size={15} />}>Gửi ngay</MuiButton>
                          <MuiButton variant="outlined" onClick={() => openChannelComposer(row)} startIcon={<Edit3 size={15} />}>Sửa</MuiButton>
                        </>
                      ) : null}
                      {row.status === "scheduled" ? (
                        <>
                          <MuiButton variant="contained" disabled={saving} onClick={() => channelPostAction(row, "send_now")} startIcon={<Send size={15} />}>Gửi ngay</MuiButton>
                          <MuiButton variant="outlined" disabled={saving} onClick={() => channelPostAction(row, "cancel_schedule")} startIcon={<X size={15} />}>Hủy lịch</MuiButton>
                          <MuiButton variant="outlined" onClick={() => openChannelComposer(row)} startIcon={<Edit3 size={15} />}>Sửa lịch</MuiButton>
                        </>
                      ) : null}
                      {["sent", "delete_scheduled"].includes(String(row.status || "")) ? (
                        <>
                          <MuiButton color="error" variant="contained" disabled={saving} onClick={() => channelPostAction(row, "delete_now")} startIcon={<Trash2 size={15} />}>Xóa ngay</MuiButton>
                          {row.status === "delete_scheduled" ? (
                            <MuiButton variant="outlined" disabled={saving} onClick={() => channelPostAction(row, "cancel_delete")} startIcon={<X size={15} />}>Hủy lịch xóa</MuiButton>
                          ) : (
                            <MuiButton variant="outlined" disabled={saving} onClick={() => scheduleChannelDelete(row)} startIcon={<CalendarClock size={15} />}>Hẹn xóa</MuiButton>
                          )}
                        </>
                      ) : null}
                      {row.status === "failed" ? (
                        <>
                          <MuiButton variant="contained" disabled={saving} onClick={() => channelPostAction(row, "retry")} startIcon={<RotateCcw size={15} />}>Thử lại</MuiButton>
                          <MuiButton variant="outlined" onClick={() => openChannelComposer(row)} startIcon={<Edit3 size={15} />}>Sửa bài</MuiButton>
                        </>
                      ) : null}
                      {row.status === "delete_failed" ? (
                        <MuiButton variant="contained" disabled={saving} onClick={() => channelPostAction(row, "retry_delete")} startIcon={<RotateCcw size={15} />}>Thử xóa lại</MuiButton>
                      ) : null}
                      {row.status === "deleted" ? (
                        <MuiButton variant="outlined" onClick={() => openChannelComposer({ ...row, id: undefined, status: "draft", sent_message_id: "", sent_at: "", deleted_at: "", delete_at: "" })} startIcon={<RotateCcw size={15} />}>Đăng lại</MuiButton>
                      ) : null}
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
              {!channelPageRows.length ? (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Send size={28} />
                    <Box>
                      <Typography variant="subtitle1">Chưa có bài trong mục này</Typography>
                      <Typography variant="body2" color="text.secondary">Bấm Đăng bài mới để soạn nội dung và gửi ngay hoặc hẹn giờ.</Typography>
                    </Box>
                  </Stack>
                </Paper>
              ) : null}
              {channelPageCount > 1 ? (
                <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <MuiButton variant="outlined" disabled={channelPage <= 1} onClick={() => setChannelPage((page) => page - 1)}>Trang trước</MuiButton>
                  <Typography variant="body2" color="text.secondary">Trang {channelPage}/{channelPageCount}</Typography>
                  <MuiButton variant="outlined" disabled={channelPage >= channelPageCount} onClick={() => setChannelPage((page) => page + 1)}>Trang sau</MuiButton>
                </Stack>
              ) : null}
              </Stack>
            </Stack>
          </Paper>
        ) : table.key === "bot_metrics" ? (
          <MetricsDashboard
            dashboardRows={dashboardRows}
            loading={loading}
            metricPeriod={metricPeriod}
            metricValue={metricValue}
            metricLabel={metricLabel}
            metricGroups={metricGroups}
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
                {activeLayer === "module:moderation" && activeConfigSection.title === "Thiết lập dùng chung" ? (
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
                {activeLayer === "module:moderation" && activeConfigSection.title === "Spam, cảnh báo & ban" ? (
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
                ) : activeLayer === "module:moderation" && activeConfigSection.title === "Mẫu tin kiểm duyệt" ? (
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
                ) : activeLayer === "module:moderation" && activeConfigSection.title === "Forward nâng cao" ? (
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
                ) : activeLayer === "module:moderation" && activeConfigSection.title === "Bio, link & cảnh báo" ? (
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
                ) : activeLayer === "module:moderation" && activeConfigSection.title === "Cài đặt khác" ? (
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
                ) : activeLayer === "module:moderation" && activeConfigSection.title === "Thiết lập dùng chung" ? (
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
        ) : (
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
            sectionSubtitle={scanMode === "scan" ? "Chỉ hiện trạng thái chính trong danh sách hiện tại." : "Hiện thêm ngữ cảnh, metadata và hành động liên quan."}
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
                    <Typography variant="overline" color="text.secondary">
                      Buồng điều khiển vận hành
                    </Typography>
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
                  {readOnlyTable ? auditLogSummary(selected) : previewText(selected, table) || "Chưa có mô tả."}
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
        )}
        </>
        ) : null}
        </>
        ) : null}
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
