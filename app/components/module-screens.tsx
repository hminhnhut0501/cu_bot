import {
  Box,
  Button as MuiButton,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  Check,
  ClipboardList,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
  Bot,
  X,
  Activity,
  Wrench,
  FlaskConical,
} from "lucide-react";
import { UI_COPY } from "@/lib/uiCopy";
import Section from "@/app/components/ui/Section";
import StatCard from "@/app/components/ui/StatCard";
import KeyValue from "@/app/components/ui/KeyValue";
import EmptyState from "@/app/components/ui/EmptyState";

type ScheduleReadiness = {
  ready: boolean;
  pending: string;
  hasBot: boolean;
  hasGroup: boolean;
  hasMessagePool: boolean;
  hasVideoPool: boolean;
};

type NamedRow = {
  id?: string | number;
  message?: string;
  content?: string;
  from_chat_id?: string | number;
  message_id?: string | number;
  target_uid?: string | number;
  target_username?: string;
  bank_account?: string;
  evidence?: unknown;
  reporter_username?: string;
  reporter_user_id?: string | number;
  status?: string;
};

type ChecklistItem = { label: string; detail: string; done: boolean };
type SummaryItem = { label: string; value: string };
type ProtectionState = {
  enabledChecks: number;
  totalChecks: number;
  ready: boolean;
  warnings: string[];
};

export function AutomationScreen(props: {
  scheduleReadiness: ScheduleReadiness;
  scheduleIssues: string[];
  scheduleSubject: { group_name?: string; group_id?: string; daily_window_start?: string; daily_window_end?: string };
  selectedScope: string;
  scheduleMessagePool: string;
  scheduleMessagePreview: NamedRow[];
  scheduleVideoPool: string;
  scheduleVideoPreview: NamedRow[];
  goToScheduleContent: (key: "messages" | "video_messages") => void;
  startScheduledMessageFlow: () => void;
  lookupsGroupsLength: number;
}) {
  const c = UI_COPY.workbench.automation;
  return (
    <Section
      eyebrow={c.eyebrow}
      title={c.title}
      subtitle={c.body}
    >
      <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
        <Stack spacing={1.25}>
          <Typography variant="subtitle2">{c.schedule}</Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {props.scheduleIssues.length ? `${props.scheduleIssues.length} ${c.schedulePending}` : c.scheduleReady}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Đích: {props.scheduleSubject.group_name || props.scheduleSubject.group_id || props.selectedScope || "Toàn hệ thống"} · Giờ: {props.scheduleSubject.daily_window_start || "09:00"} - {props.scheduleSubject.daily_window_end || "09:00"}
          </Typography>
          <MuiButton variant="contained" onClick={props.startScheduledMessageFlow} sx={{ alignSelf: "flex-start" }}>
            {props.lookupsGroupsLength ? c.setTime : c.addGroup}
          </MuiButton>
        </Stack>
      </Paper>
    </Section>
  );
}

