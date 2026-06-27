import { TableConfig } from "@/lib/tables";
import { Activity, Archive, Bot, CalendarClock, MessageSquare, Send, ShieldCheck, Sparkles } from "lucide-react";

type Row = Record<string, any>;

export type CommandInsight = {
  severity: "critical" | "high" | "warning" | "info" | "healthy";
  title: string;
  body: string;
  impact: string;
  action: string;
  targetLayer: string;
  targetTable: string;
};

export type WorkflowCard = {
  id: string;
  title: string;
  outcome: string;
  description: string;
  priority: string;
  targetLayer: string;
  targetTable: string;
};

export type WorkflowTask = WorkflowCard & {
  desc: string;
  meta: string;
  tone: string;
  icon: any;
  action: () => void;
};

function actionLabel(value: unknown) {
  const action = String(value || "").toLowerCase();
  const labels: Record<string, string> = {
    warn: "Cảnh báo",
    delete: "Xóa",
    restrict: "Hạn chế",
    ban: "Ban",
    mute: "Mute",
    kick: "Kick",
    allow: "Cho phép"
  };
  return labels[action] || String(value || "Chưa rõ");
}

export function buildScopeCrumbs(args: {
  currentBotName: string;
  selectedBot: string;
  selectedGroupName: string;
  selectedGroup: string;
  activeLayerTitle: string;
  tableLabel: string;
  tableTaskLabel: string | undefined;
}) {
  return [
    { label: "Bot", value: args.currentBotName || args.selectedBot || "Tất cả bot" },
    { label: "Phạm vi", value: args.selectedGroupName || args.selectedGroup || "Toàn hệ thống" },
    { label: "Khu vực", value: args.activeLayerTitle },
    { label: "Việc", value: args.tableTaskLabel || args.tableLabel || "Chưa chọn" }
  ];
}

export function buildModerationPolicySummary(settingsMap: Map<string, string>) {
  return [
    { label: "Forward", value: settingsMap.get("delete_forwarded_messages") === "false" ? "Cho phép" : actionLabel(settingsMap.get("forward_action") || "warn") },
    { label: "Spam", value: `${settingsMap.get("spam_max_messages") || "6"} tin / ${settingsMap.get("spam_window_seconds") || "12"} giây` },
    { label: "Nội dung lặp", value: settingsMap.get("duplicate_message_enabled") === "false" ? "Tắt" : actionLabel(settingsMap.get("duplicate_message_action") || "warn") },
    { label: "Bio có link", value: settingsMap.get("scan_bio_links") === "false" ? "Không quét" : "Quét và xử lý" },
    { label: "Text link", value: settingsMap.get("scan_text_link") === "false" ? "Tắt" : actionLabel(settingsMap.get("text_link_action") || settingsMap.get("hidden_link_action") || "warn") },
    { label: "Text mention", value: settingsMap.get("scan_text_mention") === "false" ? "Tắt" : actionLabel(settingsMap.get("text_mention_action") || settingsMap.get("hidden_link_action") || "warn") },
    { label: "@user nội bộ", value: settingsMap.get("allow_in_group_mentions") === "false" ? "Chặn" : "Cho phép" }
  ];
}

export function buildScamWorkbenchRows(args: {
  tableKey?: string;
  visibleRows: Row[];
  scamReports: Row[];
  selectedBot: string;
}) {
  return args.tableKey === "scam_reports"
    ? args.visibleRows
    : args.scamReports.filter((row) => !args.selectedBot || !row.bot_key || row.bot_key === args.selectedBot);
}

export function buildGroupEditorTabs(args: {
  table: TableConfig;
  activeLayer: string;
  showAdvancedFields: boolean;
  activeGroupTab: string;
  groupedFields: (table: TableConfig) => [string, any[]][];
  allowedGroupSectionsForLayer: (activeLayer: string) => Set<string>;
  fieldIsAdvanced: (tableKey: string, fieldKey: string) => boolean;
  groupTabLabel: (section: string) => string;
  sortGroupFieldGroups: (groups: [string, any[]][]) => [string, any[]][];
  groupTabOrder: string[];
}) {
  const allowedSections = args.allowedGroupSectionsForLayer(args.activeLayer);
  const labels = new Map<string, { key: string; label: string; count: number }>();
  for (const [section, fields] of args.groupedFields(args.table)) {
    if (!allowedSections.has(section)) continue;
    const label = args.groupTabLabel(section);
    const visibleCount = fields.filter((field) => args.showAdvancedFields || !args.fieldIsAdvanced(args.table.key, field.key)).length;
    const current = labels.get(label);
    labels.set(label, { key: current?.key || section, label, count: (current?.count || 0) + visibleCount });
  }
  return args.groupTabOrder
    .map((section) => args.groupTabLabel(section))
    .filter((label, index, all) => all.indexOf(label) === index)
    .map((label) => labels.get(label) || { key: label, label, count: 0 })
    .filter((tab) => tab.count || tab.label === "Kỹ thuật");
}

