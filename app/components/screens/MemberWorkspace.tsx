"use client";

import type { ElementType } from "react";
import {
  Alert,
  Box,
  Button as MuiButton,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AlertCircle,
  Ban,
  Clock,
  ExternalLink,
  Filter,
  LogOut,
  MessageSquare,
  MicOff,
  Plus,
  RefreshCcw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Unlock,
  UserCheck,
  Users,
  Volume2,
} from "lucide-react";
import type { MemberFilterState, MemberOverview, MemberWorkspaceTab, Row } from "@/lib/cp-types";
import { formatDateTime } from "@/lib/cp-helpers";

export type MemberWorkspaceProps = {
  systemBlacklistActive: boolean;
  loadMemberOverview: (search: string) => Promise<void>;
  memberOverviewLoading: boolean;
  openMemberAction: (row: Row, action: "mute" | "ban" | "unmute" | "unban" | "blacklist" | "unblacklist") => void;
  effectiveMemberChatId: string | null;
  selectedMemberChatId: string | null;
  systemBlacklistStats: Array<{ label: string; value: string | number; Icon: any; color: any }>;
  memberStatsCards: Array<{ label: string; value: string | number; Icon: any; color: any }>;
  memberActionFeedback: { type: "success" | "error"; message: string } | null;
  memberSearchInput: string;
  setMemberSearchInput: (value: string) => void;
  memberFilters: MemberFilterState;
  setMemberFilters: React.Dispatch<React.SetStateAction<MemberFilterState>>;
  resetMemberFilters: () => void;
  memberActiveMeta: string;
  memberFilteredRows: Row[];
  memberPage: number;
  memberTotalPages: number;
  memberTabItems: Array<{ key: MemberWorkspaceTab; label: string }>;
  memberTab: MemberWorkspaceTab;
  memberOverview: MemberOverview | null;
  memberLoadedCount: number;
  memberPageSize: number;
  setMemberPage: React.Dispatch<React.SetStateAction<number>>;
  openMemberDetail: (row: Row) => void;
  runMemberAction: (row: Row, action: "mute" | "ban" | "unmute" | "unban" | "blacklist" | "unblacklist") => Promise<void>;
  memberReleaseActionFor: (row: Row) => { action: any; label: string } | null;
  memberTabLabel: (tab: MemberWorkspaceTab) => string;
  memberLaneDescription: (tab: any) => string;
  memberLaneTone: (lane: any) => any;
  memberLaneOfRow: (row: Row) => "observed" | "moderated" | "left";
  memberUserId: (row: Row) => string;
  memberStatusOf: (row: Row) => string;
  memberReasonOf: (row: Row) => string;
  memberLastSeen: (row: Row) => string;
  memberDisplayName: (row: Row) => string;
  memberUsername: (row: Row) => string;
  memberStatusBadgeLabel: (row: Row) => string;
};

function getAvatarStyle(name: string, id: string) {
  const text = (name || id || "?").trim();
  const initial = text.charAt(0).toUpperCase();
  const palettes = [
    { bg: "rgba(59, 130, 246, 0.12)", color: "#2563eb", border: "rgba(59, 130, 246, 0.25)" },
    { bg: "rgba(16, 185, 129, 0.12)", color: "#059669", border: "rgba(16, 185, 129, 0.25)" },
    { bg: "rgba(139, 92, 246, 0.12)", color: "#7c3aed", border: "rgba(139, 92, 246, 0.25)" },
    { bg: "rgba(245, 158, 11, 0.12)", color: "#d97706", border: "rgba(245, 158, 11, 0.25)" },
    { bg: "rgba(236, 72, 153, 0.12)", color: "#db2777", border: "rgba(236, 72, 153, 0.25)" },
    { bg: "rgba(14, 165, 233, 0.12)", color: "#0284c7", border: "rgba(14, 165, 233, 0.25)" },
  ];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const chosen = palettes[Math.abs(hash) % palettes.length];
  return { initial, ...chosen };
}

