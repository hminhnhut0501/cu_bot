import { Box, Button as MuiButton, Chip, Paper, Stack, Typography } from "@mui/material";
import { Check, ClipboardList, Plus, ShieldCheck, Sparkles, Users, Bot, X } from "lucide-react";
import { UI_COPY } from "@/lib/uiCopy";

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
type ProtectionState = { enabledChecks: number; totalChecks: number; ready: boolean; warnings: string[] };

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
    <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }} component="section">
      <Stack spacing={2}>
        <Box>
          <Typography variant="overline" color="primary.main">{c.eyebrow}</Typography>
          <Typography variant="h6">{c.title}</Typography>
          <Typography variant="body2" color="text.secondary">{c.body}</Typography>
        </Box>
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
      </Stack>
    </Paper>
  );
}

export function ModerationScreen(props: {
  selectedGroupProtection: ProtectionState;
  moderationPolicySummary: SummaryItem[];
  startGroupProtectionFlow: () => void;
  openTaskData: (key: string) => void;
  goToInsight: (insight: any) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  const c = UI_COPY.workbench.moderation;
  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }} component="section">
      <Stack spacing={2}>
        <Box>
          <Typography variant="overline" color="primary.main">{c.eyebrow}</Typography>
          <Typography variant="h6">{c.title}</Typography>
          <Typography variant="body2" color="text.secondary">{c.body}</Typography>
        </Box>
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
      </Stack>
    </Paper>
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
    <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }} component="section">
      <Stack spacing={2}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
          <Box>
            <Typography variant="overline" color="primary.main">{c.eyebrow}</Typography>
            <Typography variant="h6">{c.title}</Typography>
            <Typography variant="body2" color="text.secondary">{c.body}</Typography>
          </Box>
          <Paper variant="outlined" sx={{ px: 2, py: 1, bgcolor: "background.default" }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{props.pendingScamReports}</Typography>
            <Typography variant="caption" color="text.secondary">{c.pending}</Typography>
          </Paper>
        </Box>
        <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, minmax(0, 1fr))" } }}>
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}><Typography variant="caption">{c.waiting}</Typography><Typography variant="h6">{props.scamWorkbenchRows.filter((row) => String(row.status || "pending") === "pending").length}</Typography></Paper>
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}><Typography variant="caption">{c.confirmed}</Typography><Typography variant="h6">{props.scamWorkbenchRows.filter((row) => row.status === "confirmed").length}</Typography></Paper>
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}><Typography variant="caption">{c.rejected}</Typography><Typography variant="h6">{props.scamWorkbenchRows.filter((row) => row.status === "rejected").length}</Typography></Paper>
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}><Typography variant="caption">{c.bot}</Typography><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{props.currentBotName || props.selectedBot || "Tất cả"}</Typography></Paper>
        </Box>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
          <Stack spacing={1.5}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="h6">{c.queue}</Typography>
                <Typography variant="body2" color="text.secondary">{c.priority}</Typography>
              </Box>
              <MuiButton variant="contained" onClick={() => { props.openTaskData("scam_reports"); props.setQuickFilter("pending"); }}>
                {c.open}
              </MuiButton>
            </Box>
            <Stack spacing={1}>
              {props.scamWorkbenchRows.filter((row) => String(row.status || "pending") === "pending").slice(0, 4).map((row) => (
                <Paper key={row.id || `${row.target_uid}-${row.target_username}`} variant="outlined" sx={{ p: 1.5, bgcolor: "background.paper" }}>
                  <Typography variant="subtitle2">{row.target_username || row.target_uid || row.bank_account || c.targetUnknown}</Typography>
                  <Typography variant="body2" color="text.secondary">{row.evidence ? c.hasEvidence : c.noEvidence}</Typography>
                  <Typography variant="caption" color="text.secondary">{c.report}: {row.reporter_username || row.reporter_user_id || "Chưa rõ"}</Typography>
                </Paper>
              ))}
              {!props.scamWorkbenchRows.some((row) => String(row.status || "pending") === "pending") ? <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}><Check size={20} />{c.noPending}</Typography> : null}
            </Stack>
          </Stack>
        </Paper>
        <MuiButton variant="outlined" onClick={() => props.openTaskData("scam_reports")} startIcon={<ClipboardList size={17} />}>{c.review}</MuiButton>
      </Stack>
    </Paper>
  );
}

