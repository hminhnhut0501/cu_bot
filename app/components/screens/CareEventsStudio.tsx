"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button as MuiButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Award,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  Eye,
  EyeOff,
  Flame,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Trophy,
  UserCheck,
  Users,
  Vote,
  X,
} from "lucide-react";

import Section from "@/app/components/ui/Section";
import StatCard from "@/app/components/ui/StatCard";
import type { Row } from "@/lib/cp-types";

export type CareEventsStudioProps = {
  moduleEnabled: boolean;
  saving: boolean;
  selectedScope?: string;
  selectedScopeName?: string;
  groups: Array<{ bot_key?: string; group_id?: string; chat_id?: string; id?: string | number; group_name?: string }>;
  seasons: Row[];
  idols: Row[];
  votes: Row[];
  onToggleModule: () => void;
  onCreateSeason: (draft: {
    chat_id: string;
    title: string;
    season_code: string;
    start_at: string;
    end_at: string;
    description: string;
    settings: {
      votes_per_user: number;
      max_nominations_per_user: number;
      min_member_days: number;
      allow_change_vote: boolean;
    };
  }) => Promise<void>;
  onCloseSeason: (seasonId: string, currentStatus: string) => Promise<void>;
  onTallySeason: (seasonId: string) => Promise<void>;
  onCreateIdol: (draft: {
    season_id: string;
    chat_id: string;
    name: string;
    description: string;
  }) => Promise<void>;
  onUpdateIdolStatus: (idolId: string, status: "approved" | "pending" | "hidden" | "deleted") => Promise<void>;
  onDeleteIdol: (idolId: string) => Promise<void>;
  onRefreshData?: () => void;
};

