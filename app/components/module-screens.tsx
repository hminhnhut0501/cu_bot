import {
  Box,
  Button as MuiButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Paper,
  Stack,
  Switch,
  TextField,
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
  Gift,
  X,
  Activity,
  Wrench,
  FlaskConical,
} from "lucide-react";
import { useState } from "react";
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
    <Section eyebrow={c.eyebrow} title={c.title}>
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

export function WelcomeScreen(props: {
  moduleEnabled: boolean;
  welcomeEnabled: boolean;
  welcomeText: string;
  welcomeDeleteSeconds: number;
  welcomeButtonsText: string;
  hasSavedConfig: boolean;
  saving: boolean;
  testing: boolean;
  selectedGroupName: string;
  selectedGroupId: string;
  runtimeLastEventAt: string;
  runtimeLastSuccessAt: string;
  runtimeLastErrorAt: string;
  runtimeLastErrorMessage: string;
  runtimeLastTestAt: string;
  onToggleModule: () => void;
  onToggleWelcome: () => void;
  onChangeText: (value: string) => void;
  onChangeDeleteSeconds: (value: string) => void;
  onChangeButtonsText: (value: string) => void;
  onSave: () => void;
  onTestRuntime: () => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const c = {
    eyebrow: "MODULE",
    title: "Welcome",
    body: "Chào thành viên mới khi họ vừa join group. Bật module để gửi tin chào theo mẫu."
  };
  return (
    <Section eyebrow={c.eyebrow} title={c.title} subtitle={c.body}>
      <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
        <Stack spacing={2}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start" }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Bật Welcome</Typography>
              <Typography variant="body2" color="text.secondary">
                Chỉ gửi khi bot có quyền trong group và message sẽ tự xóa nếu đặt thời gian.
              </Typography>
            </Box>
            <Switch checked={props.moduleEnabled} onChange={props.onToggleModule} disabled={props.saving} />
          </Box>

          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            <Chip size="small" color={props.moduleEnabled && props.welcomeEnabled ? "success" : "default"} label={props.moduleEnabled && props.welcomeEnabled ? "Đang chạy" : "Chưa chạy"} />
            <Chip size="small" variant="outlined" label={props.hasSavedConfig ? "Đã có cấu hình" : "Chưa lưu cấu hình"} />
            <Chip size="small" variant="outlined" label={props.welcomeDeleteSeconds > 0 ? `Tự xóa sau ${props.welcomeDeleteSeconds}s` : "Không tự xóa"} />
          </Stack>

          <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }}>
            <Stack spacing={1.5}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2">Tin chào</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Mẫu tin, nút inline và thời gian tự xóa sẽ chỉnh trong popup.
                  </Typography>
                </Box>
                <MuiButton variant="contained" onClick={() => setCreateOpen(true)} disabled={!props.moduleEnabled}>
                  {props.hasSavedConfig ? "Sửa Welcome" : "Tạo Welcome"}
                </MuiButton>
              </Box>
              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
                <Stack spacing={0.75}>
                  <Typography variant="caption" color="text.secondary">Preview nhanh</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {props.welcomeText || "Chưa có mẫu tin chào."}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {props.welcomeButtonsText ? `Có ${props.welcomeButtonsText.split("\n").filter(Boolean).length} nút inline` : "Chưa có nút inline"}
                  </Typography>
                </Stack>
              </Paper>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }}>
            <Stack spacing={1.5}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                <Box>
                  <Typography variant="subtitle2">Kiểm tra runtime Welcome</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gửi thử đúng mẫu Welcome vào group đang chọn để kiểm tra quyền bot và runtime.
                  </Typography>
                </Box>
                <MuiButton
                  variant="contained"
                  startIcon={<FlaskConical size={16} />}
                  onClick={props.onTestRuntime}
                  disabled={props.testing || props.saving || !props.moduleEnabled || !props.welcomeEnabled || !props.selectedGroupId}
                >
                  {props.testing ? "Đang gửi test..." : "Gửi test Welcome"}
                </MuiButton>
              </Box>

              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Chip size="small" variant="outlined" label={`Group test: ${props.selectedGroupName || "Chưa chọn group"}`} />
                <Chip size="small" color={props.runtimeLastEventAt ? "info" : "default"} label={props.runtimeLastEventAt ? `Đã nhận event: ${props.runtimeLastEventAt}` : "Chưa nhận event"} />
                <Chip size="small" color={props.runtimeLastSuccessAt ? "success" : "default"} label={props.runtimeLastSuccessAt ? `Gửi thành công: ${props.runtimeLastSuccessAt}` : "Chưa gửi thành công"} />
                <Chip size="small" color={props.runtimeLastErrorAt ? "warning" : "default"} label={props.runtimeLastErrorAt ? `Lỗi gần nhất: ${props.runtimeLastErrorAt}` : "Chưa có lỗi runtime"} />
                {props.runtimeLastTestAt ? <Chip size="small" variant="outlined" label={`Test gần nhất: ${props.runtimeLastTestAt}`} /> : null}
              </Stack>

              {props.runtimeLastErrorMessage ? (
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
                  <Typography variant="caption" color="text.secondary">Lỗi gần nhất</Typography>
                  <Typography variant="body2">{props.runtimeLastErrorMessage}</Typography>
                </Paper>
              ) : null}
            </Stack>
          </Paper>
        </Stack>
      </Paper>
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{props.hasSavedConfig ? "Sửa Welcome" : "Tạo Welcome"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
              <Typography variant="subtitle2">Bật chào thành viên mới</Typography>
              <Switch checked={props.welcomeEnabled} onChange={props.onToggleWelcome} disabled={props.saving || !props.moduleEnabled} />
            </Box>
            <TextField
              multiline
              minRows={5}
              fullWidth
              label="Mẫu tin chào"
              value={props.welcomeText}
              disabled={props.saving || !props.moduleEnabled || !props.welcomeEnabled}
              onChange={(event) => props.onChangeText(event.target.value)}
              helperText="Placeholder: {user}, {group}, {group_id}, {user_id}"
            />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <MuiButton size="small" variant="outlined" onClick={() => props.onChangeText(`${props.welcomeText} {user}`.trim())}>
                Chèn {'{user}'}
              </MuiButton>
              <MuiButton size="small" variant="outlined" onClick={() => props.onChangeText(`${props.welcomeText} {group}`.trim())}>
                Chèn {'{group}'}
              </MuiButton>
            </Box>
            <TextField
              multiline
              minRows={3}
              fullWidth
              label="Nút inline"
              value={props.welcomeButtonsText}
              disabled={props.saving || !props.moduleEnabled || !props.welcomeEnabled}
              onChange={(event) => props.onChangeButtonsText(event.target.value)}
              helperText="Mỗi dòng: Tên nút | https://link"
            />
            <TextField
              type="number"
              fullWidth
              label="Tự xóa sau (giây)"
              value={props.welcomeDeleteSeconds}
              disabled={props.saving || !props.moduleEnabled || !props.welcomeEnabled}
              onChange={(event) => props.onChangeDeleteSeconds(event.target.value)}
              helperText="0 = không tự xóa"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <MuiButton variant="outlined" onClick={() => setCreateOpen(false)}>Hủy</MuiButton>
          <MuiButton variant="contained" onClick={props.onSave} disabled={props.saving || !props.moduleEnabled}>Lưu</MuiButton>
        </DialogActions>
      </Dialog>
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
    <Section eyebrow={c.eyebrow} title={c.title} subtitle={c.body} />
  );
}

