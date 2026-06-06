import { Check, ClipboardList, Plus, ShieldCheck, Sparkles, Users, Bot } from "lucide-react";
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
  selectedGroup: string;
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
        <button type="button" className="primary" onClick={props.startScheduledMessageFlow}>
          <Plus size={17} />
          {c.action}
        </button>
      </div>
      <div className="schedule-readiness schedule-readiness-compact">
        <strong>{props.scheduleReadiness.ready ? c.ready : c.check}</strong>
        <p>{props.scheduleReadiness.pending}</p>
        <div className="schedule-readiness-grid">
          <span className={props.scheduleReadiness.hasBot ? "ok" : "warn"}>{props.scheduleReadiness.hasBot ? c.bot : c.missingBot}</span>
          <span className={props.scheduleReadiness.hasGroup ? "ok" : "warn"}>{props.scheduleReadiness.hasGroup ? c.group : c.missingGroup}</span>
          <span className={props.scheduleReadiness.hasMessagePool ? "ok" : "warn"}>{props.scheduleReadiness.hasMessagePool ? c.tin : c.missingTin}</span>
          <span className={props.scheduleReadiness.hasVideoPool ? "ok" : "warn"}>{props.scheduleReadiness.hasVideoPool ? c.video : c.missingVideo}</span>
        </div>
      </div>
      <div className="module-screen-grid">
        <article className={props.scheduleIssues.length ? "schedule-status warning" : "schedule-status ready"}>
          <h4>{c.schedule}</h4>
          <strong>{props.scheduleIssues.length ? `${props.scheduleIssues.length} ${c.schedulePending}` : c.scheduleReady}</strong>
          <p>Group: {props.scheduleSubject.group_name || props.scheduleSubject.group_id || props.selectedGroup || "-"} · Giờ: {props.scheduleSubject.daily_window_start || "09:00"} - {props.scheduleSubject.daily_window_end || "09:00"}</p>
          {props.scheduleIssues.length ? <ul>{props.scheduleIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : null}
        </article>
        <article className="pool-preview">
          <div>
            <h4>{c.poolMessages}</h4>
            <button type="button" className="ghost" onClick={() => props.goToScheduleContent("messages")}>{c.open}</button>
          </div>
          <strong>{props.scheduleMessagePool || c.choosePool}</strong>
          <p>{props.scheduleMessagePreview.length} {c.tinCount}</p>
          <div className="pool-preview-list">
            {props.scheduleMessagePreview.slice(0, 3).map((row) => <span key={row.id || row.message}>{String(row.message || row.content || "")}</span>)}
            {!props.scheduleMessagePreview.length ? <span>{c.noMessages}</span> : null}
          </div>
        </article>
        <article className="pool-preview">
          <div>
            <h4>{c.poolVideos}</h4>
            <button type="button" className="ghost" onClick={() => props.goToScheduleContent("video_messages")}>{c.open}</button>
          </div>
          <strong>{props.scheduleVideoPool || c.choosePool}</strong>
          <p>{props.scheduleVideoPreview.length} {c.videoCount}</p>
          <div className="pool-preview-list">
            {props.scheduleVideoPreview.slice(0, 3).map((row) => <span key={row.id || `${row.from_chat_id}-${row.message_id}`}>{String(row.message || row.content || "")}</span>)}
            {!props.scheduleVideoPreview.length ? <span>{c.noVideos}</span> : null}
          </div>
        </article>
      </div>
      <div className="schedule-actions">
        <button type="button" className="secondary" onClick={() => props.goToScheduleContent("messages")}>{c.addMessages}</button>
        <button type="button" className="secondary" onClick={() => props.goToScheduleContent("video_messages")}>{c.addVideos}</button>
        <button type="button" className="primary" onClick={props.startScheduledMessageFlow}>{props.lookupsGroupsLength ? c.setTime : c.addGroup}</button>
      </div>
    </section>
  );
}

export function ModerationScreen(props: {
  selectedGroupProtection: ProtectionState;
  moderationPolicySummary: SummaryItem[];
  startGroupProtectionFlow: () => void;
  openTaskData: (key: string) => void;
  goToInsight: (insight: any) => void;
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
      <section className="policy-summary-grid">
        {props.moderationPolicySummary.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong></article>)}
      </section>
      <section className="guided-flow">
        <article><b>1</b><div><strong>{c.step1Title}</strong><p>{c.step1Body}</p></div><button type="button" onClick={() => props.openTaskData("keywords")}>{c.open}</button></article>
        <article><b>2</b><div><strong>{c.step2Title}</strong><p>{c.step2Body}</p></div><button type="button" onClick={() => props.openTaskData("keywords")}>{c.test}</button></article>
        <article><b>3</b><div><strong>{c.step3Title}</strong><p>{c.step3Body}</p></div><button type="button" onClick={() => props.goToInsight({ targetLayer: "logs", targetTable: "audit_logs" })}>{c.logs}</button></article>
      </section>
      <section className="workbench-footer-actions">
        <button type="button" className="primary" onClick={props.startGroupProtectionFlow}><ShieldCheck size={17} />{c.openProtection}</button>
        <button type="button" className="secondary" onClick={() => props.openTaskData("domain_blacklist")}>{c.dangerousLinks}</button>
        <button type="button" className="secondary" onClick={() => props.openTaskData("bot_allowlist")}>{c.botExceptions}</button>
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
        <button type="button" className="secondary" onClick={() => props.openTaskData("scam_entities")}>{c.profile}</button>
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
        <button type="button" className="primary" onClick={() => props.openTaskData("bots")}>
          <Plus size={17} />
          {c.connect}
        </button>
      </div>
      <section className="workbench-actions-grid">
        <button type="button" onClick={() => props.openTaskData("bots")}><Bot size={20} /><strong>{c.connect}</strong><span>{c.token}</span></button>
        <button type="button" onClick={() => props.openTaskData("admins")}><ShieldCheck size={20} /><strong>{c.permissions}</strong><span>{c.ownerMod}</span></button>
        <button type="button" onClick={() => props.selectLayer("modules")}><Sparkles size={20} /><strong>{c.module}</strong><span>{c.viewModules}</span></button>
      </section>
    </section>
  );
}

export function GroupScreen(props: {
  setupIssues: any[];
  setupChecklist: ChecklistItem[];
  selectedGroupRow: { group_name?: string } | null;
  selectedGroup: string;
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
        <button type="button" className="primary" onClick={() => props.openTaskData("groups")}>
          <Plus size={17} />
          {c.addGroup}
        </button>
      </div>
      <section className="workbench-actions-grid">
        <button type="button" onClick={() => props.openTaskData("groups")}><Users size={20} /><strong>{c.group}</strong><span>{c.addGroup}</span></button>
        <button type="button" onClick={() => props.openTaskData("bot_allowlist")}><ShieldCheck size={20} /><strong>{c.permissions}</strong><span>{c.botRole}</span></button>
        <button type="button" onClick={() => props.selectLayer("modules")}><Sparkles size={20} /><strong>{c.module}</strong><span>{c.viewModules}</span></button>
      </section>
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