export default function CareEventsStudio({
  moduleEnabled,
  saving,
  selectedScope,
  selectedScopeName,
  groups,
  seasons,
  idols,
  votes,
  onToggleModule,
  onCreateSeason,
  onCloseSeason,
  onTallySeason,
  onCreateIdol,
  onUpdateIdolStatus,
  onDeleteIdol,
  onRefreshData,
}: CareEventsStudioProps) {
  // Tab state: "idols" | "votes" | "seasons"
  const [activeTab, setActiveTab] = useState<"idols" | "votes" | "seasons">("idols");
  const [candidateFilter, setCandidateFilter] = useState<"all" | "approved" | "pending">("all");

  // Create Season Dialog State
  const [createSeasonOpen, setCreateSeasonOpen] = useState(false);
  const now = new Date();
  const defaultSeasonCode = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const defaultEndDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)).toISOString().slice(0, 10);

  const [seasonTargetChatId, setSeasonTargetChatId] = useState(selectedScope || "");
  const [seasonTitle, setSeasonTitle] = useState(`Bình chọn Idol Tháng ${now.getMonth() + 1}/${now.getFullYear()}`);
  const [seasonCode, setSeasonCode] = useState(defaultSeasonCode);
  const [seasonEndDate, setSeasonEndDate] = useState(defaultEndDate);
  const [seasonDescription, setSeasonDescription] = useState("Sự kiện bình chọn thần tượng hàng tháng cho thành viên group care.");
  const [votesPerUser, setVotesPerUser] = useState(1);
  const [maxNominations, setMaxNominations] = useState(3);
  const [minMemberDays, setMinMemberDays] = useState(0);
  const [allowChangeVote, setAllowChangeVote] = useState(true);

  // Create Idol Dialog State
  const [createIdolOpen, setCreateIdolOpen] = useState(false);
  const [newIdolName, setNewIdolName] = useState("");
  const [newIdolDesc, setNewIdolDesc] = useState("");

  // Filter seasons by current selected scope (group)
  const scopedSeasons = useMemo(() => {
    if (!selectedScope) return seasons;
    return seasons.filter((s) => String(s.chat_id || "") === String(selectedScope));
  }, [seasons, selectedScope]);

  // Current active season (prefer latest "open", then latest)
  const activeSeason = useMemo(() => {
    const openSeasons = scopedSeasons.filter((s) => s.status === "open" && s.enabled !== false);
    if (openSeasons.length > 0) {
      return [...openSeasons].sort((a, b) => Number(b.id || 0) - Number(a.id || 0))[0];
    }
    return scopedSeasons.length > 0 ? scopedSeasons[0] : null;
  }, [scopedSeasons]);

  const activeSeasonId = activeSeason ? String(activeSeason.id || "") : "";

  // Idols for the active season
  const seasonIdols = useMemo(() => {
    if (!activeSeasonId) return [];
    const list = idols.filter((i) => String(i.season_id || "") === activeSeasonId && i.status !== "deleted");
    return [...list].sort((a, b) => Number(b.vote_count || 0) - Number(a.vote_count || 0));
  }, [idols, activeSeasonId]);

  // Filtered candidate list
  const filteredIdols = useMemo(() => {
    if (candidateFilter === "approved") {
      return seasonIdols.filter((i) => i.status === "approved" || i.status === "active");
    }
    if (candidateFilter === "pending") {
      return seasonIdols.filter((i) => i.status === "pending" || i.status === "hidden");
    }
    return seasonIdols;
  }, [seasonIdols, candidateFilter]);

  // Votes for the active season
  const seasonVotes = useMemo(() => {
    if (!activeSeasonId) return [];
    const list = votes.filter((v) => String(v.season_id || "") === activeSeasonId);
    return [...list].sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  }, [votes, activeSeasonId]);

  // Compute metrics
  const totalVotesCount = useMemo(() => {
    return seasonIdols.reduce((sum, idol) => sum + Number(idol.vote_count || 0), 0);
  }, [seasonIdols]);

  const top1Idol = seasonIdols.length > 0 ? seasonIdols[0] : null;
  const top1Votes = top1Idol ? Number(top1Idol.vote_count || 0) : 0;
  const top1Pct = totalVotesCount > 0 && top1Votes > 0 ? Math.round((top1Votes * 100) / totalVotesCount) : 0;

  // Days left
  const daysRemainingText = useMemo(() => {
    if (!activeSeason?.end_at && !activeSeason?.end_date) return "Vô thời hạn";
    const endStr = String(activeSeason.end_at || activeSeason.end_date);
    try {
      const diff = new Date(endStr).getTime() - Date.now();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days > 0 ? `Còn ${days} ngày` : "Đã hết hạn";
    } catch {
      return endStr;
    }
  }, [activeSeason]);

  // Handle Create Season Submit
  const handleCreateSeasonSubmit = async () => {
    const targetChat = seasonTargetChatId || selectedScope;
    if (!targetChat) return;
    const startAt = new Date().toISOString();
    const endAt = new Date(`${seasonEndDate}T23:59:59Z`).toISOString();
    await onCreateSeason({
      chat_id: targetChat,
      title: seasonTitle.trim() || `Bình chọn Idol ${seasonCode}`,
      season_code: seasonCode.trim(),
      start_at: startAt,
      end_at: endAt,
      description: seasonDescription.trim(),
      settings: {
        votes_per_user: votesPerUser,
        max_nominations_per_user: maxNominations,
        min_member_days: minMemberDays,
        allow_change_vote: allowChangeVote,
      },
    });
    setCreateSeasonOpen(false);
  };

  // Handle Create Idol Submit
  const handleCreateIdolSubmit = async () => {
    if (!activeSeasonId || !newIdolName.trim()) return;
    await onCreateIdol({
      season_id: activeSeasonId,
      chat_id: String(activeSeason?.chat_id || selectedScope || ""),
      name: newIdolName.trim(),
      description: newIdolDesc.trim(),
    });
    setNewIdolName("");
    setNewIdolDesc("");
    setCreateIdolOpen(false);
  };

  return (
    <Section
      eyebrow="Cộng đồng & Thành viên"
      title="Group Care & Bình Chọn Idol"
      subtitle="Quản lý các mùa giải bình chọn Idol, kiểm soát gian lận, danh sách đề cử và vinh danh tự động."
      tone="fun"
      actions={
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          {onRefreshData ? (
            <Tooltip title="Làm mới dữ liệu">
              <IconButton size="small" onClick={onRefreshData} disabled={saving}>
                <RefreshCw size={18} />
              </IconButton>
            </Tooltip>
          ) : null}
          <Chip
            size="small"
            color={moduleEnabled ? "success" : "default"}
            label={moduleEnabled ? "Module Đang Bật" : "Module Đang Tắt"}
            sx={{ fontWeight: 600 }}
          />
        </Stack>
      }
    >
      <Stack spacing={2.5}>
        {/* Module Switch & Scope Banner */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            bgcolor: "background.default",
            backgroundImage: "linear-gradient(135deg, rgba(236, 72, 153, 0.04), transparent 60%)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                Kích hoạt Module Bình chọn Idol Care
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedScope ? (
                  <>
                    Đang quản lý nhóm: <b>{selectedScopeName || selectedScope}</b> (Chat ID: <code>{selectedScope}</code>)
                  </>
                ) : (
                  "💡 Chọn một Group cụ thể trên Topbar để lọc đúng các mùa giải của group đó."
                )}
              </Typography>
            </Box>
            <Switch checked={moduleEnabled} onChange={onToggleModule} disabled={saving} color="primary" />
          </Box>
        </Paper>

        {/* 4 Stat Overview Cards */}
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" } }}>
          <StatCard
            label="Mùa giải hiện tại"
            value={activeSeason?.title || "Chưa có mùa mở"}
            hint={activeSeason ? `${daysRemainingText} · Mã: ${activeSeason.season_code || "-"}` : "Bấm nút dưới để tạo mùa mới"}
            icon={<Calendar size={20} />}
            tone="primary"
          />
          <StatCard
            label="Tổng ứng viên Idol"
            value={`${seasonIdols.length} Ứng viên`}
            hint={`${seasonIdols.filter((i) => i.status === "approved").length} đã duyệt · ${seasonIdols.filter((i) => i.status === "pending").length} chờ duyệt`}
            icon={<Users size={20} />}
            tone="info"
          />
          <StatCard
            label="Tổng phiếu bầu"
            value={`${totalVotesCount} Phiếu`}
            hint={`Ghi nhận từ ${seasonVotes.length} cử tri hợp lệ`}
            icon={<Vote size={20} />}
            tone="fun"
          />
          <StatCard
            label="Quán quân dẫn đầu (Top 1)"
            value={top1Idol ? String(top1Idol.name) : "Chưa có vote"}
            hint={top1Idol ? `${top1Votes} phiếu (${top1Pct}% tổng lượt bầu)` : "Đang chờ thành viên bỏ phiếu"}
            icon={<Crown size={20} />}
            tone="warning"
          />
        </Box>

        {/* Season Controller Card */}
        <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Trophy size={20} color="#d97706" />
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {activeSeason ? String(activeSeason.title) : "Chưa có mùa giải nào"}
                </Typography>
                {activeSeason ? (
                  <Chip
                    size="small"
                    color={activeSeason.status === "open" ? "success" : activeSeason.status === "tallied" ? "primary" : "default"}
                    label={activeSeason.status === "open" ? "Đang Mở Bình Chọn" : activeSeason.status === "tallied" ? "Đã Chốt & Vinh Danh" : "Đã Đóng"}
                    sx={{ fontWeight: 700 }}
                  />
                ) : null}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {activeSeason?.description || "Chiến dịch bình chọn thần tượng tự động hàng tháng."}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <MuiButton
                variant="contained"
                startIcon={<Plus size={16} />}
                onClick={() => setCreateSeasonOpen(true)}
                disabled={saving}
                sx={{ fontWeight: 700 }}
              >
                Tạo Mùa Giải Mới
              </MuiButton>

              {activeSeason ? (
                <>
                  <MuiButton
                    variant="outlined"
                    color="secondary"
                    startIcon={<Award size={16} />}
                    onClick={() => onTallySeason(String(activeSeason.id))}
                    disabled={saving || activeSeason.status === "tallied"}
                  >
                    Chốt Sổ & Vinh Danh
                  </MuiButton>
                  <MuiButton
                    variant="outlined"
                    color={activeSeason.status === "open" ? "warning" : "success"}
                    onClick={() => onCloseSeason(String(activeSeason.id), String(activeSeason.status || "open"))}
                    disabled={saving}
                  >
                    {activeSeason.status === "open" ? "Đóng Mùa Giải" : "Mở Lại Bình Chọn"}
                  </MuiButton>
                </>
              ) : null}
            </Stack>
          </Box>
        </Paper>

        {/* Content Navigation Tabs: Idols / Votes / All Seasons */}
        <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }}>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                sx={{
                  minHeight: 38,
                  "& .MuiTab-root": { minHeight: 38, py: 0.75, fontWeight: 700, textTransform: "none" },
                }}
              >
                <Tab label={`Ứng Viên Idol (${seasonIdols.length})`} value="idols" />
                <Tab label={`Nhật Ký Phiếu Bầu (${seasonVotes.length})`} value="votes" />
                <Tab label={`Lịch Sử Các Mùa (${scopedSeasons.length})`} value="seasons" />
              </Tabs>

              {activeTab === "idols" ? (
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Select
                    size="small"
                    value={candidateFilter}
                    onChange={(e) => setCandidateFilter(e.target.value as any)}
                    sx={{ minWidth: 140, height: 36, fontSize: "0.875rem" }}
                  >
                    <MenuItem value="all">Tất cả đề cử</MenuItem>
                    <MenuItem value="approved">Đã duyệt (Active)</MenuItem>
                    <MenuItem value="pending">Chờ duyệt / Ẩn</MenuItem>
                  </Select>
                  <MuiButton
                    variant="outlined"
                    size="small"
                    startIcon={<Plus size={15} />}
                    onClick={() => setCreateIdolOpen(true)}
                    disabled={!activeSeason || saving}
                    sx={{ fontWeight: 700, height: 36 }}
                  >
                    Thêm Idol
                  </MuiButton>
                </Stack>
              ) : null}
            </Box>

            <Divider />

            {/* TAB 1: IDOLS CANDIDATES LIST */}
            {activeTab === "idols" ? (
              <Stack spacing={1.5}>
                {filteredIdols.length === 0 ? (
                  <Alert severity="info" sx={{ alignItems: "center" }}>
                    Chưa có ứng viên nào trong mùa giải này. Thành viên có thể dùng lệnh <code>/dexuat Tên Idol | Lý do</code> trong nhóm Telegram hoặc bạn có thể bấm &quot;Thêm Idol&quot; ở trên.
                  </Alert>
                ) : (
                  filteredIdols.map((idol, index) => {
                    const votesCount = Number(idol.vote_count || 0);
                    const pct = totalVotesCount > 0 ? Math.round((votesCount * 100) / totalVotesCount) : 0;
                    const isWinner = index === 0 && votesCount > 0;
                    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;

                    return (
                      <Paper
                        key={String(idol.id)}
                        variant="outlined"
                        sx={{
                          p: 1.75,
                          bgcolor: isWinner ? "rgba(245, 158, 11, 0.03)" : "background.default",
                          borderColor: isWinner ? "warning.main" : "divider",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Stack spacing={1.25}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1.5 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
                              <Typography variant="h6" sx={{ minWidth: 32, textAlign: "center", fontSize: "1.3rem" }}>
                                {medal}
                              </Typography>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                  {String(idol.name)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Đề cử bởi: <b>{String(idol.nominated_by_name || idol.nominated_by_id || "Admin")}</b> · ID: <code>{String(idol.id)}</code>
                                </Typography>
                              </Box>
                            </Box>

                            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                              <Chip
                                size="small"
                                color={idol.status === "approved" || idol.status === "active" ? "success" : idol.status === "pending" ? "warning" : "default"}
                                label={idol.status === "approved" || idol.status === "active" ? "Đã duyệt" : idol.status === "pending" ? "Chờ duyệt" : "Đã ẩn"}
                                sx={{ fontWeight: 600 }}
                              />
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, minWidth: 70, textAlign: "right" }}>
                                {votesCount} phiếu ({pct}%)
                              </Typography>
                            </Stack>
                          </Box>

                          {/* Progress bar */}
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: "divider",
                              "& .MuiLinearProgress-bar": {
                                bgcolor: isWinner ? "#d97706" : index === 1 ? "#0284c7" : index === 2 ? "#e11d48" : "primary.main",
                              },
                            }}
                          />

                          {idol.description ? (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                              &ldquo;{String(idol.description)}&rdquo;
                            </Typography>
                          ) : null}

                          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                            {idol.status !== "approved" && idol.status !== "active" ? (
                              <MuiButton
                                size="small"
                                variant="outlined"
                                color="success"
                                startIcon={<Check size={14} />}
                                onClick={() => onUpdateIdolStatus(String(idol.id), "approved")}
                                disabled={saving}
                              >
                                Duyệt
                              </MuiButton>
                            ) : (
                              <MuiButton
                                size="small"
                                variant="outlined"
                                color="warning"
                                startIcon={<EyeOff size={14} />}
                                onClick={() => onUpdateIdolStatus(String(idol.id), "hidden")}
                                disabled={saving}
                              >
                                Ẩn
                              </MuiButton>
                            )}

                            <MuiButton
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<Trash2 size={14} />}
                              onClick={() => onDeleteIdol(String(idol.id))}
                              disabled={saving}
                            >
                              Xóa
                            </MuiButton>
                          </Box>
                        </Stack>
                      </Paper>
                    );
                  })
                )}
              </Stack>
            ) : null}

            {/* TAB 2: VOTES AUDIT LOG */}
            {activeTab === "votes" ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: "background.default" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Cử tri (User Name)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>User ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Idol Được Bầu</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Thời Gian</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {seasonVotes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>
                          Chưa có lượt vote nào trong mùa giải này.
                        </TableCell>
                      </TableRow>
                    ) : (
                      seasonVotes.map((v) => {
                        const targetIdol = seasonIdols.find((i) => String(i.id) === String(v.idol_id));
                        return (
                          <TableRow key={String(v.id)}>
                            <TableCell>#{String(v.id)}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{String(v.user_name || "Ẩn danh")}</TableCell>
                            <TableCell><code>{String(v.user_id || "-")}</code></TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={targetIdol?.name || `Idol #${v.idol_id}`}
                                color="primary"
                                variant="outlined"
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: "text.secondary" }}>
                              {String(v.voted_at || v.created_at || "-")}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : null}

            {/* TAB 3: SEASONS HISTORY */}
            {activeTab === "seasons" ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: "background.default" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tiêu Đề</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Group (Chat ID)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Mã Tháng</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Hạn Chốt</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Trạng Thái</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Quán Quân</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scopedSeasons.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3, color: "text.secondary" }}>
                          Chưa có mùa giải nào được lưu.
                        </TableCell>
                      </TableRow>
                    ) : (
                      scopedSeasons.map((s) => (
                        <TableRow key={String(s.id)}>
                          <TableCell>#{String(s.id)}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{String(s.title || "-")}</TableCell>
                          <TableCell><code>{String(s.chat_id || "-")}</code></TableCell>
                          <TableCell>{String(s.season_code || "-")}</TableCell>
                          <TableCell>{String(s.end_at || s.end_date || "-")}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              color={s.status === "open" ? "success" : s.status === "tallied" ? "primary" : "default"}
                              label={s.status === "open" ? "Đang mở" : s.status === "tallied" ? "Đã vinh danh" : "Đã đóng"}
                            />
                          </TableCell>
                          <TableCell>
                            {s.winner_name ? (
                              <Typography variant="body2" sx={{ fontWeight: 700, color: "warning.main" }}>
                                👑 {String(s.winner_name)} ({String(s.winner_votes || 0)} phiếu)
                              </Typography>
                            ) : (
                              <Typography variant="caption" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : null}
          </Stack>
        </Paper>
      </Stack>

      {/* DIALOG: CREATE NEW SEASON */}
      <Dialog open={createSeasonOpen} onClose={() => setCreateSeasonOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Tạo Mùa Giải Bình Chọn Mới</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Group áp dụng</InputLabel>
              <Select
                value={seasonTargetChatId}
                label="Group áp dụng"
                onChange={(e) => setSeasonTargetChatId(e.target.value)}
              >
                {groups.map((g) => (
                  <MenuItem key={String(g.chat_id || g.group_id)} value={String(g.chat_id || g.group_id)}>
                    {String(g.group_name || g.chat_id || g.group_id)} ({String(g.chat_id || g.group_id)})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Tiêu đề mùa giải"
              value={seasonTitle}
              onChange={(e) => setSeasonTitle(e.target.value)}
              placeholder="VD: Bình chọn Idol Tháng 11/2026"
              fullWidth
            />

            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "1fr 1fr" }}>
              <TextField
                size="small"
                label="Mã mùa (YYYY-MM)"
                value={seasonCode}
                onChange={(e) => setSeasonCode(e.target.value)}
                placeholder="2026-11"
              />
              <TextField
                size="small"
                type="date"
                label="Ngày kết thúc"
                value={seasonEndDate}
                onChange={(e) => setSeasonEndDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>

            <TextField
              size="small"
              label="Mô tả sự kiện"
              value={seasonDescription}
              onChange={(e) => setSeasonDescription(e.target.value)}
              multiline
              rows={2}
              fullWidth
            />

            <Divider />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              🛡️ Cài đặt chống gian lận & Quy tắc
            </Typography>

            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "1fr 1fr" }}>
              <TextField
                size="small"
                type="number"
                label="Số phiếu mỗi thành viên"
                value={votesPerUser}
                onChange={(e) => setVotesPerUser(Number(e.target.value) || 1)}
                slotProps={{ htmlInput: { min: 1, max: 10 } }}
              />
              <TextField
                size="small"
                type="number"
                label="Giới hạn đề cử / thành viên"
                value={maxNominations}
                onChange={(e) => setMaxNominations(Number(e.target.value) || 1)}
                slotProps={{ htmlInput: { min: 1, max: 20 } }}
              />
            </Box>

            <TextField
              size="small"
              type="number"
              label="Yêu cầu số ngày vào nhóm tối thiểu (chống clone mới tạo)"
              value={minMemberDays}
              onChange={(e) => setMinMemberDays(Number(e.target.value) || 0)}
              helperText="Nhập 0 nếu không yêu cầu, hoặc 1-7 ngày để chống acc clone vào dồn vote."
            />

            <FormControlLabel
              control={<Switch checked={allowChangeVote} onChange={(e) => setAllowChangeVote(e.target.checked)} />}
              label="Cho phép thành viên đổi phiếu bình chọn sang Idol khác"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={() => setCreateSeasonOpen(false)}>Hủy</MuiButton>
          <MuiButton variant="contained" onClick={handleCreateSeasonSubmit} disabled={saving || !seasonTargetChatId}>
            Khởi Tạo Mùa Giải
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* DIALOG: CREATE IDOL */}
      <Dialog open={createIdolOpen} onClose={() => setCreateIdolOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Đề Xuất Idol Mới</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              size="small"
              label="Tên Idol"
              value={newIdolName}
              onChange={(e) => setNewIdolName(e.target.value)}
              placeholder="VD: Sơn Tùng M-TP"
              fullWidth
              autoFocus
            />
            <TextField
              size="small"
              label="Mô tả / Profile ngắn"
              value={newIdolDesc}
              onChange={(e) => setNewIdolDesc(e.target.value)}
              placeholder="Lý do đề cử hoặc thành tích nổi bật"
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={() => setCreateIdolOpen(false)}>Hủy</MuiButton>
          <MuiButton variant="contained" onClick={handleCreateIdolSubmit} disabled={saving || !newIdolName.trim()}>
            Thêm Vào Mùa Giải
          </MuiButton>
        </DialogActions>
      </Dialog>
    </Section>
  );
}