export function BotScreen(props: {
  setupChecklist: ChecklistItem[];
  openTaskData: (key: string) => void;
  selectLayer: (key: string) => void;
}) {
  const c = UI_COPY.workbench.bot;
  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }} component="section">
      <Stack spacing={2}>
        <Box>
          <Typography variant="overline" color="primary.main">{c.eyebrow}</Typography>
          <Typography variant="h6">{c.title}</Typography>
          <Typography variant="body2" color="text.secondary">{c.body}</Typography>
        </Box>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {props.setupChecklist.filter((item) => item.done).length}/{props.setupChecklist.length}
          </Typography>
          <Typography variant="caption" color="text.secondary">trạng thái sẵn sàng</Typography>
        </Paper>
      </Stack>
    </Paper>
  );
}

export function GroupScreen(props: {
  setupIssues: any[];
  setupChecklist: ChecklistItem[];
  selectedScopeRow: { group_name?: string } | null;
  selectedScope: string;
  openTaskData: (key: string) => void;
  selectLayer: (key: string) => void;
}) {
  const c = UI_COPY.workbench.group;
  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }} component="section">
      <Stack spacing={2}>
        <Box>
          <Typography variant="overline" color="primary.main">{c.eyebrow}</Typography>
          <Typography variant="h6">{c.title}</Typography>
          <Typography variant="body2" color="text.secondary">{c.body}</Typography>
        </Box>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
          <Typography variant="h6">{props.selectedScopeRow ? props.selectedScopeRow.group_name || props.selectedScope : "Toàn hệ thống"}</Typography>
          <Typography variant="caption" color="text.secondary">
            {props.setupChecklist.filter((item) => item.done).length}/{props.setupChecklist.length} sẵn sàng
          </Typography>
        </Paper>
      </Stack>
    </Paper>
  );
}

export function InspectorPanel(props: {
  readOnlyTable: boolean;
  selected: { enabled?: boolean } & Record<string, unknown>;
  table: { key: string } & Record<string, unknown>;
  showAdvancedFields: boolean;
  detailRows: Array<{ key?: string; label: string; value: string }>;
  advancedDetailRows: Array<{ key: string; label: string; value: string }>;
  auditLogRows: Array<{ key?: string; label: string; value: string }>;
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
    <div className="inspector-shell">
      <section className="inspector-section">
        <h4>{props.readOnlyTable ? c.readDetail : c.editDetail}</h4>
        <div className="inspector-grid">
          {(props.readOnlyTable ? props.auditLogRows : props.detailRows).map((item) => (
            <span key={String("key" in item ? item.key : item.label)}>
              <b>{item.label}</b>
              {item.value}
            </span>
          ))}
        </div>
      </section>
      {props.showAdvancedFields && !props.readOnlyTable ? (
        <section className="inspector-section advanced-section">
          <h4>Advanced</h4>
          <div className="inspector-grid">
            {props.advancedDetailRows.map((item) => (
              <span key={item.key}>
                <b>{item.label}</b>
                {item.value}
              </span>
            ))}
            {!props.advancedDetailRows.length ? <span>{c.noField}</span> : null}
          </div>
        </section>
      ) : null}
      {!props.readOnlyTable ? (
        <>
          <section className="inspector-section">
            <h4>{c.runtime}</h4>
            <div className="diagnostic-grid">
              <span className="ok">Đã tải</span>
              <span className="ok">Đã xác định</span>
              <span className={props.selectedEnabled === false ? "warn" : "ok"}>{props.selectedEnabled === false ? "Tắt" : "Bật"}</span>
            </div>
          </section>
          <section className="inspector-section">
            <h4>Hoạt động</h4>
            <div className="activity-stream">{props.cockpitActivity.map((item) => <span key={item}><i />{item}</span>)}</div>
          </section>
          <section className="inspector-section suggestion-box">
            <h4>{c.step}</h4>
            <p>{props.selectedEnabled === false ? "Bật nếu cần." : "Test hoặc logs."}</p>
          </section>
          <section className="inspector-section">
            <h4>Công cụ test</h4>
            <button type="button" className="ghost" onClick={props.onTest}>{c.test}</button>
          </section>
        </>
      ) : null}
    </div>
  );
}