export function buildEditorFieldGroups(args: {
  table: TableConfig | undefined;
  activeLayer: string;
  activeGroupTab: string;
  showAdvancedFields: boolean;
  groupedFields: (table: TableConfig) => [string, any[]][];
  allowedGroupSectionsForLayer: (activeLayer: string) => Set<string>;
  fieldIsAdvanced: (tableKey: string, fieldKey: string) => boolean;
  groupTabLabel: (section: string) => string;
  sortGroupFieldGroups: (groups: [string, any[]][]) => [string, any[]][];
}) {
  if (!args.table) return [];
  const groups = args.groupedFields(args.table);
  let visibleGroups = groups;
  if (args.table.key === "groups") {
    const allowed = args.allowedGroupSectionsForLayer(args.activeLayer);
    visibleGroups = groups
      .map(([section, fields]) => [section, fields.filter(() => allowed.has(section))] as [string, any[]])
      .filter(([section]) => args.groupTabLabel(section) === args.activeGroupTab)
      .filter(([, fields]) => fields.length);
  }
  if (args.table.key === "groups" && args.activeGroupTab === "Kỹ thuật") {
    visibleGroups = groups.filter(([section]) => ["Ghi chú", "Advanced"].includes(section));
  }
  return args.sortGroupFieldGroups(visibleGroups)
    .map(([section, fields]) => {
      const nextFields = fields.filter((field) => args.showAdvancedFields || !args.fieldIsAdvanced(args.table!.key, field.key));
      const sectionName = fields.every((field) => args.fieldIsAdvanced(args.table!.key, field.key)) ? args.groupTabLabel("Advanced") : args.groupTabLabel(section);
      return [sectionName, nextFields] as [string, any[]];
    })
    .filter(([, fields]) => fields.length);
}

export function filterVisibleRows(args: {
  rows: Row[];
  tableKey?: string;
  selectedBot: string;
  selectedGroup: string;
  quickFilter: string;
  rowMatchesQuickFilter: (row: Row, filter: string) => boolean;
}) {
  return args.rows.filter((row) => {
    if (args.tableKey === "scam_reports") {
      if (args.selectedBot && row.bot_key && row.bot_key !== args.selectedBot) {
        return false;
      }
      if (args.selectedGroup) {
        const rowGroup = String(row.group_id || row.chat_id || row.source_chat_id || row.invitee_chat_id || "");
        if (rowGroup && rowGroup !== args.selectedGroup) return false;
      }
      return true;
    }
    if (args.tableKey === "bots" && args.selectedBot && row.bot_key !== args.selectedBot) {
      return false;
    }
    if (args.tableKey !== "bots" && args.selectedBot && row.bot_key && row.bot_key !== args.selectedBot) {
      return false;
    }
    if (args.selectedGroup) {
      const rowGroup = String(row.group_id || row.chat_id || row.source_chat_id || row.invitee_chat_id || "");
      if (rowGroup && rowGroup !== args.selectedGroup) return false;
    }
    return args.rowMatchesQuickFilter(row, args.quickFilter);
  });
}

