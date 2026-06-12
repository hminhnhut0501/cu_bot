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
    <section className="module-screen module-screen-automation">
      <div className="module-screen-head">
        <div>
          <span className="eyebrow">{c.eyebrow}</span>
          <h3>{c.title}</h3>
          <p>{c.body}</p>
        </div>
      </div>
      <div className="schedule-flow-card">
        <h4>{c.schedule}</h4>
        <strong>{props.scheduleIssues.length ? `${props.scheduleIssues.length} ${c.schedulePending}` : c.scheduleReady}</strong>
        <p>Đích: {props.scheduleSubject.group_name || props.scheduleSubject.group_id || props.selectedScope || "Toàn hệ thống"} · Giờ: {props.scheduleSubject.daily_window_start || "09:00"} - {props.scheduleSubject.daily_window_end || "09:00"}</p>
        <button type="button" className="primary" onClick={props.startScheduledMessageFlow}>
          {props.lookupsGroupsLength ? c.setTime : c.addGroup}
        </button>
      </div>
    </section>
  );
}

export function ModerationScreen(props: {
  selectedGroupProtection: ProtectionState;
  moderationPolicySummary: SummaryItem[];
  hiddenLinksEnabled: boolean;
  scanTextLink: boolean;
  scanTextMention: boolean;
  allowInGroupMentions: boolean;
  hiddenLinkAction: string;
  startGroupProtectionFlow: () => void;
  openTaskData: (key: string) => void;
  goToInsight: (insight: any) => void;
  onToggleHiddenLinks: () => void;
  onToggleScanTextLink: () => void;
  onToggleScanTextMention: () => void;
  onToggleAllowInGroupMentions: () => void;
  onHiddenLinkActionChange: (value: string) => void;
}) {
  const c = UI_COPY.workbench.moderation;
  return (
    <section className="module-screen module-screen-moderation">
      <div className="module-screen-head">
        <div>
          <span className="eyebrow">{c.eyebrow}</span>
          <h3>{c.title}</h3>
          <p>{c.body}</p>
        </div>
        <div className="protection-score">
          <strong>{props.selectedGroupProtection.enabledChecks}/{props.selectedGroupProtection.totalChecks}</strong>
          <span>{props.selectedGroupProtection.ready ? c.ready : props.selectedGroupProtection.warnings[0]}</span>
        </div>
      </div>
      <section className="moderation-settings-strip moderation-settings-strip-compact">
        <div className="moderation-settings-actions moderation-settings-actions-grid moderation-compact-grid">
          <label className="toggle-field">
            <span>Chặn text_link</span>
            <button type="button" className={props.scanTextLink ? "toggle on" : "toggle off"} onClick={props.onToggleScanTextLink}>
              <span />
            </button>
          </label>
          <label className="toggle-field">
            <span>Chặn text_mention</span>
            <button type="button" className={props.scanTextMention ? "toggle on" : "toggle off"} onClick={props.onToggleScanTextMention}>
              <span />
            </button>
          </label>
          <label className="toggle-field">
            <span>Cho phép @user trong group</span>
            <button type="button" className={props.allowInGroupMentions ? "toggle on" : "toggle off"} onClick={props.onToggleAllowInGroupMentions}>
              <span />
            </button>
          </label>
          <label>
            <span>Cách xử lý</span>
            <select value={props.hiddenLinkAction} onChange={(event) => props.onHiddenLinkActionChange(event.target.value)}>
              <option value="warn">Warn</option>
              <option value="delete">Delete</option>
              <option value="restrict">Restrict</option>
              <option value="ban">Ban</option>
            </select>
          </label>
        </div>
        <button type="button" className="primary" onClick={props.startGroupProtectionFlow}><ShieldCheck size={17} />Lưu</button>
      </section>
    </section>
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
    <section className="module-screen module-screen-scam">
      <div className="module-screen-head">
        <div>
          <span className="eyebrow">{c.eyebrow}</span>
          <h3>{c.title}</h3>
          <p>{c.body}</p>
        </div>
        <div className="task-workbench-score">
          <strong>{props.pendingScamReports}</strong>
          <span>{c.pending}</span>
        </div>
      </div>
      <section className="policy-summary-grid">
        <article><span>{c.waiting}</span><strong>{props.scamWorkbenchRows.filter((row) => String(row.status || "pending") === "pending").length}</strong></article>
        <article><span>{c.confirmed}</span><strong>{props.scamWorkbenchRows.filter((row) => row.status === "confirmed").length}</strong></article>
        <article><span>{c.rejected}</span><strong>{props.scamWorkbenchRows.filter((row) => row.status === "rejected").length}</strong></article>
        <article><span>{c.bot}</span><strong>{props.currentBotName || props.selectedBot || "Tất cả"}</strong></article>
      </section>
      <section className="review-queue-preview">
        <div className="review-queue-head"><div><h3>{c.queue}</h3><p>{c.priority}</p></div><button type="button" className="primary" onClick={() => { props.openTaskData("scam_reports"); props.setQuickFilter("pending"); }}>{c.open}</button></div>
        <div className="review-queue-list">
          {props.scamWorkbenchRows.filter((row) => String(row.status || "pending") === "pending").slice(0, 4).map((row) => (
            <article key={row.id || `${row.target_uid}-${row.target_username}`}>
              <strong>{row.target_username || row.target_uid || row.bank_account || c.targetUnknown}</strong>
              <span>{row.evidence ? c.hasEvidence : c.noEvidence}</span>
              <small>{c.report}: {row.reporter_username || row.reporter_user_id || "Chưa rõ"}</small>
            </article>
          ))}
          {!props.scamWorkbenchRows.some((row) => String(row.status || "pending") === "pending") ? <div className="workbench-empty"><Check size={20} />{c.noPending}</div> : null}
        </div>
      </section>
      <section className="workbench-footer-actions">
        <button type="button" className="primary" onClick={() => props.openTaskData("scam_reports")}><ClipboardList size={17} />{c.review}</button>
      </section>
    </section>
  );
}

export function BotScreen(props: {
  setupChecklist: ChecklistItem[];
  openTaskData: (key: string) => void;
  selectLayer: (key: string) => void;
}) {
  const c = UI_COPY.workbench.bot;
  return (
    <section className="module-screen module-screen-bot">
      <div className="module-screen-head">
        <div>
          <span className="eyebrow">{c.eyebrow}</span>
          <h3>{c.title}</h3>
          <p>{c.body}</p>
        </div>
      </div>
      <div className="module-screen-mini">
        <strong>{props.setupChecklist.filter((item) => item.done).length}/{props.setupChecklist.length}</strong>
        <span>trạng thái sẵn sàng</span>
      </div>
    </section>
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
    <section className="module-screen module-screen-group">
      <div className="module-screen-head">
        <div>
          <span className="eyebrow">{c.eyebrow}</span>
          <h3>{c.title}</h3>
          <p>{c.body}</p>
        </div>
      </div>
      <div className="module-screen-mini">
        <strong>{props.selectedScopeRow ? props.selectedScopeRow.group_name || props.selectedScope : "Toàn hệ thống"}</strong>
        <span>{props.setupChecklist.filter((item) => item.done).length}/{props.setupChecklist.length} sẵn sàng</span>
      </div>
    </section>
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
