"use client";

import type { ElementType } from "react";
import {
  Alert,
  Box,
  Button as MuiButton,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  LogOut,
  Plus,
  RefreshCcw,
  Search,
  Shield,
  SlidersHorizontal,
  Users,
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
  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", lg: "center" } }}>
          <Box>
            <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 1.2 }}>{systemBlacklistActive ? "Blacklist" : "Members"}</Typography>
            <Typography variant="h5">{systemBlacklistActive ? "Blacklist toàn hệ thống" : "Dashboard quản lý thành viên"}</Typography>
            <Typography variant="body2" color="text.secondary">
              {systemBlacklistActive
                ? "Áp dụng cho tất cả bot và group đang quản lý."
                : "Theo dõi observed, moderated và left theo scope."}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", justifyContent: { xs: "flex-start", lg: "flex-end" } }}>
            <MuiButton variant="outlined" startIcon={<RefreshCcw size={16} />} onClick={() => void loadMemberOverview(memberFilters.search)} disabled={memberOverviewLoading}>
              Làm mới
            </MuiButton>
            <MuiButton variant="contained" startIcon={<Plus size={16} />} onClick={() => openMemberAction({}, systemBlacklistActive ? "blacklist" : "mute")} disabled={!effectiveMemberChatId}>
              {systemBlacklistActive ? "Thêm blacklist" : "Thao tác user"}
            </MuiButton>
          </Stack>
        </Stack>

        <Grid container spacing={1.5}>
          {(systemBlacklistActive ? systemBlacklistStats : memberStatsCards).map(({ label, value, Icon, color }) => (
            <Grid key={label} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Paper variant="outlined" sx={{ p: 1.75, bgcolor: "background.default", height: "100%", borderColor: systemBlacklistActive && label === "User bị chặn" ? "error.light" : "divider" }}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700 }}>{label}</Typography>
                    <Typography variant="h4">{value}</Typography>
                  </Box>
                  <Chip color={color} icon={<Icon size={16} />} label={systemBlacklistActive ? "system" : "snapshot"} variant="outlined" />
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {memberActionFeedback ? (
          <Alert severity={memberActionFeedback.type}>
            {memberActionFeedback.message}
          </Alert>
        ) : null}

        <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25} sx={{ alignItems: { xs: "stretch", lg: "center" }, justifyContent: "space-between" }}>
              <TextField
                size="small"
                value={memberSearchInput}
                onChange={(event) => {
                  setMemberSearchInput(event.target.value);
                }}
                placeholder="Tìm theo tên, username, ID, lý do..."
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={16} />
                      </InputAdornment>
                    )
                  }
                }}
                sx={{ minWidth: { xs: "100%", lg: 360 }, flex: 1 }}
              />
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", justifyContent: { xs: "flex-start", lg: "flex-end" } }}>
                <TextField select size="small" label="Trạng thái" value={memberFilters.status} onChange={(event) => setMemberFilters((current) => ({ ...current, status: event.target.value as MemberFilterState["status"] }))} sx={{ minWidth: 140 }}>
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="muted">Muted</MenuItem>
                  <MenuItem value="banned">Banned</MenuItem>
                  <MenuItem value="blacklisted">Blacklisted</MenuItem>
                </TextField>
                <TextField select size="small" label="Nguồn" value={memberFilters.source} onChange={(event) => setMemberFilters((current) => ({ ...current, source: event.target.value as MemberFilterState["source"] }))} sx={{ minWidth: 140 }}>
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="activity">Activity</MenuItem>
                  <MenuItem value="state">State</MenuItem>
                  <MenuItem value="audit">Audit</MenuItem>
                  <MenuItem value="activity+state">Activity + State</MenuItem>
                </TextField>
                <TextField select size="small" label="Lý do" value={memberFilters.reason} onChange={(event) => setMemberFilters((current) => ({ ...current, reason: event.target.value as MemberFilterState["reason"] }))} sx={{ minWidth: 150 }}>
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="has_reason">Có lý do</MenuItem>
                  <MenuItem value="missing_reason">Thiếu lý do</MenuItem>
                </TextField>
                <TextField select size="small" label="Sắp xếp" value={`${memberFilters.sortBy}:${memberFilters.sortDir}`} onChange={(event) => {
                  const [sortBy, sortDir] = String(event.target.value).split(":");
                  setMemberFilters((current) => ({ ...current, sortBy: sortBy as MemberFilterState["sortBy"], sortDir: sortDir as MemberFilterState["sortDir"] }));
                }} sx={{ minWidth: 170 }}>
                  <MenuItem value="last_seen_at:desc">Mới nhất</MenuItem>
                  <MenuItem value="last_seen_at:asc">Cũ nhất</MenuItem>
                  <MenuItem value="display_name:asc">Tên A-Z</MenuItem>
                  <MenuItem value="display_name:desc">Tên Z-A</MenuItem>
                  <MenuItem value="status:asc">Trạng thái A-Z</MenuItem>
                </TextField>
                <MuiButton variant="outlined" startIcon={<SlidersHorizontal size={16} />} onClick={resetMemberFilters}>
                  Reset
                </MuiButton>
              </Stack>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="caption" color="text.secondary">
                {memberActiveMeta} · {memberFilteredRows.length} kết quả · trang {memberPage}/{memberTotalPages}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {memberTabItems.map((item) => (
                  <Chip
                    key={item.key}
                    color={memberLaneTone(item.key)}
                    variant="outlined"
                    label={item.label}
                  />
                ))}
              </Stack>
              {!systemBlacklistActive && !selectedMemberChatId ? <Alert severity="warning" sx={{ py: 0.5 }}>Chọn Scope để thao tác đúng group.</Alert> : null}
              {systemBlacklistActive ? <Alert severity="error" sx={{ py: 0.5 }}>Blacklist này áp dụng ở scope hệ thống bot_key=* và chat_id=*.</Alert> : null}
            </Stack>
          </Stack>
        </Paper>

        <Stack spacing={1.25}>
          {memberOverviewLoading ? (
            <Paper variant="outlined" sx={{ p: 3, textAlign: "center", bgcolor: "background.default" }}>
              <CircularProgress size={22} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Đang tải trạng thái thành viên...</Typography>
            </Paper>
          ) : null}

          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              bgcolor: "background.default",
              borderColor: `${memberLaneTone(memberTab)}.main`,
            }}
          >
            <Stack spacing={1.25}>
              <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" }}>
                <Box>
                  <Typography variant="overline" color={`${memberLaneTone(memberTab)}.main`} sx={{ letterSpacing: 1.1 }}>
                    {memberTab === "observed" ? "Observed" : memberTab === "moderated" ? "Moderated" : "Left"}
                  </Typography>
                  <Typography variant="h6">{memberTabLabel(memberTab)}</Typography>
                  <Typography variant="body2" color="text.secondary">{memberLaneDescription(memberTab)}</Typography>
                </Box>
              </Stack>

              {!memberOverviewLoading && memberFilteredRows.map((row) => {
                const userId = memberUserId(row);
                const status = memberStatusOf(row);
                const reason = memberReasonOf(row);
                const lastSeen = memberLastSeen(row);
                const lane = memberLaneOfRow(row);
                return (
                  <Paper key={`${memberTab}-${userId || row.id || row.username}`} variant="outlined" sx={{ p: 1.25, bgcolor: "background.paper", cursor: "pointer" }} onClick={() => openMemberDetail(row)}>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                        <Stack direction="row" spacing={1} sx={{ minWidth: 0, alignItems: "center" }}>
                          <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: lane === "observed" ? "rgba(34,197,94,0.14)" : lane === "moderated" ? "rgba(245,158,11,0.16)" : "rgba(59,130,246,0.14)", color: lane === "observed" ? "success.main" : lane === "moderated" ? "warning.main" : "info.main", display: "grid", placeItems: "center", flex: "0 0 auto" }}>
                            {lane === "observed" ? <Users size={18} /> : lane === "moderated" ? <Shield size={18} /> : <LogOut size={18} />}
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" noWrap>{memberDisplayName(row)}</Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {memberUsername(row) || "Không có username"} · ID {userId || "-"}
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <Chip size="small" color={memberLaneTone(lane)} label={memberStatusBadgeLabel(row)} />
                          <Chip size="small" variant="outlined" color={memberLaneTone(lane)} label={lane} />
                        </Stack>
                      </Stack>
                      <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
                        {lastSeen ? <Chip size="small" variant="outlined" label={formatDateTime(lastSeen)} /> : null}
                        {row.message_count !== undefined ? <Chip size="small" variant="outlined" label={`${row.message_count} tin`} /> : null}
                        <Chip size="small" color={lane === "observed" ? "success" : lane === "moderated" ? "warning" : "info"} variant="outlined" label={`Nguồn ${lane}`} />
                        {String(row.bot_key || "") === "*" ? <Chip size="small" color="error" variant="filled" label="mọi bot" /> : null}
                        {String(row.chat_id || "") === "*" ? <Chip size="small" color="error" variant="outlined" label="toàn bot" /> : null}
                        {row.source === "audit" ? <Chip size="small" color="info" variant="outlined" label="audit seed" /> : null}
                        {reason ? <Chip size="small" color={lane === "observed" ? "success" : lane === "moderated" ? "warning" : "info"} variant="outlined" label={reason} /> : null}
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {lane !== "left" ? <MuiButton size="small" variant="outlined" onClick={(event) => { event.stopPropagation(); openMemberAction(row, "mute"); }}>Mute</MuiButton> : null}
                        {lane !== "left" ? <MuiButton size="small" variant="outlined" color="error" onClick={(event) => { event.stopPropagation(); openMemberAction(row, "ban"); }}>Ban</MuiButton> : null}
                        {lane === "moderated" && status === "muted" ? <MuiButton size="small" variant="text" onClick={(event) => { event.stopPropagation(); openMemberAction(row, "unmute"); }}>Mở chat</MuiButton> : null}
                        {lane === "moderated" && memberReleaseActionFor(row) ? <MuiButton size="small" variant="text" onClick={(event) => { event.stopPropagation(); void runMemberAction(row, memberReleaseActionFor(row)!.action); }}>{memberReleaseActionFor(row)!.label}</MuiButton> : null}
                        {lane === "left" ? <MuiButton size="small" variant="outlined" onClick={(event) => { event.stopPropagation(); openMemberDetail(row); }}>Xem case</MuiButton> : null}
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}

              {!memberOverviewLoading && !memberFilteredRows.length ? (
                <Paper variant="outlined" sx={{ p: 3, bgcolor: "background.paper", textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">Không có dữ liệu phù hợp bộ lọc hiện tại.</Typography>
                </Paper>
              ) : null}

              {!memberOverviewLoading && memberTotalPages > 1 ? (
                <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                  <Typography variant="caption" color="text.secondary">
                    Hiển thị {Math.min((memberPage - 1) * memberPageSize + 1, memberLoadedCount)}-{Math.min(memberPage * memberPageSize, memberLoadedCount)} / {memberLoadedCount}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                    <MuiButton variant="outlined" disabled={memberPage <= 1} onClick={() => setMemberPage((current) => Math.max(1, current - 1))}>Trang trước</MuiButton>
                    <MuiButton variant="outlined" disabled={!memberOverview?.pagination?.hasNextPage} onClick={() => setMemberPage((current) => Math.min(memberTotalPages, current + 1))}>Tải thêm</MuiButton>
                    <MuiButton variant="outlined" disabled={memberPage >= memberTotalPages} onClick={() => setMemberPage((current) => Math.min(memberTotalPages, current + 1))}>Trang sau</MuiButton>
                  </Stack>
                </Stack>
              ) : null}
            </Stack>
          </Paper>
        </Stack>
      </Stack>
    </Paper>
  );
}