export function buildCommandInsights(args: {
  disabledBots: number;
  groups: number;
  missingSetup: number;
  pendingScamReports: number;
  deleteFailures: number;
}): CommandInsight[] {
  const insights: CommandInsight[] = [];
  if (args.disabledBots) {
    insights.push({
      severity: "critical",
      title: `${args.disabledBots} bot đang offline`,
      body: "Kiểm tra token và trạng thái.",
      impact: "Runtime đang giảm.",
      action: "Kiểm tra bot",
      targetLayer: "bot",
      targetTable: "bots"
    });
  }
  if (!args.groups) {
    insights.push({
      severity: "warning",
      title: "Chưa có group hoạt động",
      body: "Nối bot với group trước.",
      impact: "Chưa có phạm vi điều khiển.",
      action: "Kết nối nhóm",
      targetLayer: "group",
      targetTable: "groups"
    });
  }
  if (args.missingSetup) {
    insights.push({
      severity: "info",
      title: `${args.missingSetup} bước setup còn thiếu`,
      body: "Bổ sung env, group và pool còn thiếu.",
      impact: "Setup chưa xong.",
      action: "Setup nhanh",
      targetLayer: "modules",
      targetTable: "module_settings"
    });
  }
  if (args.pendingScamReports) {
    insights.push({
      severity: "warning",
      title: `${args.pendingScamReports} report scam chờ duyệt`,
      body: "Duyệt hoặc từ chối report.",
      impact: "Cần xử lý ngay.",
      action: "Duyệt scam",
      targetLayer: "module:anti_scam",
      targetTable: "scam_reports"
    });
  }
  if (args.deleteFailures) {
    insights.push({
      severity: "warning",
      title: `${args.deleteFailures} lỗi xóa tin hệ thống gần đây`,
      body: "Kiểm tra quyền xóa và timing.",
      impact: "Có thể còn sót message hệ thống.",
      action: "Mở nhật ký",
      targetLayer: "logs",
      targetTable: "audit_logs"
    });
  }
  insights.push({
    severity: "info",
    title: "Theo dõi thành viên ra vào nhóm",
    body: "Mở màn Thành viên để xem lịch sử join và out theo từng group.",
    impact: "Dễ kiểm tra biến động thành viên của bot.",
    action: "Mở thành viên",
    targetLayer: "members",
    targetTable: "audit_logs"
  });
  if (!insights.length) {
    insights.push({
      severity: "healthy",
      title: "Hệ thống ổn định",
      body: "Không có vấn đề nổi bật.",
      impact: "Trạng thái ổn định.",
      action: "Xem hoạt động",
      targetLayer: "logs",
      targetTable: "audit_logs"
    });
  }
  return insights.slice(0, 3);
}

export function buildLiveActivity(args: {
  enabledModules: number;
  groups: number;
  visibleCount: number;
  issues: number;
  pendingScamReports: number;
  deleteFailures: number;
  offModules: number;
}) {
  return [
    { severity: args.issues ? "warning" : "healthy", text: `${args.enabledModules} module / ${args.groups} group` },
    { severity: "info", text: `${args.visibleCount} mục` },
    { severity: args.issues ? "critical" : "healthy", text: args.issues ? `${args.issues} lỗi cần kiểm tra` : "Không có lỗi nghiêm trọng" },
    { severity: args.pendingScamReports ? "warning" : "info", text: args.pendingScamReports ? `${args.pendingScamReports} report chờ duyệt` : "Không có report pending" },
    { severity: args.deleteFailures ? "warning" : "info", text: args.deleteFailures ? `${args.deleteFailures} lỗi xóa gần đây` : "Không có lỗi xóa gần đây" },
    { severity: "info", text: args.offModules ? `${args.offModules} module ẩn` : "Sidebar gọn" }
  ];
}

export function buildOperationTasks(args: {
  adminTasks: WorkflowCard[];
  setupIssues: number;
  groups: number;
  messagePoolCount: number;
  videoPoolCount: number;
  pendingScamReports: number;
  startScheduledMessageFlow: () => void;
  goToInsight: (task: WorkflowCard) => void;
  setQuickFilter: (value: string) => void;
}): WorkflowTask[] {
  const icons: Record<string, typeof Activity> = {
    "connect-bot": Bot,
    "protect-community": ShieldCheck,
    "publish-content": Send,
    "schedule-content": CalendarClock,
    "review-incidents": Activity,
    "review-scam": Archive,
    "build-auto-reply": MessageSquare,
    "manage-modules": Sparkles
  };
  return args.adminTasks.map((task) => {
    let metaText = task.outcome;
    let tone = task.priority === "high" ? "info" : "healthy";
    if (task.id === "connect-bot") {
      metaText = args.setupIssues ? `${args.setupIssues} bước còn thiếu` : "Đủ điều kiện nền";
      tone = args.setupIssues ? "warning" : "healthy";
    } else if (task.id === "protect-community") {
      metaText = `${args.groups} group trong phạm vi`;
      tone = args.groups ? "healthy" : "warning";
    } else if (task.id === "schedule-content") {
      metaText = `${args.messagePoolCount + args.videoPoolCount} pool khả dụng`;
      tone = args.messagePoolCount || args.videoPoolCount ? "healthy" : "warning";
    } else if (task.id === "review-scam") {
      metaText = args.pendingScamReports ? `${args.pendingScamReports} report chờ duyệt` : "Không có report pending";
      tone = args.pendingScamReports ? "scam" : "healthy";
    }
    return {
      ...task,
      desc: task.description,
      meta: metaText,
      icon: icons[task.id] || Activity,
      tone,
      action: () => {
        if (task.id === "schedule-content") {
          args.startScheduledMessageFlow();
          return;
        }
        args.goToInsight(task);
        if (task.id === "review-scam") {
          args.setQuickFilter("pending");
        }
      }
    };
  });
}
