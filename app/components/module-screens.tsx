import TelegramPhoneSimulator from "./ui/TelegramPhoneSimulator";
import {
  Alert,
  Box,
  Button as MuiButton,
  Chip,
  Dialog,
  Divider,
  Grid,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Check,
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
  Calendar,
  Clock,
  Layers,
  MessageSquare,
  Video,
  Send,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Radio,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { UI_COPY } from "@/lib/uiCopy";
import Section from "@/app/components/ui/Section";
import StatCard from "@/app/components/ui/StatCard";
import KeyValue from "@/app/components/ui/KeyValue";
import EmptyState from "@/app/components/ui/EmptyState";
import TabsBar from "@/app/components/ui/TabsBar";

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

function WorkspacePanel(props: {
  title: string;
  subtitle: string;
  tabs: Array<{ key: string; label: string }>;
  activeTab: string;
  onChangeTab: (tab: string) => void;
  statusChips?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        bgcolor: "background.default",
        backgroundImage: "linear-gradient(135deg, rgba(15, 118, 110, 0.04), transparent 56%)",
      }}
    >
      <Stack spacing={1.5}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" } }}>
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.11em" }}>
              Workspace
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>{props.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 860 }}>
              {props.subtitle}
            </Typography>
          </Box>
          {props.actions ? <Box>{props.actions}</Box> : null}
        </Box>
        {props.statusChips ? (
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            {props.statusChips}
          </Stack>
        ) : null}
        <TabsBar
          items={props.tabs}
          value={props.activeTab}
          onChange={props.onChangeTab}
          scrollable
          wrapped
          tone="filled"
        />
      </Stack>
    </Paper>
  );
}

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
  tabs: Array<{ key: string; label: string }>;
  activeTab: string;
  onChangeTab: (tab: string) => void;
}) {
  const windowStart = parseInt(props.scheduleSubject.daily_window_start || "09", 10) || 9;
  const windowEnd = parseInt(props.scheduleSubject.daily_window_end || "21", 10) || 21;
  const isReady = props.scheduleReadiness?.ready && props.scheduleIssues.length === 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
      {/* Studio Banner */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: "background.paper",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", md: "center" },
          gap: 1.5,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(16, 185, 129, 0.12)",
              color: "success.main",
            }}
          >
            <Calendar size={20} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Lịch Phát Sóng Tự Động (Broadcast Timeline Studio)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Định thời gian phát nội dung định kỳ từ kho tin nhắn và video vào các nhóm được chỉ định
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Chip
            size="small"
            color={isReady ? "success" : "warning"}
            icon={isReady ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
            label={isReady ? "Lịch phát sẵn sàng" : `${props.scheduleIssues.length || 1} điểm cần hoàn thiện`}
            sx={{ borderRadius: 1.5, fontWeight: 700 }}
          />
          <MuiButton
            variant="contained"
            size="small"
            color="primary"
            startIcon={<Clock size={14} />}
            onClick={props.startScheduledMessageFlow}
            sx={{ textTransform: "none", borderRadius: 1.5, boxShadow: "none" }}
          >
            {props.lookupsGroupsLength ? "Thiết lập lịch phát sóng" : "Thêm nhóm phát"}
          </MuiButton>
        </Stack>
      </Paper>

      {/* 24-Hour Visual Dispatch Timeline */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          borderRadius: 2,
          bgcolor: "background.paper",
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Biểu Đồ Khung Giờ Phát Trong Ngày (24H Timeline)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Khung giờ kích hoạt hiện tại: <strong>{props.scheduleSubject.daily_window_start || "09:00"}</strong> đến <strong>{props.scheduleSubject.daily_window_end || "21:00"}</strong>
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: "success.main" }} />
              <Typography variant="caption" color="text.secondary">Đang phát sóng</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: "action.disabledBackground" }} />
              <Typography variant="caption" color="text.secondary">Giờ nghỉ yên lặng</Typography>
            </Box>
          </Stack>
        </Stack>

        {/* Hour Segments Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(24, 1fr)",
            gap: 0.5,
            pt: 1,
            pb: 0.5,
          }}
        >
          {Array.from({ length: 24 }).map((_, hour) => {
            const isActive = hour >= windowStart && hour <= windowEnd;
            return (
              <Tooltip key={hour} title={`Khung ${hour}:00 - ${hour}:59 (${isActive ? "Phát sóng bật" : "Yên lặng"})`} arrow>
                <Box
                  sx={{
                    height: 38,
                    borderRadius: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: isActive ? "rgba(16, 185, 129, 0.15)" : "action.hover",
                    border: "1px solid",
                    borderColor: isActive ? "rgba(16, 185, 129, 0.4)" : "divider",
                    transition: "all 0.15s ease",
                    cursor: "pointer",
                    "&:hover": {
                      transform: "scale(1.08)",
                      borderColor: "primary.main",
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: 10,
                      fontWeight: isActive ? 800 : 500,
                      color: isActive ? "success.dark" : "text.secondary",
                    }}
                  >
                    {hour}h
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Paper>

      {/* Content Pools & Readiness Split */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.2fr 0.8fr" }, gap: 2 }}>
        {/* Left: Dual Content Pools */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Message Pool Card */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "background.paper",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <MessageSquare size={18} style={{ color: "#2563eb" }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Kho Tin Nhắn Văn Bản (Message Pool)
                </Typography>
              </Stack>
              <Chip
                size="small"
                label={`${props.scheduleMessagePreview.length} bài viết`}
                variant="outlined"
                sx={{ borderRadius: 1 }}
              />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Nguồn cấp tin tự động: <strong>{props.scheduleMessagePool || "Default Message Pool"}</strong>
            </Typography>

            {props.scheduleMessagePreview.length > 0 ? (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: "rgba(37, 99, 235, 0.04)",
                  border: "1px dashed",
                  borderColor: "rgba(37, 99, 235, 0.25)",
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Tin mẫu trong kho:
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, fontStyle: "italic", color: "text.primary" }}>
                  &ldquo;{String(props.scheduleMessagePreview[0]?.message || props.scheduleMessagePreview[0]?.content || "Tin nhắn tự động định kỳ...")}&rdquo;
                </Typography>
              </Box>
            ) : null}

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <MuiButton
                size="small"
                variant="outlined"
                startIcon={<MessageSquare size={13} />}
                onClick={() => props.goToScheduleContent("messages")}
                sx={{ textTransform: "none", borderRadius: 1.5 }}
              >
                Quản lý kho tin nhắn
              </MuiButton>
            </Box>
          </Paper>

          {/* Video Message Pool Card */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "background.paper",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Video size={18} style={{ color: "#7c3aed" }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Kho Video / Media (Video Pool)
                </Typography>
              </Stack>
              <Chip
                size="small"
                label={`${props.scheduleVideoPreview.length} media`}
                variant="outlined"
                sx={{ borderRadius: 1 }}
              />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Nguồn cấp video: <strong>{props.scheduleVideoPool || "Default Video Pool"}</strong>
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <MuiButton
                size="small"
                variant="outlined"
                startIcon={<Video size={13} />}
                onClick={() => props.goToScheduleContent("video_messages")}
                sx={{ textTransform: "none", borderRadius: 1.5 }}
              >
                Quản lý kho video
              </MuiButton>
            </Box>
          </Paper>
        </Box>

        {/* Right: Readiness Checklist & Group Context */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 2,
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Kiểm Tra Điều Kiện Phát Sóng
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Hệ thống chỉ kích hoạt phát sóng khi toàn bộ các điều kiện sau được đáp ứng:
            </Typography>
          </Box>

          <Stack spacing={1.5}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              {props.scheduleReadiness?.hasBot ? (
                <CheckCircle2 size={18} style={{ color: "#10b981", flexShrink: 0 }} />
              ) : (
                <AlertTriangle size={18} style={{ color: "#f59e0b", flexShrink: 0 }} />
              )}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Bot thực thi đã sẵn sàng</Typography>
                <Typography variant="caption" color="text.secondary">Bot quản lý kênh có quyền đăng bài</Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              {props.scheduleReadiness?.hasGroup ? (
                <CheckCircle2 size={18} style={{ color: "#10b981", flexShrink: 0 }} />
              ) : (
                <AlertTriangle size={18} style={{ color: "#f59e0b", flexShrink: 0 }} />
              )}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Nhóm đích hợp lệ</Typography>
                <Typography variant="caption" color="text.secondary">
                  {props.scheduleSubject.group_name || props.scheduleSubject.group_id || props.selectedScope || "Chưa chọn nhóm phát"}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              {props.scheduleReadiness?.hasMessagePool || props.scheduleReadiness?.hasVideoPool ? (
                <CheckCircle2 size={18} style={{ color: "#10b981", flexShrink: 0 }} />
              ) : (
                <AlertTriangle size={18} style={{ color: "#f59e0b", flexShrink: 0 }} />
              )}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Kho nội dung có bài viết</Typography>
                <Typography variant="caption" color="text.secondary">Tối thiểu 1 tin nhắn hoặc 1 video trong kho</Typography>
              </Box>
            </Box>
          </Stack>

          {props.scheduleIssues.length > 0 ? (
            <Alert severity="warning" sx={{ borderRadius: 1.5, mt: 1 }}>
              {props.scheduleIssues.join(". ")}
            </Alert>
          ) : null}

          {/* Sub-table tabs */}
          {props.tabs.length > 0 ? (
            <Box sx={{ mt: "auto", pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", mb: 1 }}>
                Bảng Cấu Hình Con:
              </Typography>
              <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
                {props.tabs.map((tab) => (
                  <Chip
                    key={tab.key}
                    label={tab.label}
                    size="small"
                    variant={props.activeTab === tab.key ? "filled" : "outlined"}
                    color={props.activeTab === tab.key ? "primary" : "default"}
                    onClick={() => props.onChangeTab(tab.key)}
                    sx={{ borderRadius: 1.5, cursor: "pointer" }}
                  />
                ))}
              </Stack>
            </Box>
          ) : null}
        </Paper>
      </Box>
    </Box>
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
  runtimeLastEventSource: string;
  runtimeDeleteStatus: string;
  onToggleWelcome: (nextEnabled: boolean) => void;
  onChangeText: (value: string) => void;
  onChangeDeleteSeconds: (value: string) => void;
  onChangeButtonsText: (value: string) => void;
  onSave: () => void;
  onTestRuntime: () => void;
  tabLabel?: string;
}) {
  const c = {
    eyebrow: "ONBOARDING STUDIO",
    title: "Chào mừng & Xác thực thành viên",
    body: "Thiết lập tin nhắn chào mừng, nút inline và thời gian tự xóa kèm xem trước Telegram thời gian thực."
  };

  const timerPresets = [0, 15, 30, 60, 180, 300];

  return (
    <Section eyebrow={c.eyebrow} title={c.title} subtitle={c.body} tone="main">
      <Grid container spacing={2.5}>
        {/* Left Column: Configuration Controls */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={2}>
            {/* Group Scope & Master Switch */}
            <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper", borderRadius: 2.5 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
                <Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {props.selectedGroupName || props.selectedGroupId || "Chưa chọn Group"}
                    </Typography>
                    <Chip
                      size="small"
                      color={props.welcomeEnabled ? "success" : "default"}
                      label={props.welcomeEnabled ? "Đang bật" : "Đang tắt"}
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {props.selectedGroupId ? `Group ID: ${props.selectedGroupId}` : "Hãy chọn group ở thanh trên để cấu hình riêng cho group đó."}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {props.welcomeEnabled ? "BẬT CHÀO MỪNG" : "TẮT CHÀO MỪNG"}
                  </Typography>
                  <Switch
                    checked={props.welcomeEnabled}
                    onChange={(_, checked) => props.onToggleWelcome(checked)}
                    disabled={props.saving || !props.selectedGroupId}
                  />
                </Stack>
              </Stack>
            </Paper>

            {/* Message Composer Card */}
            <Paper variant="outlined" sx={{ p: 2.5, bgcolor: "background.paper", borderRadius: 2.5 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Nội dung tin nhắn chào mừng
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hỗ trợ định dạng HTML/Markdown và các placeholder cá nhân hóa.
                  </Typography>
                </Box>

                <TextField
                  multiline
                  minRows={6}
                  fullWidth
                  value={props.welcomeText}
                  onChange={(event) => props.onChangeText(event.target.value)}
                  placeholder="Chào {user} đã đến với {group}! Vui lòng bấm vào nút quy định bên dưới để tìm hiểu nội quy nhóm nhé..."
                  disabled={props.saving}
                />

                {/* Placeholder Quick Insert Chips */}
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75, fontWeight: 700, textTransform: "uppercase" }}>
                    Biến thay thế nhanh (bấm để chèn):
                  </Typography>
                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                    {[
                      { tag: "{user}", label: "{user} (Tên thành viên)" },
                      { tag: "{group}", label: "{group} (Tên nhóm)" },
                      { tag: "{user_id}", label: "{user_id} (ID Telegram)" },
                      { tag: "{group_id}", label: "{group_id} (ID Nhóm)" },
                    ].map((item) => (
                      <Chip
                        key={item.tag}
                        size="small"
                        variant="outlined"
                        label={item.label}
                        onClick={() => props.onChangeText(`${props.welcomeText} ${item.tag}`.trim())}
                        sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                      />
                    ))}
                  </Stack>
                </Box>

                <Divider sx={{ my: 0.5 }} />

                {/* Auto Delete Timer */}
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Thời gian tự xóa tin nhắn
                    </Typography>
                    <Chip
                      size="small"
                      color={props.welcomeDeleteSeconds > 0 ? "warning" : "default"}
                      label={props.welcomeDeleteSeconds > 0 ? `Tự xóa sau ${props.welcomeDeleteSeconds}s` : "Giữ vĩnh viễn"}
                    />
                  </Box>
                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
                    {timerPresets.map((sec) => (
                      <Chip
                        key={sec}
                        size="small"
                        color={props.welcomeDeleteSeconds === sec ? "primary" : "default"}
                        variant={props.welcomeDeleteSeconds === sec ? "filled" : "outlined"}
                        label={sec === 0 ? "Không xóa" : `${sec} giây`}
                        onClick={() => props.onChangeDeleteSeconds(String(sec))}
                        sx={{ cursor: "pointer" }}
                      />
                    ))}
                  </Stack>
                  <TextField
                    type="number"
                    size="small"
                    label="Tùy chỉnh số giây tự xóa"
                    value={props.welcomeDeleteSeconds}
                    onChange={(event) => props.onChangeDeleteSeconds(event.target.value)}
                    helperText="Đặt 0 nếu muốn tin chào mừng giữ lại vĩnh viễn trong nhóm."
                    sx={{ maxWidth: 260 }}
                  />
                </Box>
              </Stack>
            </Paper>

            {/* Inline Buttons Builder Card */}
            <Paper variant="outlined" sx={{ p: 2.5, bgcolor: "background.paper", borderRadius: 2.5 }}>
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Nút bấm liên kết (Inline Buttons)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Mỗi dòng là một nút bấm theo định dạng: <code>Tên nút | Đường dẫn liên kết</code>
                  </Typography>
                </Box>
                <TextField
                  multiline
                  minRows={3}
                  fullWidth
                  value={props.welcomeButtonsText}
                  onChange={(event) => props.onChangeButtonsText(event.target.value)}
                  placeholder="📖 Xem Quy Định | https://t.me/your_rules_channel\n🌐 Kênh Thông Báo | https://t.me/your_announcements"
                  disabled={props.saving}
                />
              </Stack>
            </Paper>

            {/* Action Bar & Testing */}
            <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper", borderRadius: 2.5 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
                <Stack direction="row" spacing={1}>
                  <MuiButton
                    variant="contained"
                    size="large"
                    startIcon={<Check size={18} />}
                    onClick={props.onSave}
                    disabled={props.saving || !props.selectedGroupId}
                  >
                    {props.saving ? "Đang lưu..." : "Lưu cấu hình"}
                  </MuiButton>
                  <MuiButton
                    variant="outlined"
                    size="large"
                    startIcon={<FlaskConical size={18} />}
                    onClick={props.onTestRuntime}
                    disabled={props.testing || props.saving || !props.selectedGroupId}
                  >
                    {props.testing ? "Đang gửi..." : "Gửi test vào group"}
                  </MuiButton>
                </Stack>
                {props.hasSavedConfig ? (
                  <Chip size="small" color="success" variant="outlined" label="✓ Đã lưu cấu hình" />
                ) : (
                  <Chip size="small" color="warning" variant="outlined" label="Chưa lưu thay đổi" />
                )}
              </Stack>

              {/* Runtime Diagnostics */}
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 2, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                <Chip size="small" variant="outlined" label={`Group: ${props.selectedGroupName || props.selectedGroupId || "Chưa chọn"}`} />
                <Chip size="small" color={props.runtimeLastSuccessAt ? "success" : "default"} label={props.runtimeLastSuccessAt ? `Gửi OK: ${props.runtimeLastSuccessAt}` : "Chưa gửi thành công"} />
                {props.runtimeLastErrorAt ? <Chip size="small" color="error" label={`Lỗi: ${props.runtimeLastErrorMessage || props.runtimeLastErrorAt}`} /> : null}
                {props.runtimeLastTestAt ? <Chip size="small" variant="outlined" label={`Test gần nhất: ${props.runtimeLastTestAt}`} /> : null}
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* Right Column: Live Telegram Phone Simulator */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Box sx={{ position: { lg: "sticky" }, top: { lg: 24 } }}>
            <Box sx={{ mb: 1.5, textAlign: "center" }}>
              <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 1.2, fontWeight: 700 }}>
                📱 Xem trước thực tế trên Telegram
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Thay đổi ở cột bên trái sẽ cập nhật ngay tại đây
              </Typography>
            </Box>
            <TelegramPhoneSimulator
              groupName={props.selectedGroupName || props.selectedGroupId || "Cộng Đồng Telegram"}
              messageText={props.welcomeText}
              buttonsText={props.welcomeButtonsText}
              deleteAfterSeconds={props.welcomeDeleteSeconds}
              sampleUser="@alex_member"
            />
          </Box>
        </Grid>
      </Grid>
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
  tabs: Array<{ key: string; label: string }>;
  activeWorkspaceTab: string;
  onChangeWorkspaceTab: (tab: string) => void;
}) {
  const c = UI_COPY.workbench.moderation;
  return (
    <Section eyebrow={c.eyebrow} title={c.title} subtitle={c.body} tone="security">
      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default", backgroundImage: "linear-gradient(135deg, rgba(37, 99, 235, 0.04), transparent 56%)" }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", lg: "center" } }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>Trạng thái bảo vệ</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 760 }}>
                {props.selectedGroupProtection.ready ? "Đủ điều kiện bảo vệ group đang chọn." : "Còn thiếu một số thiết lập trước khi bảo vệ đầy đủ."}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <Chip size="small" color={props.selectedGroupProtection.ready ? "success" : "warning"} label={props.selectedGroupProtection.ready ? "Ready" : "Thiếu setup"} />
              <Chip size="small" variant="outlined" label={`${props.selectedGroupProtection.enabledChecks}/${props.selectedGroupProtection.totalChecks} checks`} />
              <Chip size="small" variant="outlined" label={`${props.selectedGroupProtection.warnings.length} cảnh báo`} />
            </Stack>
          </Stack>
        </Paper>

        <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" } }}>
          {props.moderationPolicySummary.map((item) => (
            <StatCard key={item.label} compact label={item.label} value={item.value} tone="primary" />
          ))}
        </Box>

        <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default", backgroundImage: "linear-gradient(135deg, rgba(15, 118, 110, 0.04), transparent 56%)" }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" } }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Lối đi nhanh</Typography>
              <Typography variant="body2" color="text.secondary">
                Mở thẳng cấu hình, preset từ khóa hoặc flow bảo vệ group đang chọn.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <MuiButton variant="contained" onClick={props.startGroupProtectionFlow}>Mở bảo vệ group</MuiButton>
              <MuiButton variant="outlined" onClick={() => props.goToInsight({ targetLayer: "module:moderation", targetTable: "config" })}>Thiết lập dùng chung</MuiButton>
              <MuiButton variant="outlined" onClick={() => props.openTaskData("keywords")}>Preset từ khóa</MuiButton>
            </Stack>
          </Stack>
        </Paper>

        <WorkspacePanel
          title="Workspace kiểm duyệt"
          subtitle="Preset, blacklist, allowlist và cấu hình chung."
          tabs={props.tabs}
          activeTab={props.activeWorkspaceTab}
          onChangeTab={props.onChangeWorkspaceTab}
          statusChips={(
            <>
              <Chip size="small" color={props.selectedGroupProtection.ready ? "success" : "warning"} label={props.selectedGroupProtection.ready ? "Group ready" : "Thiếu setup"} />
              <Chip size="small" variant="outlined" label={`${props.selectedGroupProtection.enabledChecks}/${props.selectedGroupProtection.totalChecks} checks`} />
              <Chip size="small" variant="outlined" label={`${props.selectedGroupProtection.warnings.length} cảnh báo`} />
            </>
          )}
        />
      </Stack>
    </Section>
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
    <Section eyebrow="Module" title="Giveaway" subtitle="Campaign, tin tham gia, kết quả." tone="fun">
      <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default", backgroundImage: "linear-gradient(135deg, rgba(217, 70, 239, 0.04), transparent 56%)" }}>
        <Stack spacing={2}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start" }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>Bật module Giveaway</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 760 }}>
                Bật để dùng /giveaway, /join và /draw với template tin đẹp.
              </Typography>
            </Box>
            <Switch checked={props.moduleEnabled} onChange={props.onToggleModule} disabled={props.saving} />
          </Box>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }}>
            <Stack spacing={1.25}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Campaign giveaway</Typography>
              <Typography variant="body2" color="text.secondary">
                Tạo campaign từ popup.
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
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Danh sách campaign</Typography>
              <Typography variant="body2" color="text.secondary">
                Xem campaign và thao tác ngay trên card.
              </Typography>
              <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" } }}>
                {props.campaigns.length ? props.campaigns.map((campaign) => {
                  const status = String(campaign.status || "open");
                  const entryCount = getEntryCount(campaign.id);
                  return (
                    <Paper key={campaign.id} variant="outlined" sx={{ p: 1.75, bgcolor: "background.default", borderTop: "1px solid", borderTopColor: "divider" }}>
                      <Stack spacing={1.25}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, alignItems: "flex-start" }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>{campaign.title || "Giveaway"}</Typography>
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
                        <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40, lineHeight: 1.65 }}>
                          {campaign.description || "Không có nội dung."}
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
    <Section eyebrow="Module" title="Mở khóa bằng chia sẻ" subtitle="Link riêng, referral, mở khóa thưởng." tone="fun">
      <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default", backgroundImage: "linear-gradient(135deg, rgba(79, 70, 229, 0.04), transparent 56%)" }}>
        <Stack spacing={2}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start" }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>Bật module Share Unlock</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 760 }}>
                Bot tạo link riêng và đếm referral.
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
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Campaign mở khóa</Typography>
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
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Tiến độ và referral</Typography>
              <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" } }}>
                {props.campaigns.length ? props.campaigns.map((campaign) => {
                  const campaignReferrals = props.referrals.filter((row) => String(row.campaign_id || "") === String(campaign.id));
                  const campaignInvites = props.invites.filter((row) => String(row.campaign_id || "") === String(campaign.id));
                  const required = Number(campaign.required_invites || 5);
                  const topReferrers = topReferrersForCampaign(String(campaign.id), required);
                  return (
                    <Paper key={campaign.id} variant="outlined" sx={{ p: 1.75, bgcolor: "background.default", borderTop: "1px solid", borderTopColor: "divider" }}>
                      <Stack spacing={1.25}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>{campaign.title || "Campaign mở khóa"}</Typography>
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
                        <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40, lineHeight: 1.65 }}>
                          {campaign.description || "Không có nội dung."}
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
                    <Typography variant="overline" color="primary">Lệnh</Typography>
                    <Typography variant="body2"><code>/shareunlock &lt;campaign_id&gt;</code></Typography>
                    <Typography variant="caption" color="text.secondary">
                      Sau khi lưu campaign, user dùng lệnh này trong chat để bot tạo link riêng.
                    </Typography>
                  </Stack>
                </Paper>
                <Paper variant="outlined" sx={telegramCardSx}>
                  <Stack spacing={1}>
                    <Typography variant="overline" sx={{ color: "#f472b6" }}>Preview</Typography>
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
                    <Typography variant="overline" sx={{ color: "#f472b6" }}>Preview</Typography>
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

export function AutoReplyScreen(props: {
  moduleEnabled: boolean;
  saving: boolean;
  selectedBotKey: string;
  selectedBotName: string;
  stats: { total: number; enabled: number; smart: number; risky: number };
  rows: Array<Record<string, any>>;
  createOpen: boolean;
  createDraft: { trigger: string; match: string; ignore_diacritics?: boolean; reply: string; notes: string; enabled: boolean };
  editingRuleId: string | null;
  onOpenCreate: () => void;
  onEditAutoReply: (row: Record<string, any>) => void;
  onCloseCreate: () => void;
  onToggleModule: () => void;
  onCreateAutoReply: (draft: {
    bot_key: string;
    trigger: string;
    match: string;
    ignore_diacritics: boolean;
    reply: string;
    enabled: boolean;
    notes: string;
  }) => void;
  onDeleteAutoReply: (row: Record<string, any>) => void;
}) {
  const [trigger, setTrigger] = useState(props.createDraft.trigger);
  const [match, setMatch] = useState(props.createDraft.match);
  const [ignoreDiacritics, setIgnoreDiacritics] = useState(false);
  const [reply, setReply] = useState(props.createDraft.reply);
  const [notes, setNotes] = useState(props.createDraft.notes);
  const [enabled, setEnabled] = useState(props.createDraft.enabled);

  // Live simulator state
  const [testInput, setTestInput] = useState("alo shop ơi");

  useEffect(() => {
    if (!props.createOpen) return;
    setTrigger(props.createDraft.trigger);
    setMatch(props.createDraft.match);
    setIgnoreDiacritics(Boolean((props.createDraft as Record<string, any>).ignore_diacritics));
    setReply(props.createDraft.reply);
    setNotes(props.createDraft.notes);
    setEnabled(props.createDraft.enabled);
  }, [props.createDraft, props.createOpen]);

  // Evaluate testInput against rows
  const simulatedMatch = (() => {
    if (!testInput.trim()) return null;
    const cleanInput = testInput.trim().toLowerCase();
    const stripAccents = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    for (const r of props.rows) {
      if (r.enabled === false) continue;
      const trig = String(r.trigger || "").trim().toLowerCase();
      if (!trig) continue;

      let matched = false;
      if (r.ignore_diacritics) {
        if (stripAccents(cleanInput).includes(stripAccents(trig))) {
          matched = true;
        }
      }

      if (!matched) {
        const mode = String(r.match || "smart");
        if (mode === "exact") {
          matched = cleanInput === trig;
        } else if (mode === "contains") {
          matched = cleanInput.includes(trig);
        } else if (mode === "regex") {
          try {
            matched = new RegExp(trig, "i").test(cleanInput);
          } catch {
            matched = false;
          }
        } else {
          // smart mode
          const words = trig.split(/\s+/).filter(Boolean);
          matched = words.length > 0 && words.every((w) => cleanInput.includes(w));
        }
      }

      if (matched) {
        return r;
      }
    }
    return null;
  })();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
      {/* Studio Header & Switch */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: "background.paper",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", md: "center" },
          gap: 1.5,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(37, 99, 235, 0.12)",
              color: "primary.main",
            }}
          >
            <Zap size={20} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Xưởng Trả Lời Tự Động (Auto-Reply Chatbot Studio)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Khớp từ khóa thông minh, hỗ trợ đa biến thể nội dung cho bot: <strong>{props.selectedBotName || "Bot hiện tại"}</strong>
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {props.moduleEnabled ? "Đang bật Auto-reply" : "Đang tắt"}
            </Typography>
            <Switch checked={props.moduleEnabled} onChange={props.onToggleModule} disabled={props.saving} />
          </Stack>
          <MuiButton
            variant="contained"
            size="small"
            color="primary"
            startIcon={<Plus size={15} />}
            onClick={props.onOpenCreate}
            disabled={!props.moduleEnabled}
            sx={{ textTransform: "none", borderRadius: 1.5, boxShadow: "none" }}
          >
            Tạo quy tắc mới
          </MuiButton>
        </Stack>
      </Paper>

      {/* Stats KPI Row */}
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" } }}>
        <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2, bgcolor: "background.paper" }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>Tổng số quy tắc</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>{props.stats.total}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2, bgcolor: "background.paper" }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>Đang kích hoạt</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: "success.main" }}>{props.stats.enabled}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2, bgcolor: "background.paper" }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>Khớp thông minh (Smart)</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: "primary.main" }}>{props.stats.smart}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2, bgcolor: "background.paper" }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>Trigger nhạy cảm</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: props.stats.risky ? "warning.main" : "text.secondary" }}>{props.stats.risky}</Typography>
        </Paper>
      </Box>

      {/* Main Studio View: Simulator (Top/Side) & Rules Directory */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.2fr 0.8fr" }, gap: 2, alignItems: "start" }}>
        {/* Left: Rules Directory */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Danh Sách Quy Tắc ({props.rows.length})
            </Typography>
            <Chip size="small" label={`Bot: ${props.selectedBotName || "Toàn bộ"}`} variant="outlined" sx={{ borderRadius: 1 }} />
          </Stack>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            {props.rows.length ? (
              props.rows.map((row) => {
                const statusOn = row.enabled !== false;
                return (
                  <Paper
                    key={String(row.id || row.trigger)}
                    variant="outlined"
                    sx={{
                      p: 1.75,
                      borderRadius: 1.5,
                      border: "1px solid",
                      borderColor: statusOn ? "divider" : "divider",
                      bgcolor: statusOn ? "background.paper" : "action.hover",
                      opacity: statusOn ? 1 : 0.65,
                      transition: "all 0.15s ease",
                      "&:hover": {
                        borderColor: "primary.main",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      },
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "primary.main" }}>
                              {String(row.trigger || "Chưa đặt trigger")}
                            </Typography>
                            <Chip
                              size="small"
                              variant="outlined"
                              label={`Kiểu: ${String(row.match || "smart")}`}
                              sx={{ height: 22, fontSize: 11, borderRadius: 1 }}
                            />
                            {row.ignore_diacritics ? (
                              <Chip
                                size="small"
                                color="warning"
                                variant="outlined"
                                label="Bỏ dấu"
                                sx={{ height: 22, fontSize: 11, borderRadius: 1 }}
                              />
                            ) : null}
                          </Stack>
                        </Box>

                        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                          <Chip
                            size="small"
                            color={statusOn ? "success" : "default"}
                            label={statusOn ? "Hoạt động" : "Tắt"}
                            sx={{ height: 22, fontSize: 11, fontWeight: 600, borderRadius: 1 }}
                          />
                          <MuiButton
                            size="small"
                            variant="outlined"
                            onClick={() => props.onEditAutoReply(row)}
                            sx={{ textTransform: "none", height: 26, borderRadius: 1 }}
                          >
                            Sửa
                          </MuiButton>
                          <MuiButton
                            size="small"
                            variant="text"
                            color="error"
                            onClick={() => props.onDeleteAutoReply(row)}
                            sx={{ textTransform: "none", height: 26 }}
                          >
                            Xóa
                          </MuiButton>
                        </Stack>
                      </Stack>

                      {/* Reply Bubble */}
                      <Box
                        sx={{
                          p: 1.25,
                          borderRadius: 1.5,
                          bgcolor: "action.hover",
                          borderLeft: "3px solid",
                          borderLeftColor: "primary.main",
                          fontSize: 13,
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {String(row.reply || "Chưa có nội dung trả lời.")}
                      </Box>
                    </Stack>
                  </Paper>
                );
              })
            ) : (
              <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
                <Zap size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <Typography variant="body2">Chưa có quy tắc tự động nào. Hãy tạo quy tắc mới.</Typography>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Right: Live Interactive Rule Matcher Simulator */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 2,
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            position: { lg: "sticky" },
            top: { lg: 80 },
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: 1.5,
                bgcolor: "rgba(16, 185, 129, 0.12)",
                color: "success.main",
                display: "grid",
                placeItems: "center",
              }}
            >
              <FlaskConical size={16} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Thử Nghiệm Trả Lời Trực Tiếp (Live Sandbox)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Gõ câu nói của thành viên để kiểm tra bot sẽ phản hồi thế nào
              </Typography>
            </Box>
          </Stack>

          <TextField
            size="small"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Nhập câu tin nhắn để thử nghiệm..."
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <MessageSquare size={15} style={{ color: "#94a3b8" }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
          />

          <Divider />

          {/* Test Verdict & Chat Mockup */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Kết quả kiểm tra:
              </Typography>
              {simulatedMatch ? (
                <Chip
                  size="small"
                  color="success"
                  icon={<CheckCircle2 size={12} />}
                  label={`Khớp quy tắc: "${simulatedMatch.trigger}"`}
                  sx={{ height: 22, fontSize: 11, borderRadius: 1, fontWeight: 700 }}
                />
              ) : (
                <Chip
                  size="small"
                  color="default"
                  label="Không khớp quy tắc nào"
                  sx={{ height: 22, fontSize: 11, borderRadius: 1 }}
                />
              )}
            </Stack>

            {/* Telegram Chat Simulation */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "#0e1621",
                color: "#fff",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                minHeight: 160,
              }}
            >
              {/* User speech */}
              <Box sx={{ alignSelf: "flex-end", maxWidth: "80%" }}>
                <Box
                  sx={{
                    bgcolor: "#2b5278",
                    p: 1.25,
                    borderRadius: "12px 12px 2px 12px",
                    fontSize: 13,
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#fff", fontSize: 13 }}>
                    {testInput || "..."}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontSize: 10, display: "block", textAlign: "right", mt: 0.25 }}>
                    10:30
                  </Typography>
                </Box>
              </Box>

              {/* Bot response */}
              {simulatedMatch ? (
                <Box sx={{ alignSelf: "flex-start", maxWidth: "85%" }}>
                  <Box
                    sx={{
                      bgcolor: "#182533",
                      p: 1.25,
                      borderRadius: "12px 12px 12px 2px",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "#64b5f6", fontWeight: 700, display: "block", mb: 0.25 }}>
                      {props.selectedBotName || "CU Bot"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#fff", fontSize: 13, whiteSpace: "pre-wrap" }}>
                      {String(simulatedMatch.reply || "...")}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontSize: 10, display: "block", textAlign: "right", mt: 0.25 }}>
                      10:30 ✓✓
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ alignSelf: "flex-start", opacity: 0.5, fontStyle: "italic", fontSize: 12 }}>
                  (Bot giữ im lặng vì không có từ khóa kích hoạt)
                </Box>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Dialog for Creating & Editing Rule */}
      <Dialog open={props.createOpen} onClose={props.onCloseCreate} fullWidth maxWidth="md">
        <DialogTitle sx={{ pb: 1.25 }}>
          <Stack spacing={0.5}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {props.editingRuleId ? "Sửa câu trả lời tự động" : "Tạo câu trả lời tự động"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Thiết lập từ khóa, kiểu khớp và phản hồi của bot
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "background.default" }}>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Từ khóa kích hoạt (Trigger)"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              placeholder="Ví dụ: giá, hướng dẫn, alo"
              helperText="Từ hoặc cụm từ mà khi thành viên nhắn, bot sẽ phản hồi"
              fullWidth
            />
            <TextField
              select
              label="Kiểu khớp (Match Mode)"
              value={match}
              onChange={(e) => setMatch(e.target.value)}
              fullWidth
            >
              <MenuItem value="smart">Smart (Thông minh, khớp theo từ khóa linh hoạt)</MenuItem>
              <MenuItem value="exact">Trùng khớp tuyệt đối (Chính xác 100% câu)</MenuItem>
              <MenuItem value="contains">Có chứa cụm từ (Contains)</MenuItem>
              <MenuItem value="regex">Regex biểu thức chính quy</MenuItem>
            </TextField>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "background.paper" }}>
              <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle2">Bỏ qua dấu tiếng Việt khi khớp</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cho phép khớp cả &ldquo;gia&rdquo; lẫn &ldquo;giá&rdquo;, &ldquo;alo&rdquo; lẫn &ldquo;alô&rdquo;
                  </Typography>
                </Box>
                <Switch checked={ignoreDiacritics} onChange={(e) => setIgnoreDiacritics(e.target.checked)} />
              </Stack>
            </Paper>
            <TextField
              multiline
              minRows={5}
              label="Nội dung bot trả lời"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Nhập nội dung tin nhắn bot sẽ gửi..."
              helperText="Hỗ trợ các placeholder: {user}, {group}"
              fullWidth
            />
            <TextField
              label="Ghi chú nội bộ"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú mục đích sử dụng của rule này..."
              fullWidth
            />
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "background.paper" }}>
              <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle2">Kích hoạt quy tắc</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Bật quy tắc này hoạt động ngay sau khi lưu
                  </Typography>
                </Box>
                <Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton variant="outlined" onClick={props.onCloseCreate} sx={{ textTransform: "none", borderRadius: 1.5 }}>
            Hủy
          </MuiButton>
          <MuiButton
            variant="contained"
            onClick={() => {
              props.onCreateAutoReply({
                bot_key: props.selectedBotKey || "main",
                trigger,
                match,
                ignore_diacritics: ignoreDiacritics,
                reply,
                enabled,
                notes,
              });
              props.onCloseCreate();
            }}
            disabled={!props.moduleEnabled || !trigger.trim()}
            sx={{ textTransform: "none", borderRadius: 1.5 }}
          >
            {props.editingRuleId ? "Lưu thay đổi" : "Lưu quy tắc"}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export function ScamScreen(props: {
  pendingScamReports: number;
  scamWorkbenchRows: NamedRow[];
  currentBotName: string;
  selectedBot: string;
  openTaskData: (key: string) => void;
}) {
  const c = UI_COPY.workbench.scam;
  return (
    <Section
      eyebrow={c.eyebrow}
      title={c.title}
      subtitle="Queue scam và inbox duyệt."
      tone="scam"
      actions={
        <Paper variant="outlined" sx={{ px: 2, py: 1, bgcolor: "background.default" }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>{props.pendingScamReports}</Typography>
          <Typography variant="caption" color="text.secondary">{c.pending}</Typography>
        </Paper>
      }
    >
      <Stack spacing={2}>
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
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" } }}>
            <Box>
              <Typography variant="subtitle2">{c.queue}</Typography>
              <Typography variant="body2" color="text.secondary">{c.priority}</Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <MuiButton variant="contained" onClick={() => props.openTaskData("scam_reports")}>
                {c.open}
              </MuiButton>
              <MuiButton variant="outlined" onClick={() => props.openTaskData("scam_entities")}>
                Hồ sơ scam
              </MuiButton>
            </Stack>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
          <Stack spacing={1}>
            <Typography variant="subtitle2">Bản tin chờ duyệt gần nhất</Typography>
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
      </Stack>
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
    <Section eyebrow={c.eyebrow} title={c.title} subtitle="Kiểm tra bot, scope và điều kiện." tone="main">
      <Stack spacing={2}>
        <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" } }}>
          {props.setupChecklist.map((item) => (
            <StatCard
              key={item.label}
              compact
              label={item.label}
              value={item.done ? "OK" : "Thiếu"}
              tone={item.done ? "success" : "warning"}
            />
          ))}
        </Box>

        <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default", backgroundImage: "linear-gradient(135deg, rgba(15, 118, 110, 0.04), transparent 56%)" }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" } }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Lối đi nhanh</Typography>
              <Typography variant="body2" color="text.secondary">
                Đi tới bot, module hoặc logs.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <MuiButton variant="contained" onClick={() => props.openTaskData("bots")}>Mở bot</MuiButton>
              <MuiButton variant="outlined" onClick={() => props.openTaskData("module_settings")}>Cài đặt module</MuiButton>
              <MuiButton variant="outlined" onClick={() => props.selectLayer("logs")}>Mở logs</MuiButton>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
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
  tabs: Array<{ key: string; label: string }>;
  activeTab: string;
  onChangeTab: (tab: string) => void;
}) {
  const c = UI_COPY.workbench.group;
  return (
    <Section
      eyebrow={c.eyebrow}
      title={c.title}
      subtitle="Quản lý group và phạm vi bot."
      tone="content"
    >
      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" } }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {props.selectedScopeRow ? props.selectedScopeRow.group_name || props.selectedScope : "Toàn hệ thống"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {props.setupChecklist.filter((item) => item.done).length}/{props.setupChecklist.length} mục sẵn sàng
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <MuiButton variant="contained" onClick={props.startCreate}>Tạo group</MuiButton>
              <MuiButton variant="outlined" onClick={() => props.openTaskData("groups")}>Mở danh sách</MuiButton>
              <MuiButton variant="outlined" onClick={() => props.selectLayer("logs")}>Xem logs</MuiButton>
            </Stack>
          </Stack>
        </Paper>

        <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" } }}>
          {props.setupChecklist.map((item) => (
            <StatCard
              key={item.label}
              compact
              label={item.label}
              value={item.done ? "OK" : "Thiếu"}
              tone={item.done ? "success" : "warning"}
            />
          ))}
        </Box>

        {props.setupIssues.length ? (
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
            <Stack spacing={0.75}>
              <Typography variant="subtitle2">Việc còn thiếu</Typography>
              {props.setupIssues.map((issue) => (
                <Typography key={issue} variant="body2" color="text.secondary">
                  • {issue}
                </Typography>
              ))}
            </Stack>
          </Paper>
        ) : null}

        <WorkspacePanel
          title="Workspace group"
          subtitle="Danh sách group, allowlist, admin và role."
          tabs={props.tabs}
          activeTab={props.activeTab}
          onChangeTab={props.onChangeTab}
          actions={(
            <MuiButton variant="contained" startIcon={<Plus size={16} />} onClick={props.startCreate}>
              Thêm group
            </MuiButton>
          )}
          statusChips={(
            <>
              <Chip size="small" variant="outlined" label={props.selectedScopeRow ? props.selectedScopeRow.group_name || props.selectedScope : "Toàn hệ thống"} />
              <Chip size="small" color={props.setupIssues.length ? "warning" : "success"} label={props.setupIssues.length ? `${props.setupIssues.length} việc còn thiếu` : "Đủ setup cơ bản"} />
            </>
          )}
        />
      </Stack>
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