export function ModerationScreen(props: {
  selectedGroupProtection: ProtectionState;
  moderationPolicySummary: SummaryItem[];
  startGroupProtectionFlow: () => void;
  openTaskData: (key: string) => void;
  goToInsight: (insight: { targetLayer: string; targetTable: string }) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  const c = UI_COPY.workbench.moderation;
  return (
    <Section
      eyebrow={c.eyebrow}
      title={c.title}
      subtitle={c.body}
    >
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Chip
          label="Thiết lập dùng chung"
          color={props.activeTab === "Thiết lập dùng chung" ? "primary" : "default"}
          variant={props.activeTab === "Thiết lập dùng chung" ? "filled" : "outlined"}
          onClick={() => props.setActiveTab("Thiết lập dùng chung")}
          clickable
        />
        <Chip label="Quản lý từ khóa" variant="outlined" onClick={() => props.openTaskData("keywords")} clickable />
        <Chip label="Domain nguy hiểm" variant="outlined" onClick={() => props.openTaskData("domain_blacklist")} clickable />
        <Chip label="Link rút gọn" variant="outlined" onClick={() => props.openTaskData("link_shorteners")} clickable />
        <Chip label="Bot tin cậy" variant="outlined" onClick={() => props.openTaskData("bot_allowlist")} clickable />
        <Chip label="Logs" variant="outlined" onClick={() => props.goToInsight({ targetLayer: "logs", targetTable: "audit_logs" })} clickable />
      </Box>
    </Section>
  );
}

export function ScamScreen(props: {
  pendingScamReports: number;
  scamWorkbenchRows: NamedRow[];
  currentBotName: string;
  selectedBot: string;
  openTaskData: (key: string) => void;
  setQuickFilter: (value: string) => void;
}) {
  const c = UI_COPY.workbench.scam;
  return (
    <Section
      eyebrow={c.eyebrow}
      title={c.title}
      subtitle={c.body}
      actions={
        <Paper variant="outlined" sx={{ px: 2, py: 1, bgcolor: "background.default" }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>{props.pendingScamReports}</Typography>
          <Typography variant="caption" color="text.secondary">{c.pending}</Typography>
        </Paper>
      }
    >
      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, minmax(0, 1fr))" },
        }}
      >
        <StatCard
          compact
          label={c.waiting}
          value={props.scamWorkbenchRows.filter((row) => String(row.status || "pending") === "pending").length}
        />
        <StatCard
          compact
          label={c.confirmed}
          value={props.scamWorkbenchRows.filter((row) => row.status === "confirmed").length}
        />
        <StatCard
          compact
          label={c.rejected}
          value={props.scamWorkbenchRows.filter((row) => row.status === "rejected").length}
        />
        <StatCard
          compact
          label={c.bot}
          value={props.currentBotName || props.selectedBot || "Tất cả"}
        />
      </Box>
      <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
        <Stack spacing={1.5}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="h6">{c.queue}</Typography>
              <Typography variant="body2" color="text.secondary">{c.priority}</Typography>
            </Box>
            <MuiButton
              variant="contained"
              onClick={() => {
                props.openTaskData("scam_reports");
                props.setQuickFilter("pending");
              }}
            >
              {c.open}
            </MuiButton>
          </Box>
          <Stack spacing={1}>
            {props.scamWorkbenchRows
              .filter((row) => String(row.status || "pending") === "pending")
              .slice(0, 4)
              .map((row) => (
                <Paper
                  key={row.id || `${row.target_uid}-${row.target_username}`}
                  variant="outlined"
                  sx={{ p: 1.5, bgcolor: "background.paper" }}
                >
                  <Typography variant="subtitle2">
                    {row.target_username || row.target_uid || row.bank_account || c.targetUnknown}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {row.evidence ? c.hasEvidence : c.noEvidence}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {c.report}: {row.reporter_username || row.reporter_user_id || "Chưa rõ"}
                  </Typography>
                </Paper>
              ))}
            {!props.scamWorkbenchRows.some((row) => String(row.status || "pending") === "pending") ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Check size={20} />
                {c.noPending}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
      </Paper>
      <Box>
        <MuiButton
          variant="outlined"
          onClick={() => props.openTaskData("scam_reports")}
          startIcon={<ClipboardList size={17} />}
        >
          {c.review}
        </MuiButton>
      </Box>
    </Section>
  );
}

export function BotScreen(props: {
  setupChecklist: ChecklistItem[];
  openTaskData: (key: string) => void;
  selectLayer: (key: string) => void;
}) {
  const c = UI_COPY.workbench.bot;
  return (
    <Section eyebrow={c.eyebrow} title={c.title} subtitle={c.body}>
      <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          {props.setupChecklist.filter((item) => item.done).length}/{props.setupChecklist.length}
        </Typography>
        <Typography variant="caption" color="text.secondary">trạng thái sẵn sàng</Typography>
      </Paper>
    </Section>
  );
}

