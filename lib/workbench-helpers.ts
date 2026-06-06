import { TableConfig } from "@/lib/tables";

type Row = Record<string, any>;

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
    { label: "Group", value: args.selectedGroupName || args.selectedGroup || "Tất cả group" },
    { label: "Khu vực", value: args.activeLayerTitle },
    { label: "Việc", value: args.tableTaskLabel || args.tableLabel || "Chưa chọn" }
  ];
}

export function buildModerationPolicySummary(settingsMap: Map<string, string>) {
  return [
    { label: "Forward", value: settingsMap.get("delete_forwarded_messages") === "false" ? "Cho phép" : actionLabel(settingsMap.get("forward_action") || "warn") },
    { label: "Spam", value: `${settingsMap.get("spam_max_messages") || "6"} tin / ${settingsMap.get("spam_window_seconds") || "12"} giây` },
    { label: "Nội dung lặp", value: settingsMap.get("duplicate_message_enabled") === "false" ? "Tắt" : actionLabel(settingsMap.get("duplicate_message_action") || "warn") },
    { label: "Bio có link", value: settingsMap.get("scan_bio_links") === "false" ? "Không quét" : "Quét và xử lý" }
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
