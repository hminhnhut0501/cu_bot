"use client";

import type { FormEvent } from "react";
import {
  Alert,
  Button as MuiButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import type { MemberActionDraft, MemberActionType } from "@/lib/cp-types";

export type MemberActionDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  memberActionDraft: MemberActionDraft;
  setMemberActionDraft: React.Dispatch<React.SetStateAction<MemberActionDraft>>;
  memberActionFeedback: { type: "success" | "error"; message: string } | null;
  saving: boolean;
  effectiveMemberChatId: string | null;
  systemBlacklistActive: boolean;
};

const memberActionLabel: Record<MemberActionType, string> = {
  mute: "Cấm chat",
  unmute: "Mở chat",
  ban: "Ban khỏi nhóm",
  unban: "Gỡ ban",
  blacklist: "Thêm blacklist hệ thống",
  unblacklist: "Gỡ blacklist hệ thống",
  kick: "Kick khỏi nhóm",
};

export default function MemberActionDialog({
  open,
  onClose,
  onSubmit,
  memberActionDraft,
  setMemberActionDraft,
  memberActionFeedback,
  saving,
  effectiveMemberChatId,
  systemBlacklistActive,
}: MemberActionDialogProps) {
  const isBlacklistAction = memberActionDraft.action === "blacklist" || memberActionDraft.action === "unblacklist";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Thao tác thành viên</DialogTitle>
      <form onSubmit={onSubmit}>
        <DialogContent dividers>
          <Stack spacing={2}>
            {memberActionFeedback ? (
              <Alert severity={memberActionFeedback.type}>{memberActionFeedback.message}</Alert>
            ) : null}
            <Alert severity="warning">Blacklist sẽ được lưu ngay cả khi Telegram xử lý chậm.</Alert>
            <TextField
              label="Telegram user_id"
              value={memberActionDraft.user_id}
              onChange={(event) => setMemberActionDraft((current) => ({ ...current, user_id: event.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Username"
              value={memberActionDraft.username}
              onChange={(event) => setMemberActionDraft((current) => ({ ...current, username: event.target.value.replace(/^@/, "") }))}
              fullWidth
              placeholder="username"
            />
            <TextField
              label="Tên hiển thị"
              value={memberActionDraft.display_name}
              onChange={(event) => setMemberActionDraft((current) => ({ ...current, display_name: event.target.value }))}
              fullWidth
            />
            {!isBlacklistAction ? (
              <>
                <TextField
                  label="Action"
                  select
                  value={memberActionDraft.action}
                  onChange={(event) => setMemberActionDraft((current) => ({ ...current, action: event.target.value as MemberActionType }))}
                  fullWidth
                >
                  <MenuItem value="mute">Cấm chat</MenuItem>
                  <MenuItem value="unmute">Mở chat</MenuItem>
                  <MenuItem value="ban">Ban</MenuItem>
                  <MenuItem value="unban">Gỡ ban</MenuItem>
                  <MenuItem value="kick">Kick</MenuItem>
                  {systemBlacklistActive ? <MenuItem value="blacklist">Thêm blacklist</MenuItem> : null}
                  {systemBlacklistActive ? <MenuItem value="unblacklist">Gỡ blacklist</MenuItem> : null}
                </TextField>
                <TextField
                  label="Thời lượng mute (giây)"
                  type="number"
                  value={memberActionDraft.duration_seconds}
                  onChange={(event) => setMemberActionDraft((current) => ({ ...current, duration_seconds: Number(event.target.value) }))}
                  fullWidth
                />
              </>
            ) : null}
            {!isBlacklistAction ? (
              <TextField
                label="Lý do"
                value={memberActionDraft.reason}
                onChange={(event) => setMemberActionDraft((current) => ({ ...current, reason: event.target.value }))}
                fullWidth
                multiline
                minRows={2}
              />
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={onClose}>Hủy</MuiButton>
          <MuiButton type="submit" variant="contained" disabled={saving || !effectiveMemberChatId}>
            {saving ? "Đang xử lý..." : memberActionLabel[memberActionDraft.action]}
          </MuiButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
