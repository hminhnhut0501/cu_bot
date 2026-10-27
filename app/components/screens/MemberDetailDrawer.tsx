"use client";

import type { ReactNode } from "react";
import {
  Alert,
  Box,
  Button as MuiButton,
  Chip,
  CircularProgress,
  Drawer,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { MemberOverview, Row } from "@/lib/cp-types";
import { formatDateTime } from "@/lib/cp-helpers";

export type MemberDetailDrawerProps = {
  open: boolean;
  onClose: () => void;
  memberSelectedRow: Row | null;
  memberDetail: {
    scope?: { botKey?: string; groupId?: string; userId?: string };
    member?: Row | null;
    stats?: { joinCount?: number; leaveCount?: number; actionCount?: number; lastActionAt?: string };
    timeline?: Array<{ type?: string; at: string; actor?: string; reason?: string; source?: string; label?: string; tone?: string }>;
    notes?: Array<{ id?: string; text?: string; created_at?: string; created_by?: string; source?: string }>;
  } | null;
  memberOverview: MemberOverview | null;
  memberActionTrace: {
    at: string;
    action: string;
    request: Record<string, unknown>;
    response: Record<string, unknown>;
    ok: boolean;
    scopeSummary?: string;
  } | null;
  memberNoteDraft: string;
  setMemberNoteDraft: (value: string) => void;
  saveMemberNote: () => Promise<void>;
  memberNoteSaving: boolean;
  openMemberAction: (row: Row, action: "mute" | "ban" | "unmute" | "unban" | "blacklist" | "unblacklist") => void;
  runMemberAction: (row: Row, action: "unban" | "unblacklist") => Promise<void>;
  memberTimelineFilter: "all" | "moderation" | "activity" | "audit";
  setMemberTimelineFilter: (value: "all" | "moderation" | "activity" | "audit") => void;
  memberDetailLoading: boolean;
  memberDetailTimeline: Array<{ type?: string; at: string; actor?: string; reason?: string; source?: string; label?: string; tone?: string }>;
  timelineToneForType: (type?: string, source?: string) => "error" | "warning" | "info" | "success" | "secondary";
  timelineToneForSource: (source?: string) => any;
  timelineIconForType: (type?: string, source?: string) => ReactNode;
  memberStatusOf: (row: any) => string;
  memberDisplayName: (row: any) => string;
  memberUsername: (row: any) => string;
  memberUserId: (row: any) => string;
  memberStatusLabel: (status: string) => string;
  memberLaneTone: (lane: any) => any;
  memberLaneOfRow: (row: Row) => "observed" | "moderated" | "left";
  memberSourceOf: (row: any) => string;
  memberLastSeen: (row: any) => string;
  memberReasonOf: (row: any) => string;
  memberLaneDescription: (lane: any) => string;
};

export default function MemberDetailDrawer({
  open,
  onClose,
  memberSelectedRow,
  memberDetail,
  memberOverview,
  memberActionTrace,
  memberNoteDraft,
  setMemberNoteDraft,
  saveMemberNote,
  memberNoteSaving,
  openMemberAction,
  runMemberAction,
  memberTimelineFilter,
  setMemberTimelineFilter,
  memberDetailLoading,
  memberDetailTimeline,
  timelineToneForType,
  timelineToneForSource,
  timelineIconForType,
  memberStatusOf,
  memberDisplayName,
  memberUsername,
  memberUserId,
  memberStatusLabel,
  memberLaneTone,
  memberLaneOfRow,
  memberSourceOf,
  memberLastSeen,
  memberReasonOf,
  memberLaneDescription,
}: MemberDetailDrawerProps) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: "100%", md: 420 }, p: 2, bgcolor: "background.paper" } } }}
    >
      {memberSelectedRow ? (
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <Box>
              <Typography variant="overline" color="text.secondary">Case file</Typography>
              <Typography variant="h5">{memberDisplayName(memberSelectedRow)}</Typography>
              <Typography variant="body2" color="text.secondary">
                {memberUsername(memberSelectedRow) || "Không có username"} · ID {memberUserId(memberSelectedRow) || "-"}
              </Typography>
            </Box>
            <MuiButton size="small" onClick={onClose}>Đóng</MuiButton>
          </Stack>

          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
            <Grid container spacing={1}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Lane</Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 0.5 }}>
                    <Chip size="small" label={memberStatusLabel(memberStatusOf(memberSelectedRow))} color={memberLaneTone(memberLaneOfRow(memberSelectedRow))} />
                    <Chip size="small" variant="outlined" color={memberLaneTone(memberLaneOfRow(memberSelectedRow))} label={`Nguồn ${memberLaneOfRow(memberSelectedRow)}`} />
                    <Chip size="small" variant="outlined" label={memberSourceOf(memberSelectedRow) || "source unknown"} />
                  </Stack>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Mốc gần nhất</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {memberLastSeen(memberSelectedRow) ? formatDateTime(memberLastSeen(memberSelectedRow)) : "Chưa có mốc thời gian"}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Lý do / ghi chú</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {memberReasonOf(memberSelectedRow) || "Chưa có lý do"}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Nguồn hiển thị</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {memberDetail?.member?.source || memberOverview?.meta?.queryMode || "mixed"} · {memberOverview?.meta?.snapshotMode || "snapshot"}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
            <Typography variant="subtitle2" gutterBottom>Hành động nhanh</Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <MuiButton size="small" variant="outlined" onClick={() => openMemberAction(memberSelectedRow, "mute")}>Mute</MuiButton>
              <MuiButton size="small" variant="outlined" color="error" onClick={() => openMemberAction(memberSelectedRow, "ban")}>Ban</MuiButton>
              {memberStatusOf(memberSelectedRow) === "muted" ? <MuiButton size="small" variant="text" onClick={() => openMemberAction(memberSelectedRow, "unmute")}>Mở chat</MuiButton> : null}
              {memberStatusOf(memberSelectedRow) === "banned" ? <MuiButton size="small" variant="text" onClick={() => void runMemberAction(memberSelectedRow, "unban")}>Gỡ ban</MuiButton> : null}
              {memberStatusOf(memberSelectedRow) === "blacklisted" ? <MuiButton size="small" variant="text" onClick={() => void runMemberAction(memberSelectedRow, "unblacklist")}>Gỡ blacklist</MuiButton> : null}
            </Stack>
          </Paper>

          {memberActionTrace ? (
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
              <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="subtitle2">Action trace</Typography>
                <Chip size="small" color={memberActionTrace.ok ? "success" : "error"} label={memberActionTrace.ok ? "ok" : "error"} />
              </Stack>
              <Stack spacing={1}>
                <Alert severity={memberActionTrace.ok ? "success" : "error"}>
                  {memberActionTrace.action} · {memberActionTrace.at ? formatDateTime(memberActionTrace.at) : "-"}
                </Alert>
                <Paper variant="outlined" sx={{ p: 1, bgcolor: "background.paper" }}>
                  <Typography variant="caption" color="text.secondary">Request</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "monospace" }}>
                    {JSON.stringify(memberActionTrace.request, null, 2)}
                  </Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 1, bgcolor: "background.paper" }}>
                  <Typography variant="caption" color="text.secondary">Response</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "monospace" }}>
                    {JSON.stringify(memberActionTrace.response, null, 2)}
                  </Typography>
                </Paper>
                {memberActionTrace.scopeSummary ? (
                  <Alert severity="info">
                    {memberActionTrace.scopeSummary}
                  </Alert>
                ) : null}
              </Stack>
            </Paper>
          ) : null}

          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
            <Typography variant="subtitle2" gutterBottom>Notes</Typography>
            <Stack spacing={1}>
              {(memberDetail?.notes || []).slice(0, 5).map((note, index) => (
                <Paper key={String(note.id || `${note.created_at}-${index}`)} variant="outlined" sx={{ p: 1.25, bgcolor: "background.paper" }}>
                  <Typography variant="body2">{note.text}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {note.created_at ? formatDateTime(note.created_at) : "-"}{note.created_by ? ` · ${note.created_by}` : ""}{note.source ? ` · ${note.source}` : ""}
                  </Typography>
                </Paper>
              ))}
              {!memberDetail?.notes?.length ? (
                <Typography variant="body2" color="text.secondary">Chưa có notes từ audit metadata hoặc state payload.</Typography>
              ) : null}
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
            <Typography variant="subtitle2" gutterBottom>Ghi chú thủ công</Typography>
            <Stack spacing={1.25}>
              <TextField
                multiline
                minRows={3}
                placeholder="Ghi chú nội bộ cho case này..."
                value={memberNoteDraft}
                onChange={(event) => setMemberNoteDraft(event.target.value)}
              />
              <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  Ghi chú sẽ được lưu vào state payload và audit log.
                </Typography>
                <MuiButton size="small" variant="contained" disabled={memberNoteSaving || !memberNoteDraft.trim()} onClick={() => void saveMemberNote()}>
                  {memberNoteSaving ? "Đang lưu..." : "Lưu note"}
                </MuiButton>
              </Stack>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography variant="subtitle2">Timeline điều tra</Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <Chip size="small" color={memberLaneTone(memberLaneOfRow(memberSelectedRow))} label={`${memberDetail?.stats?.actionCount || 0} sự kiện`} />
                <Chip size="small" variant="outlined" color={memberLaneTone(memberLaneOfRow(memberSelectedRow))} label={memberLaneDescription(memberLaneOfRow(memberSelectedRow))} />
                <TextField
                  select
                  size="small"
                  value={memberTimelineFilter}
                  onChange={(event) => setMemberTimelineFilter(event.target.value as typeof memberTimelineFilter)}
                  sx={{ minWidth: 130 }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="moderation">Moderation</MenuItem>
                  <MenuItem value="activity">Activity</MenuItem>
                  <MenuItem value="audit">Audit</MenuItem>
                </TextField>
              </Stack>
            </Stack>
            {memberDetailLoading ? (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper", textAlign: "center" }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Đang tải timeline...</Typography>
              </Paper>
            ) : (
              <Stack spacing={1}>
                {memberDetailTimeline.slice(0, 10).map((item, index) => (
                  <Paper
                    key={`${item.at}-${item.type}-${index}`}
                    variant="outlined"
                    sx={{
                      p: 1.25,
                      bgcolor: index === 0 ? "rgba(13, 148, 136, 0.04)" : "background.paper",
                      borderLeft: "4px solid",
                      borderColor: item.source === "activity" ? "success.main" : item.source === "audit" ? "info.main" : timelineToneForType(item.type, item.source) === "error" ? "error.main" : "warning.main",
                    }}
                  >
                    <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                          <Box
                            sx={{
                              width: 30,
                              height: 30,
                              borderRadius: "50%",
                              display: "grid",
                              placeItems: "center",
                              bgcolor: item.source === "activity" ? "rgba(34, 197, 94, 0.14)" : timelineToneForType(item.type, item.source) === "error" ? "rgba(239, 68, 68, 0.14)" : timelineToneForType(item.type, item.source) === "info" ? "rgba(59, 130, 246, 0.14)" : timelineToneForType(item.type, item.source) === "success" ? "rgba(34, 197, 94, 0.14)" : timelineToneForType(item.type, item.source) === "secondary" ? "rgba(139, 92, 246, 0.14)" : "rgba(234, 179, 8, 0.14)",
                              color: timelineToneForType(item.type, item.source) === "error" ? "error.main" : timelineToneForType(item.type, item.source) === "info" ? "info.main" : timelineToneForType(item.type, item.source) === "success" ? "success.main" : timelineToneForType(item.type, item.source) === "secondary" ? "secondary.main" : item.source === "activity" ? "success.main" : "warning.main",
                            }}
                          >
                            {timelineIconForType(item.type, item.source)}
                          </Box>
                          <Chip size="small" color={memberLaneTone(memberLaneOfRow(memberSelectedRow))} label={String(item.type || item.source || "unknown").toUpperCase()} />
                          <Chip size="small" variant="outlined" color={timelineToneForSource(item.source)} label={String(item.source || "UNKNOWN").toUpperCase()} />
                          <Chip size="small" variant="outlined" color={memberLaneTone(memberLaneOfRow(memberSelectedRow))} label={memberLaneOfRow(memberSelectedRow)} />
                          <Typography variant="subtitle2">{item.reason || "Sự kiện"}</Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {item.at ? formatDateTime(item.at) : "-"} · {item.source || "source"}
                        </Typography>
                      </Box>
                      {index === 0 ? <Chip size="small" variant="outlined" label="latest" /> : <Typography variant="caption" color="text.secondary">#{index + 1}</Typography>}
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 1 }}>
                      {item.actor ? <Chip size="small" variant="outlined" label={`actor: ${item.actor}`} /> : null}
                    </Stack>
                  </Paper>
                ))}
                {!memberDetailTimeline.length ? (
                  <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.paper" }}>
                    <Typography variant="body2" color="text.secondary">Chưa có sự kiện riêng cho user này.</Typography>
                  </Paper>
                ) : null}
              </Stack>
            )}
          </Paper>
        </Stack>
      ) : null}
    </Drawer>
  );
}