export function GiveawayScreen(props: {
  moduleEnabled: boolean;
  saving: boolean;
  campaigns: Array<Record<string, any>>;
  giveawayEntries: Array<Record<string, any>>;
  selectedScope?: string;
  selectedScopeName?: string;
  onOpenEntries: (campaignId: string) => void;
  onDrawCampaign: (campaignId: string) => void;
  onCloseCampaign: (campaignId: string) => void;
  onToggleModule: () => void;
  onCreateCampaign: (draft: {
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
  }) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("Giveaway");
  const [prize, setPrize] = useState("");
  const [winnerCount, setWinnerCount] = useState(1);
  const [requireKeyword, setRequireKeyword] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [joinMessage, setJoinMessage] = useState("🎉 *GIVEAWAY* 🎉\n\n🎁 Phần thưởng: {prize}\n🏆 Số người thắng: {winner_count}\n👥 Chọn group: {group}\n👇 Nhấn nút bên dưới để tham gia!");
  const [resultMessage, setResultMessage] = useState("🎉 CHÚC MỪNG NGƯỜI CHIẾN THẮNG!\n\n🏆 Danh sách:\n{winners}\n\n🎁 Phần thưởng: {prize}\n⭐ Số người thắng: {winner_count}\n👥 Group: {group}");
  const [buttonsText, setButtonsText] = useState("Tham Gia | /join {id}");
  const insertToken = (token: string) => {
    const next = `${joinMessage} ${token}`.trim();
    setJoinMessage(next);
  };
  const getEntryCount = (campaignId: string) => props.giveawayEntries.filter((row) => String(row.giveaway_id || "") === String(campaignId)).length;
  return (
    <Section eyebrow="MODULE" title="Giveaway" subtitle="Tạo campaign giveaway, mẫu tin tham gia và công bố người thắng.">
      <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
        <Stack spacing={2}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start" }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Bật module Giveaway</Typography>
              <Typography variant="body2" color="text.secondary">
                Bật để dùng /giveaway, /join và /draw với template tin đẹp.
              </Typography>
            </Box>
            <Switch checked={props.moduleEnabled} onChange={props.onToggleModule} disabled={props.saving} />
          </Box>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }}>
            <Stack spacing={1.25}>
              <Typography variant="subtitle2">Campaign giveaway</Typography>
              <Typography variant="body2" color="text.secondary">
                Tạo campaign từ popup, gồm phần thưởng, số người thắng, mẫu tin mời tham gia và mẫu công bố kết quả.
              </Typography>
              <MuiButton variant="contained" onClick={() => setCreateOpen(true)} disabled={!props.moduleEnabled || !props.selectedScope}>
                Tạo campaign
              </MuiButton>
              <Typography variant="caption" color="text.secondary">
                Group áp dụng: {props.selectedScopeName || props.selectedScope || "Chưa chọn group"}
              </Typography>
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Danh sách campaign</Typography>
              <Typography variant="body2" color="text.secondary">
                Xem nhanh campaign, số người tham gia, và thao tác quay hoặc đóng ngay trên từng card.
              </Typography>
              <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" } }}>
                {props.campaigns.length ? props.campaigns.map((campaign) => {
                  const status = String(campaign.status || "open");
                  const entryCount = getEntryCount(campaign.id);
                  return (
                    <Paper key={campaign.id} variant="outlined" sx={{ p: 1.75, bgcolor: "background.default" }}>
                      <Stack spacing={1.25}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, alignItems: "flex-start" }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{campaign.title || "Giveaway"}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {campaign.prize || "Chưa có phần thưởng"} · Group {campaign.chat_id || props.selectedScope || "-"}
                            </Typography>
                          </Box>
                          <Chip size="small" color={status === "open" ? "success" : status === "drawn" ? "primary" : "default"} label={status === "open" ? "Đang mở" : status === "drawn" ? "Đã quay" : "Đã đóng"} />
                        </Box>
                        <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
                          <Chip size="small" variant="outlined" label={`Thắng ${campaign.winner_count || 1}`} />
                          <Chip size="small" variant="outlined" label={`Tham gia ${entryCount}`} />
                          {campaign.require_keyword ? <Chip size="small" variant="outlined" label={`Từ khóa: ${campaign.require_keyword}`} /> : null}
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>
                          {campaign.description || "Chưa có mô tả."}
                        </Typography>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                          <MuiButton variant="outlined" onClick={() => props.onOpenEntries(String(campaign.id))}>
                            Xem người tham gia
                          </MuiButton>
                          <MuiButton variant="contained" onClick={() => props.onDrawCampaign(String(campaign.id))} disabled={status !== "open" || !entryCount}>
                            Quay
                          </MuiButton>
                          <MuiButton variant="outlined" color="error" onClick={() => props.onCloseCampaign(String(campaign.id))} disabled={status === "closed"}>
                            Đóng
                          </MuiButton>
                        </Stack>
                      </Stack>
                    </Paper>
                  );
                }) : (
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
                    <Typography variant="body2" color="text.secondary">Chưa có campaign nào. Tạo mới để bắt đầu.</Typography>
                  </Paper>
                )}
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </Paper>
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Tạo campaign Giveaway</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
              <TextField
                label="Group áp dụng"
                value={props.selectedScopeName || props.selectedScope || ""}
                disabled
                helperText="Campaign sẽ gắn vào group đang chọn."
              />
              <TextField label="Tên campaign" value={title} onChange={(e) => setTitle(e.target.value)} />
              <TextField type="number" label="Số người thắng" value={winnerCount} onChange={(e) => setWinnerCount(Number(e.target.value) || 1)} />
              <TextField label="Phần thưởng" value={prize} onChange={(e) => setPrize(e.target.value)} />
              <TextField label="Từ khóa tham gia" value={requireKeyword} onChange={(e) => setRequireKeyword(e.target.value)} />
            </Box>
            <TextField multiline minRows={3} label="Mô tả" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
              <TextField type="datetime-local" label="Bắt đầu" value={startAt} onChange={(e) => setStartAt(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField type="datetime-local" label="Kết thúc" value={endAt} onChange={(e) => setEndAt(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            </Box>
            <TextField multiline minRows={6} label="Mẫu tin mời tham gia" value={joinMessage} onChange={(e) => setJoinMessage(e.target.value)} helperText="Dùng {id}, {title}, {prize}, {winner_count}, {sponsor}" />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <MuiButton size="small" variant="outlined" onClick={() => insertToken("{user}")}>Chèn {'{user}'}</MuiButton>
              <MuiButton size="small" variant="outlined" onClick={() => insertToken("{group}")}>Chèn {'{group}'}</MuiButton>
            </Box>
            <TextField multiline minRows={6} label="Mẫu công bố người thắng" value={resultMessage} onChange={(e) => setResultMessage(e.target.value)} helperText="Dùng {id}, {title}, {prize}, {winner_count}, {winners}" />
            <TextField multiline minRows={3} label="Nút inline" value={buttonsText} onChange={(e) => setButtonsText(e.target.value)} helperText="Mỗi dòng: Tên nút | https://link hoặc /join {id}" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <MuiButton variant="outlined" onClick={() => setCreateOpen(false)}>Hủy</MuiButton>
          <MuiButton
            variant="contained"
            onClick={() => {
              props.onCreateCampaign({
                chat_id: props.selectedScope || "",
                title,
                prize,
                winner_count: winnerCount,
                require_keyword: requireKeyword,
                description,
                start_at: startAt,
                end_at: endAt,
                join_message: joinMessage,
                result_message: resultMessage,
                buttons_text: buttonsText,
              });
              setCreateOpen(false);
            }}
            disabled={!props.moduleEnabled}
          >
            Lưu campaign
          </MuiButton>
        </DialogActions>
      </Dialog>
    </Section>
  );
}

export function ShareUnlockScreen(props: {
  moduleEnabled: boolean;
  saving: boolean;
  selectedScope?: string;
  selectedScopeName?: string;
  campaigns: Array<Record<string, any>>;
  invites: Array<Record<string, any>>;
  referrals: Array<Record<string, any>>;
  onToggleModule: () => void;
  onToggleCampaignStatus: (campaignId: string, nextStatus: "open" | "closed") => void;
  onCreateCampaign: (draft: {
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
  }) => void;
  onOpenInvites: (campaignId: string) => void;
  onOpenReferrals: (campaignId: string) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("Mở khóa nhóm VIP");
  const [description, setDescription] = useState("Mời đủ 5 người vào group bằng link riêng để mở khóa link thưởng.");
  const [requiredInvites, setRequiredInvites] = useState(5);
  const [unlockTargetType, setUnlockTargetType] = useState("invite_link");
  const [unlockTargetValue, setUnlockTargetValue] = useState("https://t.me/+replace_me_reward_link");
  const [shareMessage, setShareMessage] = useState("Mời đủ {required} người vào {group} bằng link riêng của bạn để mở khóa.");
  const [unlockMessage, setUnlockMessage] = useState("Bạn đã đủ điều kiện mở khóa. Đây là link của bạn: {reward}");
  const [notes, setNotes] = useState("");
  const [testUserId, setTestUserId] = useState("");

  const previewInvite = props.invites.find((row) => String(row.referrer_user_id || "") === String(testUserId || "") && String(row.source_chat_id || "") === String(props.selectedScope || "")) || null;
  const previewReferralCount = props.referrals.filter((row) => String(row.referrer_user_id || "") === String(testUserId || "") && String(row.invitee_chat_id || "") === String(props.selectedScope || "") && row.counted !== false).length;

  const renderSharePreview = () => {
    const group = props.selectedScopeName || props.selectedScope || "group đang chọn";
    return String(shareMessage || "Mời đủ {required} người vào {group} bằng link riêng của bạn để mở khóa.")
      .replaceAll("{required}", String(requiredInvites || 5))
      .replaceAll("{group}", group)
      .replaceAll("{count}", String(previewReferralCount))
      .replaceAll("{remaining}", String(Math.max(Number(requiredInvites || 5) - previewReferralCount, 0)));
  };
  const renderUnlockPreview = () => {
    return String(unlockMessage || "Bạn đã đủ điều kiện mở khóa. Đây là link của bạn: {reward}")
      .replaceAll("{reward}", String(unlockTargetValue || ""))
      .replaceAll("{required}", String(requiredInvites || 5))
      .replaceAll("{count}", String(previewReferralCount))
      .replaceAll("{title}", String(title || ""));
  };
  const topReferrersForCampaign = (campaignId: string, required: number) => {
    const counts = new Map<string, { userId: string; count: number; unlocked: boolean; inviteLink: string }>();
    props.invites
      .filter((row) => String(row.campaign_id || "") === String(campaignId))
      .forEach((invite) => {
        counts.set(String(invite.referrer_user_id || ""), {
          userId: String(invite.referrer_user_id || ""),
          count: 0,
          unlocked: Boolean(invite.unlocked_at),
          inviteLink: String(invite.invite_link || ""),
        });
      });
    props.referrals
      .filter((row) => String(row.campaign_id || "") === String(campaignId) && row.counted !== false)
      .forEach((referral) => {
        const key = String(referral.referrer_user_id || "");
        const current = counts.get(key) || { userId: key, count: 0, unlocked: false, inviteLink: "" };
        current.count += 1;
        counts.set(key, current);
      });
    return Array.from(counts.values())
      .map((item) => ({ ...item, progress: required > 0 ? Math.min((item.count / required) * 100, 100) : 0 }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 5);
  };
  const telegramCardSx = {
    p: 2,
    bgcolor: "#1f2a37",
    color: "#f8fafc",
    borderRadius: 4,
    border: "1px solid rgba(148, 163, 184, 0.18)",
    boxShadow: "0 20px 40px rgba(15, 23, 42, 0.18)",
  } as const;

  return (
    <Section eyebrow="MODULE" title="Mở khóa bằng chia sẻ" subtitle="Mời đủ số người qua link riêng của từng user, bot mới mở khóa link thưởng.">
      <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
        <Stack spacing={2}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start" }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Bật module Share Unlock</Typography>
              <Typography variant="body2" color="text.secondary">
                Bot tạo invite link riêng, đếm referral hợp lệ, và tự gửi phần thưởng khi đủ điều kiện.
              </Typography>
            </Box>
            <Switch checked={props.moduleEnabled} onChange={props.onToggleModule} disabled={props.saving} />
          </Box>

          <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" } }}>
            <StatCard compact label="Campaign" value={props.campaigns.length} tone="primary" />
            <StatCard compact label="Link riêng" value={props.invites.length} tone="info" />
            <StatCard compact label="Referral hợp lệ" value={props.referrals.filter((row) => row.counted !== false).length} tone="success" />
          </Box>

          <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" } }}>
              <Box>
                <Typography variant="subtitle2">Campaign mở khóa</Typography>
                <Typography variant="body2" color="text.secondary">
                  Group áp dụng: {props.selectedScopeName || props.selectedScope || "Chưa chọn group"}
                </Typography>
              </Box>
              <MuiButton variant="contained" onClick={() => setCreateOpen(true)} disabled={!props.moduleEnabled || !props.selectedScope}>
                Tạo campaign
              </MuiButton>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Tiến độ và referral</Typography>
              <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" } }}>
                {props.campaigns.length ? props.campaigns.map((campaign) => {
                  const campaignReferrals = props.referrals.filter((row) => String(row.campaign_id || "") === String(campaign.id));
                  const campaignInvites = props.invites.filter((row) => String(row.campaign_id || "") === String(campaign.id));
                  const required = Number(campaign.required_invites || 5);
                  const topReferrers = topReferrersForCampaign(String(campaign.id), required);
                  return (
                    <Paper key={campaign.id} variant="outlined" sx={{ p: 1.75, bgcolor: "background.default" }}>
                      <Stack spacing={1.25}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{campaign.title || "Campaign mở khóa"}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Group {campaign.source_chat_id || "-"} · Mở khi đủ {campaign.required_invites || 5} người
                            </Typography>
                          </Box>
                          <Chip
                            size="small"
                            color={String(campaign.status || "open") === "open" ? "success" : "default"}
                            label={String(campaign.status || "open") === "open" ? "Đang mở" : "Đã đóng"}
                          />
                        </Box>
                        <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
                          <Chip size="small" variant="outlined" label={`Link riêng ${campaignInvites.length}`} />
                          <Chip size="small" variant="outlined" label={`Referral ${campaignReferrals.length}`} />
                          <Chip size="small" variant="outlined" label={`Thưởng: ${campaign.unlock_target_type || "invite_link"}`} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>
                          {campaign.description || "Chưa có mô tả."}
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 1.25, bgcolor: "background.paper" }}>
                          <Stack spacing={1}>
                            <Typography variant="caption" color="text.secondary">Top referrer</Typography>
                            {topReferrers.length ? topReferrers.map((item) => (
                              <Box key={`${campaign.id}-${item.userId}`}>
                                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    {item.userId}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {item.count}/{required}
                                  </Typography>
                                </Stack>
                                <LinearProgress
                                  variant="determinate"
                                  value={item.progress}
                                  sx={{
                                    height: 8,
                                    borderRadius: 999,
                                    bgcolor: "rgba(148, 163, 184, 0.18)",
                                    "& .MuiLinearProgress-bar": {
                                      borderRadius: 999,
                                      bgcolor: item.unlocked || item.count >= required ? "success.main" : "primary.main",
                                    },
                                  }}
                                />
                              </Box>
                            )) : (
                              <Typography variant="body2" color="text.secondary">Chưa có referrer nào.</Typography>
                            )}
                          </Stack>
                        </Paper>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                          <MuiButton variant="outlined" onClick={() => props.onOpenInvites(String(campaign.id))}>
                            Xem link riêng
                          </MuiButton>
                          <MuiButton variant="outlined" onClick={() => props.onOpenReferrals(String(campaign.id))}>
                            Xem referral
                          </MuiButton>
                          <MuiButton
                            variant="contained"
                            color={String(campaign.status || "open") === "open" ? "error" : "success"}
                            onClick={() => props.onToggleCampaignStatus(String(campaign.id), String(campaign.status || "open") === "open" ? "closed" : "open")}
                          >
                            {String(campaign.status || "open") === "open" ? "Đóng campaign" : "Mở lại"}
                          </MuiButton>
                        </Stack>
                      </Stack>
                    </Paper>
                  );
                }) : (
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
                    <Typography variant="body2" color="text.secondary">Chưa có campaign nào. Tạo mới để bắt đầu.</Typography>
                  </Paper>
                )}
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </Paper>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Tạo campaign mở khóa</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
              <TextField label="Group áp dụng" value={props.selectedScopeName || props.selectedScope || ""} disabled helperText="Campaign sẽ gắn vào group đang chọn." />
              <TextField label="Tên campaign" value={title} onChange={(e) => setTitle(e.target.value)} />
              <TextField type="number" label="Số người cần mời" value={requiredInvites} onChange={(e) => setRequiredInvites(Number(e.target.value) || 1)} />
              <TextField label="Loại mở khóa" value={unlockTargetType} onChange={(e) => setUnlockTargetType(e.target.value)} helperText="invite_link, url hoặc message" />
            </Box>
            <TextField multiline minRows={3} label="Mô tả" value={description} onChange={(e) => setDescription(e.target.value)} />
            <TextField multiline minRows={2} label="Link / nội dung mở khóa" value={unlockTargetValue} onChange={(e) => setUnlockTargetValue(e.target.value)} />
            <TextField multiline minRows={3} label="Tin nhắn hướng dẫn chia sẻ" value={shareMessage} onChange={(e) => setShareMessage(e.target.value)} helperText="Dùng {required}, {group}, {count}, {remaining}" />
            <TextField multiline minRows={3} label="Tin nhắn mở khóa" value={unlockMessage} onChange={(e) => setUnlockMessage(e.target.value)} helperText="Dùng {reward}, {required}, {count}, {title}" />
            <TextField multiline minRows={2} label="Ghi chú / JSON bổ sung" value={notes} onChange={(e) => setNotes(e.target.value)} />

            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle2">Kiểm thử và preview</Typography>
                <TextField
                  label="User ID test"
                  value={testUserId}
                  onChange={(e) => setTestUserId(e.target.value)}
                  helperText="Nếu user này đã từng lấy link, CP sẽ hiện link thật đang có."
                />
                <Paper variant="outlined" sx={{ p: 1.75, bgcolor: "background.paper" }}>
                  <Stack spacing={1}>
                    <Typography variant="overline" color="primary">Lệnh user sẽ dùng</Typography>
                    <Typography variant="body2"><code>/shareunlock &lt;campaign_id&gt;</code></Typography>
                    <Typography variant="caption" color="text.secondary">
                      Sau khi lưu campaign, user dùng lệnh này trong chat để bot tạo link riêng.
                    </Typography>
                  </Stack>
                </Paper>
                <Paper variant="outlined" sx={telegramCardSx}>
                  <Stack spacing={1}>
                    <Typography variant="overline" sx={{ color: "#f472b6" }}>Telegram preview</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#f8fafc" }}>
                      {title || "Campaign mở khóa"}
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", color: "#f8fafc" }}>{renderSharePreview()}</Typography>
                    <Paper variant="outlined" sx={{ p: 1, bgcolor: "rgba(15, 23, 42, 0.28)", borderColor: "rgba(148, 163, 184, 0.18)" }}>
                      <Typography variant="caption" sx={{ color: "#cbd5e1" }}>
                        Nút dự kiến: Lấy link riêng / Tiến độ
                      </Typography>
                    </Paper>
                    <Typography variant="caption" sx={{ color: "#cbd5e1" }}>
                      Link riêng hiện có: {previewInvite?.invite_link || "Chưa có. Sau khi lưu, user gọi /shareunlock để bot tạo link."}
                    </Typography>
                  </Stack>
                </Paper>
                <Paper variant="outlined" sx={telegramCardSx}>
                  <Stack spacing={1}>
                    <Typography variant="overline" sx={{ color: "#f472b6" }}>Telegram preview</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#f8fafc" }}>
                      Mở khóa thành công
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", color: "#f8fafc" }}>{renderUnlockPreview()}</Typography>
                    <Paper variant="outlined" sx={{ p: 1, bgcolor: "rgba(15, 23, 42, 0.28)", borderColor: "rgba(148, 163, 184, 0.18)" }}>
                      <Typography variant="caption" sx={{ color: "#cbd5e1" }}>
                        Nút dự kiến: Mở khóa ngay
                      </Typography>
                    </Paper>
                    <Typography variant="caption" sx={{ color: "#cbd5e1" }}>
                      Tiến độ test: {previewReferralCount}/{requiredInvites || 0}
                    </Typography>
                  </Stack>
                </Paper>
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions>
          <MuiButton variant="outlined" onClick={() => setCreateOpen(false)}>Hủy</MuiButton>
          <MuiButton
            variant="contained"
            onClick={() => {
              props.onCreateCampaign({
                source_chat_id: props.selectedScope || "",
                title,
                description,
                required_invites: requiredInvites,
                unlock_target_type: unlockTargetType,
                unlock_target_value: unlockTargetValue,
                share_message: shareMessage,
                unlock_message: unlockMessage,
                status: "open",
                notes,
              });
              setCreateOpen(false);
            }}
            disabled={!props.moduleEnabled || !props.selectedScope}
          >
            Lưu campaign
          </MuiButton>
        </DialogActions>
      </Dialog>
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
    <Section eyebrow={c.eyebrow} title={c.title}>
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
  startCreate: () => void;
}) {
  const c = UI_COPY.workbench.group;
  return (
    <Section
      eyebrow={c.eyebrow}
      title={c.title}
      actions={
        <MuiButton variant="contained" startIcon={<Plus size={16} />} onClick={props.startCreate}>
          Thêm group
        </MuiButton>
      }
    >
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