export default function MemberWorkspace({
  systemBlacklistActive,
  loadMemberOverview,
  memberOverviewLoading,
  openMemberAction,
  effectiveMemberChatId,
  selectedMemberChatId,
  systemBlacklistStats,
  memberStatsCards,
  memberActionFeedback,
  memberSearchInput,
  setMemberSearchInput,
  memberFilters,
  setMemberFilters,
  resetMemberFilters,
  memberActiveMeta,
  memberFilteredRows,
  memberPage,
  memberTotalPages,
  memberTabItems,
  memberTab,
  memberOverview,
  memberLoadedCount,
  memberPageSize,
  setMemberPage,
  openMemberDetail,
  runMemberAction,
  memberReleaseActionFor,
  memberTabLabel,
  memberLaneDescription,
  memberLaneTone,
  memberLaneOfRow,
  memberUserId,
  memberStatusOf,
  memberReasonOf,
  memberLastSeen,
  memberDisplayName,
  memberUsername,
  memberStatusBadgeLabel,
}: MemberWorkspaceProps) {
  const statsList = systemBlacklistActive ? systemBlacklistStats : memberStatsCards;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* SaaS Header & Quick Actions */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: 1.5,
          p: 2,
          borderRadius: 2,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                display: "grid",
                placeItems: "center",
                bgcolor: systemBlacklistActive ? "rgba(239,68,68,0.12)" : "rgba(37,99,235,0.12)",
                color: systemBlacklistActive ? "error.main" : "primary.main",
              }}
            >
              {systemBlacklistActive ? <ShieldAlert size={18} /> : <Users size={18} />}
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {systemBlacklistActive ? "Blacklist Toàn Hệ Thống" : "Danh Bạ & Thành Viên Nhóm"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {systemBlacklistActive
                  ? "Chặn triệt để trên toàn bộ các bot và nhóm thuộc quyền quản lý"
                  : "Quản lý hoạt động thành viên, tra cứu danh tính và xử lý vi phạm"}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <MuiButton
            variant="outlined"
            size="small"
            startIcon={<RefreshCcw size={14} />}
            onClick={() => void loadMemberOverview(memberFilters.search)}
            disabled={memberOverviewLoading}
            sx={{ textTransform: "none", borderRadius: 1.5 }}
          >
            Làm mới
          </MuiButton>
          <MuiButton
            variant="contained"
            size="small"
            color={systemBlacklistActive ? "error" : "primary"}
            startIcon={<Plus size={15} />}
            onClick={() => openMemberAction({}, systemBlacklistActive ? "blacklist" : "mute")}
            disabled={!effectiveMemberChatId && !systemBlacklistActive}
            sx={{ textTransform: "none", borderRadius: 1.5, boxShadow: "none" }}
          >
            {systemBlacklistActive ? "Thêm vào Blacklist" : "Thao tác thành viên"}
          </MuiButton>
        </Stack>
      </Box>

      {/* Metric KPI Cards */}
      <Grid container spacing={1.5}>
        {statsList.map(({ label, value, Icon, color }) => (
          <Grid key={label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 1.75,
                bgcolor: "background.paper",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderColor: systemBlacklistActive && label === "User bị chặn" ? "error.light" : "divider",
                transition: "all 0.15s ease",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                  borderColor: "primary.main",
                },
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.25 }}>
                  {value}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: (theme) => (theme.palette as any)[color]?.light || "action.hover",
                  color: (theme) => (theme.palette as any)[color]?.main || "text.primary",
                  display: "grid",
                  placeItems: "center",
                  opacity: 0.9,
                }}
              >
                <Icon size={18} />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Action feedback toast alert */}
      {memberActionFeedback ? (
        <Alert severity={memberActionFeedback.type} sx={{ borderRadius: 2 }}>
          {memberActionFeedback.message}
        </Alert>
      ) : null}

      {/* Filter & Search Console */}
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
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: "center" }}>
          <TextField
            size="small"
            value={memberSearchInput}
            onChange={(e) => setMemberSearchInput(e.target.value)}
            placeholder="Tìm theo tên hiển thị, @username, Telegram UID..."
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} style={{ color: "#94a3b8" }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              flex: 1,
              width: "100%",
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
              },
            }}
          />

          <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", md: "auto" }, flexWrap: "wrap" }}>
            <TextField
              select
              size="small"
              label="Trạng thái"
              value={memberFilters.status}
              onChange={(e) => setMemberFilters((cur) => ({ ...cur, status: e.target.value as MemberFilterState["status"] }))}
              sx={{ minWidth: 125, "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="normal">Bình thường</MenuItem>
              <MenuItem value="muted">Bị cấm chat</MenuItem>
              <MenuItem value="banned">Bị cấm vào</MenuItem>
              <MenuItem value="blacklisted">Blacklist</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Sắp xếp"
              value={`${memberFilters.sortBy}:${memberFilters.sortDir}`}
              onChange={(e) => {
                const [sortBy, sortDir] = String(e.target.value).split(":");
                setMemberFilters((cur) => ({
                  ...cur,
                  sortBy: sortBy as MemberFilterState["sortBy"],
                  sortDir: sortDir as MemberFilterState["sortDir"],
                }));
              }}
              sx={{ minWidth: 140, "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
            >
              <MenuItem value="last_seen_at:desc">Hoạt động gần nhất</MenuItem>
              <MenuItem value="last_seen_at:asc">Lâu nhất</MenuItem>
              <MenuItem value="display_name:asc">Tên (A → Z)</MenuItem>
              <MenuItem value="display_name:desc">Tên (Z → A)</MenuItem>
              <MenuItem value="status:asc">Theo mức độ vi phạm</MenuItem>
            </TextField>

            <MuiButton
              variant="outlined"
              size="small"
              startIcon={<SlidersHorizontal size={14} />}
              onClick={resetMemberFilters}
              sx={{ textTransform: "none", borderRadius: 1.5, minWidth: 80 }}
            >
              Đặt lại
            </MuiButton>
          </Stack>
        </Stack>

        <Divider />

        {/* Lane chips & Scope Context */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Phân loại:
            </Typography>
            {memberTabItems.map((item) => (
              <Chip
                key={item.key}
                color={memberLaneTone(item.key)}
                variant={memberTab === item.key ? "filled" : "outlined"}
                label={item.label}
                size="small"
                sx={{ borderRadius: 1.5, fontWeight: memberTab === item.key ? 700 : 500 }}
              />
            ))}
          </Stack>

          <Typography variant="caption" color="text.secondary">
            {memberActiveMeta} · <strong>{memberFilteredRows.length}</strong> kết quả · Trang {memberPage}/{memberTotalPages || 1}
          </Typography>
        </Box>

        {!systemBlacklistActive && !selectedMemberChatId ? (
          <Alert severity="warning" sx={{ py: 0.5, borderRadius: 1.5 }}>
            Vui lòng chọn <strong>Nhóm (Scope)</strong> trên thanh điều hướng để thực hiện các thao tác Mute/Ban chính xác theo Group.
          </Alert>
        ) : null}
      </Paper>

      {/* Directory Member Rows */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {memberOverviewLoading ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 2, bgcolor: "background.paper" }}>
            <CircularProgress size={26} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              Đang tải danh bạ thành viên...
            </Typography>
          </Paper>
        ) : null}

        {!memberOverviewLoading && memberFilteredRows.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 2, bgcolor: "background.paper" }}>
            <Users size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Không tìm thấy thành viên nào
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Thử thay đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc trạng thái.
            </Typography>
          </Paper>
        ) : null}

        {!memberOverviewLoading &&
          memberFilteredRows.map((row) => {
            const userId = memberUserId(row);
            const status = memberStatusOf(row);
            const reason = memberReasonOf(row);
            const lastSeen = memberLastSeen(row);
            const lane = memberLaneOfRow(row);
            const displayName = memberDisplayName(row);
            const username = memberUsername(row);
            const avatar = getAvatarStyle(displayName, userId);
            const releaseAction = memberReleaseActionFor(row);

            return (
              <Paper
                key={`${memberTab}-${userId || row.id || username}`}
                variant="outlined"
                onClick={() => openMemberDetail(row)}
                sx={{
                  p: 1.75,
                  borderRadius: 2,
                  bgcolor: "background.paper",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  border: "1px solid",
                  borderColor: "divider",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" } }}
                >
                  {/* Left: Avatar + Identity Info */}
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        bgcolor: avatar.bg,
                        color: avatar.color,
                        border: `1px solid ${avatar.border}`,
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 700,
                        fontSize: 16,
                        flexShrink: 0,
                      }}
                    >
                      {avatar.initial}
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                          {displayName}
                        </Typography>
                        {username ? (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            @{username}
                          </Typography>
                        ) : null}
                      </Stack>

                      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap", mt: 0.25 }}>
                        <Chip
                          size="small"
                          label={`ID: ${userId || "-"}`}
                          variant="outlined"
                          sx={{ height: 20, fontSize: 11, fontFamily: "monospace", borderRadius: 1 }}
                        />
                        {lastSeen ? (
                          <Chip
                            size="small"
                            icon={<Clock size={11} />}
                            label={formatDateTime(lastSeen)}
                            variant="outlined"
                            sx={{ height: 20, fontSize: 11, borderRadius: 1 }}
                          />
                        ) : null}
                        {row.message_count !== undefined ? (
                          <Chip
                            size="small"
                            icon={<MessageSquare size={11} />}
                            label={`${row.message_count} tin`}
                            variant="outlined"
                            sx={{ height: 20, fontSize: 11, borderRadius: 1 }}
                          />
                        ) : null}
                      </Stack>
                    </Box>
                  </Stack>

                  {/* Right: Status Badges & Direct Action Buttons */}
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    sx={{
                      alignItems: { xs: "flex-start", sm: "center" },
                      justifyContent: "flex-end",
                      width: { xs: "100%", sm: "auto" },
                    }}
                  >
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                      <Chip
                        size="small"
                        color={memberLaneTone(lane)}
                        label={memberStatusBadgeLabel(row)}
                        sx={{ fontWeight: 600, height: 24, borderRadius: 1.5 }}
                      />
                      {reason ? (
                        <Tooltip title={reason} arrow>
                          <Chip
                            size="small"
                            variant="outlined"
                            color="warning"
                            icon={<AlertCircle size={12} />}
                            label={reason.length > 20 ? `${reason.substring(0, 20)}...` : reason}
                            sx={{ height: 24, borderRadius: 1.5 }}
                          />
                        </Tooltip>
                      ) : null}
                    </Stack>

                    {/* Quick moderation buttons */}
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                      {lane !== "left" ? (
                        <Tooltip title="Cấm phát ngôn (Mute)">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={(e) => {
                              e.stopPropagation();
                              openMemberAction(row, "mute");
                            }}
                            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}
                          >
                            <MicOff size={15} />
                          </IconButton>
                        </Tooltip>
                      ) : null}

                      {lane !== "left" ? (
                        <Tooltip title="Trục xuất & Cấm (Ban)">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              openMemberAction(row, "ban");
                            }}
                            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}
                          >
                            <Ban size={15} />
                          </IconButton>
                        </Tooltip>
                      ) : null}

                      {lane === "moderated" && status === "muted" ? (
                        <Tooltip title="Mở cấm phát ngôn">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={(e) => {
                              e.stopPropagation();
                              openMemberAction(row, "unmute");
                            }}
                            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}
                          >
                            <Volume2 size={15} />
                          </IconButton>
                        </Tooltip>
                      ) : null}

                      {lane === "moderated" && releaseAction ? (
                        <MuiButton
                          size="small"
                          variant="outlined"
                          color="success"
                          startIcon={<Unlock size={13} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            void runMemberAction(row, releaseAction.action);
                          }}
                          sx={{ textTransform: "none", height: 30, borderRadius: 1.5 }}
                        >
                          {releaseAction.label}
                        </MuiButton>
                      ) : null}

                      <Tooltip title="Xem hồ sơ chi tiết">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            openMemberDetail(row);
                          }}
                          sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}
                        >
                          <ExternalLink size={15} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Stack>
              </Paper>
            );
          })}

        {/* Pagination Console */}
        {!memberOverviewLoading && memberTotalPages > 1 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1.5,
              p: 1.5,
              borderRadius: 2,
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              mt: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Hiển thị{" "}
              <strong>
                {Math.min((memberPage - 1) * memberPageSize + 1, memberLoadedCount)}-
                {Math.min(memberPage * memberPageSize, memberLoadedCount)}
              </strong>{" "}
              trên tổng số <strong>{memberLoadedCount}</strong> thành viên
            </Typography>

            <Stack direction="row" spacing={1}>
              <MuiButton
                size="small"
                variant="outlined"
                disabled={memberPage <= 1}
                onClick={() => setMemberPage((cur) => Math.max(1, cur - 1))}
                sx={{ textTransform: "none", borderRadius: 1.5 }}
              >
                Trang trước
              </MuiButton>
              <Chip
                label={`${memberPage} / ${memberTotalPages}`}
                size="small"
                variant="outlined"
                sx={{ height: 30, borderRadius: 1.5, fontWeight: 700 }}
              />
              <MuiButton
                size="small"
                variant="outlined"
                disabled={memberPage >= memberTotalPages}
                onClick={() => setMemberPage((cur) => Math.min(memberTotalPages, cur + 1))}
                sx={{ textTransform: "none", borderRadius: 1.5 }}
              >
                Trang sau
              </MuiButton>
            </Stack>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