export function GroupScreen(props: {
  setupIssues: string[];
  setupChecklist: ChecklistItem[];
  selectedScopeRow: { group_name?: string } | null;
  selectedScope: string;
  openTaskData: (key: string) => void;
  selectLayer: (key: string) => void;
}) {
  const c = UI_COPY.workbench.group;
  return (
    <Section eyebrow={c.eyebrow} title={c.title} subtitle={c.body}>
      <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
        <Typography variant="h6">
          {props.selectedScopeRow
            ? props.selectedScopeRow.group_name || props.selectedScope
            : "Toàn hệ thống"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {props.setupChecklist.filter((item) => item.done).length}/{props.setupChecklist.length} sẵn sàng
        </Typography>
      </Paper>
    </Section>
  );
}

type InspectorDetailRow = { key?: string; label: string; value: string };

export function InspectorPanel(props: {
  readOnlyTable: boolean;
  selected: { enabled?: boolean } & Record<string, unknown>;
  table: { key: string } & Record<string, unknown>;
  showAdvancedFields: boolean;
  detailRows: InspectorDetailRow[];
  advancedDetailRows: InspectorDetailRow[];
  auditLogRows: InspectorDetailRow[];
  cockpitActivity: string[];
  selectedEnabled: boolean | undefined;
  onToggleAdvanced: () => void;
  onStartEdit: () => void;
  onConfirm: () => void;
  onReject: () => void;
  onDelete: () => void;
  onTest: () => void;
  noticeText: string;
}) {
  const c = UI_COPY.inspector;

  return (
    <Stack spacing={2}>
      <Section
        title={props.readOnlyTable ? c.readDetail : c.editDetail}
        padding={2}
        bodySpacing={1.5}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
            gap: 1.25,
          }}
        >
          {(props.readOnlyTable ? props.auditLogRows : props.detailRows).map((item) => (
            <KeyValue
              key={String("key" in item ? item.key : item.label)}
              label={item.label}
              value={item.value}
              layout="stacked"
            />
          ))}
        </Box>
      </Section>

      {props.showAdvancedFields && !props.readOnlyTable ? (
        <Section title="Advanced" padding={2} bodySpacing={1.5}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
              gap: 1.25,
            }}
          >
            {props.advancedDetailRows.map((item) => (
              <KeyValue key={item.key} label={item.label} value={item.value} />
            ))}
            {!props.advancedDetailRows.length ? (
              <Typography variant="body2" color="text.secondary">
                {c.noField}
              </Typography>
            ) : null}
          </Box>
        </Section>
      ) : null}

      {!props.readOnlyTable ? (
        <>
          <Section title={c.runtime} padding={2} bodySpacing={1.5}>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip label="Đã tải" color="success" size="small" />
              <Chip label="Đã xác định" color="success" size="small" />
              <Chip
                label={props.selectedEnabled === false ? "Tắt" : "Bật"}
                color={props.selectedEnabled === false ? "warning" : "success"}
                size="small"
              />
            </Box>
          </Section>

          <Section title="Hoạt động" padding={2} bodySpacing={1.5}>
            {props.cockpitActivity.length === 0 ? (
              <EmptyState title="Chưa có hoạt động" body="Hành động vận hành sẽ hiện ở đây." icon={<Activity size={20} />} />
            ) : (
              <Stack spacing={0.75}>
                {props.cockpitActivity.map((item) => (
                  <Box
                    key={item}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.25,
                      p: 1,
                      borderRadius: 1,
                      bgcolor: "background.default",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "primary.main", flexShrink: 0 }} />
                    <Typography variant="body2">{item}</Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Section>

          <Section title={c.step} padding={2} bodySpacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              {props.selectedEnabled === false ? "Bật nếu cần." : "Test hoặc logs."}
            </Typography>
          </Section>

          <Section title="Công cụ test" padding={2} bodySpacing={1.5}>
            <MuiButton
              variant="outlined"
              onClick={props.onTest}
              startIcon={<FlaskConical size={16} />}
            >
              {c.test}
            </MuiButton>
          </Section>
        </>
      ) : null}
    </Stack>
  );
}
