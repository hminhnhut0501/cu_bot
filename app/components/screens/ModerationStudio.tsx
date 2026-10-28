"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  Box,
  Button as MuiButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AlertTriangle,
  Ban,
  Bot,
  CheckCircle2,
  Clock,
  Copy,
  Crown,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Forward,
  HelpCircle,
  Link2,
  MessageSquare,
  Play,
  RotateCcw,
  Save,
  Settings2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Trash2,
  UserX,
  VolumeX,
  X,
  Zap,
} from "lucide-react";

import type { Row } from "@/lib/cp-types";
import {
  configDescription,
  configDisplayValue,
  configEditorKind,
  configLabel,
  configPlaceholders,
  configSelectOptions,
  configValueCaption,
  fieldUnitHint,
  isConfigBoolean,
} from "@/lib/cp-helpers";
import TelegramPhoneSimulator from "@/app/components/ui/TelegramPhoneSimulator";
import ConfigEditor, { type ConfigEditorDraft } from "./ConfigEditor";

export type ModerationStudioProps = {
  moderationConfigRowMap: Map<string, Row>;
  saving: boolean;
  toggleConfigValue: (row: Row) => void;
  selected: Row | null;
  draft: Row;
  setDraft: (updater: any) => void;
  startEdit: (row: Row) => void;
  closeFocusedPanel: () => void;
  save: (event: FormEvent) => void;
  forwardMode: "block" | "controlled" | "allow";
  setForwardMode: (val: "block" | "controlled" | "allow") => void;
  selectedGroupName?: string;
  selectedBotKey?: string;
  onOpenTaskData: (key: string) => void;
  activeConfigSection?: { title: string; rows: Row[] };
  onUpdateSettings?: (updates: Record<string, string>) => Promise<void>;
};

export default function ModerationStudio({
  moderationConfigRowMap,
  saving,
  toggleConfigValue,
  selected,
  draft,
  setDraft,
  startEdit,
  closeFocusedPanel,
  save,
  forwardMode,
  setForwardMode,
  selectedGroupName = "Toàn hệ thống",
  selectedBotKey = "main",
  onOpenTaskData,
  activeConfigSection,
  onUpdateSettings,
}: ModerationStudioProps) {
  const [activeTab, setActiveTab] = useState<"matrix" | "sandbox" | "templates" | "advanced">("matrix");

  // Sandbox testing state
  const [testText, setTestText] = useState("Ủng hộ kênh t.me/airdrop_free_ton nhận 500 TON miễn phí!");
  const [testHasLink, setTestHasLink] = useState(true);
  const [testHasButtons, setTestHasButtons] = useState(false);
  const [testIsForwarded, setTestIsForwarded] = useState(false);
  const [testUserBio, setTestUserBio] = useState("Kiếm tiền online t.me/fast_profit");
  const [testRepeatCount, setTestRepeatCount] = useState(1);

  // Helper to get row value safely
  const getRow = (key: string): Row | undefined => moderationConfigRowMap.get(key);
  const getVal = (key: string, fallback = "") => String(getRow(key)?.value ?? fallback).trim();
  const isOn = (key: string, fallback = true) => {
    const r = getRow(key);
    if (!r) return fallback;
    return String(r.value).toLowerCase() !== "false";
  };

  // Extract core moderation settings
  const spamMax = getVal("spam_max_messages", "5");
  const spamWindow = getVal("spam_window_seconds", "5");
  const spamAction = getVal("spam_action", "mute");

  const dupEnabled = isOn("duplicate_message_enabled", true);
  const dupMax = getVal("duplicate_message_max_count", "3");
  const dupWindow = getVal("duplicate_message_window_seconds", "60");
  const dupAction = getVal("duplicate_message_action", "delete");

  const mediaMax = getVal("media_spam_max_messages", "3");
  const mediaWindow = getVal("media_spam_window_seconds", "10");
  const mediaAction = getVal("media_spam_action", "delete");

  const scanBio = isOn("scan_bio_links", true);
  const scanHiddenLink = isOn("scan_hidden_links", true);
  const hiddenLinkAction = getVal("hidden_link_action", "delete");

  const inlineKeyboardBlock = isOn("delete_inline_keyboard_messages", true);
  const inlineAction = getVal("inline_keyboard_action", "ban");

  const banAfterWarnings = getVal("ban_after_warnings", "3");
  const banSeconds = getVal("ban_seconds", "86400");

  const deleteSystemMessages = isOn("delete_system_messages", true);
  const emojiSpamEnabled = isOn("emoji_spam_enabled", true);
  const emojiMaxCount = getVal("emoji_spam_max_count", "8");
  const deleteMessagesFromBots = isOn("delete_messages_from_bots", true);
  const removeUnknownBots = isOn("remove_unknown_bots", true);
  const exemptAdmins = isOn("exempt_admins", true);

  const warningNotice = getVal("warning_text", "⚠️ {user} vui lòng không vi phạm quy định nhóm!");

  const spamRateOn = Number(spamMax) > 0 && spamAction !== "none";
  const mediaFloodOn = Number(mediaMax) > 0 && mediaAction !== "none";
  const autoBanLadderOn = Number(banAfterWarnings) > 0;

  type EditingRuleField = {
    key: string;
    label: string;
    type: "number" | "select" | "text";
    options?: { value: string; label: string }[];
    unit?: string;
    hint?: string;
  };

  type EditingRuleModalState = {
    title: string;
    desc: string;
    fields: EditingRuleField[];
    values: Record<string, string>;
  };

  const [editingRule, setEditingRule] = useState<EditingRuleModalState | null>(null);
  const [modalSaving, setModalSaving] = useState(false);

  const handleSaveModal = async () => {
    if (!editingRule) return;
    setModalSaving(true);
    try {
      if (onUpdateSettings) {
        await onUpdateSettings(editingRule.values);
      }
      setEditingRule(null);
    } finally {
      setModalSaving(false);
    }
  };

  // Action badge colors
  const actionColor = (action: string): "warning" | "info" | "secondary" | "error" | "default" => {
    switch (action.toLowerCase()) {
      case "warn":
        return "warning";
      case "delete":
        return "info";
      case "restrict":
      case "mute":
        return "secondary";
      case "kick":
      case "ban":
        return "error";
      default:
        return "default";
    }
  };

  // Sandbox evaluation engine (simulates bot decision locally with zero latency)
  const sandboxAnalysis = useMemo(() => {
    const violations: Array<{ rule: string; detail: string; action: string }> = [];

    // Check 1: Inline buttons trap
    if (testHasButtons && inlineKeyboardBlock) {
      violations.push({
        rule: "Nút bấm giả mạo (Inline Button Trap)",
        detail: "Người dùng gửi tin nhắn chứa nút inline keyboard trái phép.",
        action: inlineAction || "ban",
      });
    }

    // Check 2: Forward protection
    if (testIsForwarded && forwardMode === "block") {
      violations.push({
        rule: "Forward trái phép (Forward Block)",
        detail: "Chế độ chặn toàn bộ tin nhắn chuyển tiếp đang được bật.",
        action: "delete",
      });
    }

    // Check 3: Hidden link / Text link
    if (testHasLink && scanHiddenLink) {
      const containsTelegramLink = /t\.me\/|telegram\.me\//i.test(testText);
      violations.push({
        rule: "Link ẩn / Liên kết nhóm khác (Link Protection)",
        detail: containsTelegramLink
          ? "Phát hiện đường dẫn Telegram mời gọi sang kênh khác."
          : "Phát hiện liên kết ngoài chưa được whitelist.",
        action: hiddenLinkAction || "delete",
      });
    }

    // Check 4: Bio link
    if (scanBio && /https?:\/\/|t\.me\//i.test(testUserBio)) {
      violations.push({
        rule: "Link độc trong Bio (Bio Link Scanner)",
        detail: `Bio thành viên chứa đường dẫn không an toàn: "${testUserBio}"`,
        action: "delete",
      });
    }

    // Check 5: Duplicate flood
    if (testRepeatCount > Number(dupMax) && dupEnabled) {
      violations.push({
        rule: "Spam lặp lại nội dung (Duplicate Flood)",
        detail: `Tin nhắn gửi lặp lại ${testRepeatCount} lần (vượt ngưỡng cho phép ${dupMax} lần).`,
        action: dupAction || "delete",
      });
    }

    const isViolated = violations.length > 0;
    const severeAction = violations.some((v) => v.action === "ban")
      ? "ban"
      : violations.some((v) => v.action === "kick")
        ? "kick"
        : violations.some((v) => v.action === "mute" || v.action === "restrict")
          ? "mute"
          : violations.some((v) => v.action === "delete")
            ? "delete"
            : "warn";

    return {
      isViolated,
      violations,
      severeAction,
    };
  }, [
    testText,
    testHasLink,
    testHasButtons,
    testIsForwarded,
    testUserBio,
    testRepeatCount,
    inlineKeyboardBlock,
    inlineAction,
    forwardMode,
    scanHiddenLink,
    hiddenLinkAction,
    scanBio,
    dupMax,
    dupEnabled,
    dupAction,
  ]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* 1. Compact Action Header */}
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          bgcolor: "background.paper",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <Box sx={{ width: 34, height: 34, borderRadius: 1.5, bgcolor: "rgba(15, 118, 110, 0.1)", display: "grid", placeItems: "center", color: "primary.main" }}>
            <ShieldCheck size={18} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Kiểm duyệt tự động
          </Typography>
          <Chip
            label="Active"
            size="small"
            color="success"
            sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, borderRadius: 1 }}
          />
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Tooltip title="Quản lý danh sách từ khóa cấm">
            <MuiButton
              variant="outlined"
              size="small"
              onClick={() => onOpenTaskData("keywords")}
              startIcon={<SlidersHorizontal size={14} />}
              sx={{ textTransform: "none", borderRadius: 1.5, height: 30 }}
            >
              Từ khóa cấm
            </MuiButton>
          </Tooltip>
          <Tooltip title="Quản lý danh sách tên miền độc hại">
            <MuiButton
              variant="outlined"
              size="small"
              onClick={() => onOpenTaskData("domain_blacklist")}
              startIcon={<Link2 size={14} />}
              sx={{ textTransform: "none", borderRadius: 1.5, height: 30 }}
            >
              Blacklist Domain
            </MuiButton>
          </Tooltip>
        </Stack>
      </Paper>

      {/* 2. Navigation Pills: Clean & icon-focused */}
      <Stack direction="row" spacing={1} sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 1, flexWrap: "wrap", gap: 0.5 }}>
        <MuiButton
          variant={activeTab === "matrix" ? "contained" : "text"}
          onClick={() => setActiveTab("matrix")}
          startIcon={<Shield size={16} />}
          size="small"
          sx={{ textTransform: "none", borderRadius: 1.5, fontWeight: 700 }}
        >
          Ma trận chính sách
        </MuiButton>
        <MuiButton
          variant={activeTab === "sandbox" ? "contained" : "text"}
          onClick={() => setActiveTab("sandbox")}
          startIcon={<Zap size={16} />}
          size="small"
          sx={{ textTransform: "none", borderRadius: 1.5, fontWeight: 700 }}
        >
          Thử nghiệm luật
        </MuiButton>
        <MuiButton
          variant={activeTab === "templates" ? "contained" : "text"}
          onClick={() => setActiveTab("templates")}
          startIcon={<MessageSquare size={16} />}
          size="small"
          sx={{ textTransform: "none", borderRadius: 1.5, fontWeight: 700 }}
        >
          Mẫu cảnh báo
        </MuiButton>
        <MuiButton
          variant={activeTab === "advanced" ? "contained" : "text"}
          onClick={() => setActiveTab("advanced")}
          startIcon={<SlidersHorizontal size={16} />}
          size="small"
          sx={{ textTransform: "none", borderRadius: 1.5, fontWeight: 700 }}
        >
          Cấu hình nâng cao
        </MuiButton>
      </Stack>

      {/* 3. TAB 1: POLICY RULE MATRIX */}
      {activeTab === "matrix" && (
        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ p: 0, overflow: "hidden", borderRadius: 2 }}>
            <Box sx={{ px: 2, py: 1.25, bgcolor: "background.default", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Quy tắc kiểm duyệt thời gian thực
              </Typography>
              <Chip label="12 quy tắc" size="small" variant="outlined" sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700, borderRadius: 1 }} />
            </Box>

            <Stack divider={<Divider />}>
              {/* Rule 1: Spam Rate */}
              <RuleRow
                icon={<Clock size={18} color="#0284c7" />}
                title="Chống spam tin dồn dập"
                desc={`Tối đa ${spamMax} tin / ${spamWindow}s · Phạt: ${spamAction.toUpperCase()}`}
                conditionChip={`> ${spamMax} tin / ${spamWindow}s`}
                actionChip={spamAction}
                actionColor={actionColor(spamAction)}
                switchOn={spamRateOn}
                onToggle={() => {
                  if (onUpdateSettings) {
                    void onUpdateSettings({ spam_max_messages: spamRateOn ? "0" : "5" });
                  } else {
                    const r = getRow("spam_max_messages");
                    if (r) toggleConfigValue(r);
                  }
                }}
                onEdit={() => {
                  setEditingRule({
                    title: "Chống spam tin dồn dập",
                    desc: "Giới hạn số tin nhắn một thành viên có thể gửi trong khoảng thời gian ngắn.",
                    fields: [
                      { key: "spam_max_messages", label: "Giới hạn số tin tối đa", type: "number", unit: "tin", hint: "Đặt 0 để tắt" },
                      { key: "spam_window_seconds", label: "Cửa sổ theo dõi", type: "number", unit: "giây" },
                      { key: "spam_action", label: "Hành vi xử phạt", type: "select", options: [
                        { value: "mute", label: "Khóa chat tạm thời (Mute)" },
                        { value: "warn", label: "Cảnh báo (Warn)" },
                        { value: "delete", label: "Chỉ xóa tin (Delete)" },
                        { value: "kick", label: "Đuổi khỏi nhóm (Kick)" },
                        { value: "ban", label: "Cấm vĩnh viễn (Ban)" },
                      ]},
                      { key: "spam_restrict_seconds", label: "Thời hạn khóa chat (giây)", type: "number", unit: "giây", hint: "vd: 300 = 5p, 3600 = 1h" },
                    ],
                    values: {
                      spam_max_messages: spamMax,
                      spam_window_seconds: spamWindow,
                      spam_action: spamAction,
                      spam_restrict_seconds: getVal("spam_restrict_seconds", "300"),
                    },
                  });
                }}
                saving={saving}
              />

              {/* Rule 2: Duplicate Flood */}
              <RuleRow
                icon={<RotateCcw size={18} color="#f59e0b" />}
                title="Chống lặp nội dung & sticker"
                desc={`Lặp > ${dupMax} lần / ${dupWindow}s · Phạt: ${dupAction.toUpperCase()}`}
                conditionChip={`Lặp > ${dupMax} lần / ${dupWindow}s`}
                actionChip={dupAction}
                actionColor={actionColor(dupAction)}
                switchOn={dupEnabled}
                onToggle={() => {
                  if (onUpdateSettings) {
                    void onUpdateSettings({ duplicate_message_enabled: dupEnabled ? "false" : "true" });
                  } else {
                    const r = getRow("duplicate_message_enabled");
                    if (r) toggleConfigValue(r);
                  }
                }}
                onEdit={() => {
                  setEditingRule({
                    title: "Chống lặp nội dung & sticker",
                    desc: "Phát hiện tin nhắn hoặc sticker giống nhau lặp đi lặp lại nhiều lần.",
                    fields: [
                      { key: "duplicate_message_max_count", label: "Số lần trùng lặp tối đa", type: "number", unit: "lần" },
                      { key: "duplicate_message_window_seconds", label: "Thời gian theo dõi", type: "number", unit: "giây" },
                      { key: "duplicate_message_action", label: "Hành vi xử phạt", type: "select", options: [
                        { value: "delete", label: "Xóa tin nhắn (Delete)" },
                        { value: "warn", label: "Cảnh báo (Warn)" },
                        { value: "restrict", label: "Khóa chat (Mute)" },
                        { value: "ban", label: "Cấm khỏi nhóm (Ban)" },
                      ]},
                    ],
                    values: {
                      duplicate_message_max_count: dupMax,
                      duplicate_message_window_seconds: dupWindow,
                      duplicate_message_action: dupAction,
                    },
                  });
                }}
                saving={saving}
              />

              {/* Rule 3: Media Spam */}
              <RuleRow
                icon={<Eye size={18} color="#8b5cf6" />}
                title="Chống spam file media"
                desc={`Tối đa ${mediaMax} file / ${mediaWindow}s · Phạt: ${mediaAction.toUpperCase()}`}
                conditionChip={`> ${mediaMax} file / ${mediaWindow}s`}
                actionChip={mediaAction}
                actionColor={actionColor(mediaAction)}
                switchOn={mediaFloodOn}
                onToggle={() => {
                  if (onUpdateSettings) {
                    void onUpdateSettings({ media_spam_max_messages: mediaFloodOn ? "0" : "3" });
                  } else {
                    const r = getRow("media_spam_max_messages");
                    if (r) toggleConfigValue(r);
                  }
                }}
                onEdit={() => {
                  setEditingRule({
                    title: "Chống spam file media",
                    desc: "Ngăn chặn gửi hàng loạt file ảnh, video hoặc GIF làm loãng nhóm.",
                    fields: [
                      { key: "media_spam_max_messages", label: "Số file media tối đa", type: "number", unit: "file", hint: "Đặt 0 để tắt" },
                      { key: "media_spam_window_seconds", label: "Thời gian theo dõi", type: "number", unit: "giây" },
                      { key: "media_spam_action", label: "Hành vi xử phạt", type: "select", options: [
                        { value: "delete", label: "Xóa media (Delete)" },
                        { value: "warn", label: "Cảnh báo (Warn)" },
                        { value: "restrict", label: "Khóa chat (Mute)" },
                        { value: "ban", label: "Cấm khỏi nhóm (Ban)" },
                      ]},
                    ],
                    values: {
                      media_spam_max_messages: mediaMax,
                      media_spam_window_seconds: mediaWindow,
                      media_spam_action: mediaAction,
                    },
                  });
                }}
                saving={saving}
              />

              {/* Rule 4: Hidden Link & Text Mention */}
              <RuleRow
                icon={<Link2 size={18} color="#ec4899" />}
                title="Chặn link ẩn & mention tàng hình"
                desc={`Tự động bóc tách link lồng văn bản hoặc mention ẩn · Phạt: ${hiddenLinkAction.toUpperCase()}`}
                conditionChip="Có link ẩn / @mention"
                actionChip={hiddenLinkAction}
                actionColor={actionColor(hiddenLinkAction)}
                switchOn={scanHiddenLink}
                onToggle={() => {
                  if (onUpdateSettings) {
                    void onUpdateSettings({ scan_hidden_links: scanHiddenLink ? "false" : "true" });
                  } else {
                    const r = getRow("scan_hidden_links");
                    if (r) toggleConfigValue(r);
                  }
                }}
                onEdit={() => {
                  setEditingRule({
                    title: "Chặn link ẩn & mention tàng hình",
                    desc: "Bóc tách siêu liên kết ẩn trong ký tự hoặc mention vô hình.",
                    fields: [
                      { key: "hidden_link_action", label: "Hành vi xử lý", type: "select", options: [
                        { value: "delete", label: "Xóa tin (Delete)" },
                        { value: "warn", label: "Cảnh báo (Warn)" },
                        { value: "restrict", label: "Khóa chat (Mute)" },
                        { value: "ban", label: "Cấm vĩnh viễn (Ban)" },
                      ]},
                      { key: "hidden_link_reason", label: "Lý do ghi log và thông báo", type: "text" },
                    ],
                    values: {
                      hidden_link_action: hiddenLinkAction,
                      hidden_link_reason: getVal("hidden_link_reason", "Chứa liên kết ẩn hoặc mention vô hình trái phép."),
                    },
                  });
                }}
                saving={saving}
              />

              {/* Rule 5: Bio Scanner */}
              <RuleRow
                icon={<UserX size={18} color="#14b8a6" />}
                title="Quét link độc trong Bio"
                desc="Tự động phát hiện bot airdrop và link xấu trong tiểu sử thành viên mới"
                conditionChip="Bio chứa link / URL"
                actionChip="Xóa & Mute"
                actionColor="secondary"
                switchOn={scanBio}
                onToggle={() => {
                  if (onUpdateSettings) {
                    void onUpdateSettings({ scan_bio_links: scanBio ? "false" : "true" });
                  } else {
                    const r = getRow("scan_bio_links");
                    if (r) toggleConfigValue(r);
                  }
                }}
                onEdit={() => {
                  setEditingRule({
                    title: "Quét link độc trong Bio",
                    desc: "Kiểm tra tiểu sử của tài khoản mới gia nhập để lọc bot airdrop và lừa đảo.",
                    fields: [
                      { key: "bio_link_restrict_seconds", label: "Thời hạn khóa chat (giây)", type: "number", unit: "giây" },
                      { key: "bio_link_delete_message", label: "Tự động xóa tin nhắn vi phạm", type: "select", options: [
                        { value: "true", label: "Có xóa tin" },
                        { value: "false", label: "Không xóa tin" },
                      ]},
                    ],
                    values: {
                      bio_link_restrict_seconds: getVal("bio_link_restrict_seconds", "86400"),
                      bio_link_delete_message: getVal("bio_link_delete_message", "true"),
                    },
                  });
                }}
                saving={saving}
              />

              {/* Rule 6: Inline Keyboard Trap */}
              <RuleRow
                icon={<AlertTriangle size={18} color="#ef4444" />}
                title="Chặn tin nhắn có nút bấm"
                desc={`Chỉ admin được gửi tin có button. Phạt thành viên thường: ${inlineAction.toUpperCase()}`}
                conditionChip="Tin có inline button"
                actionChip={inlineAction}
                actionColor={actionColor(inlineAction)}
                switchOn={inlineKeyboardBlock}
                onToggle={() => {
                  if (onUpdateSettings) {
                    void onUpdateSettings({ delete_inline_keyboard_messages: inlineKeyboardBlock ? "false" : "true" });
                  } else {
                    const r = getRow("delete_inline_keyboard_messages");
                    if (r) toggleConfigValue(r);
                  }
                }}
                onEdit={() => {
                  setEditingRule({
                    title: "Chặn tin nhắn có nút bấm",
                    desc: "Thành viên thường gửi tin nhắn có nút inline button sẽ bị xử phạt ngay.",
                    fields: [
                      { key: "inline_keyboard_action", label: "Hành vi xử phạt", type: "select", options: [
                        { value: "ban", label: "Cấm vĩnh viễn (Ban)" },
                        { value: "kick", label: "Đuổi khỏi nhóm (Kick)" },
                        { value: "warn", label: "Cảnh báo (Warn)" },
                        { value: "delete", label: "Chỉ xóa tin (Delete)" },
                      ]},
                    ],
                    values: {
                      inline_keyboard_action: inlineAction,
                    },
                  });
                }}
                saving={saving}
              />

              {/* Rule 7: Forward Gate */}
              <Box sx={{ p: 1.75, bgcolor: "background.paper" }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Forward size={18} color="#6366f1" />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Kiểm soát tin Forward
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Chặn chia sẻ từ kênh/nhóm khác tránh spam kéo mem
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
                    <Chip
                      label="Chặn toàn bộ"
                      size="small"
                      clickable
                      color={forwardMode === "block" ? "error" : "default"}
                      variant={forwardMode === "block" ? "filled" : "outlined"}
                      onClick={() => setForwardMode("block")}
                      sx={{ fontWeight: 700, borderRadius: 1.5 }}
                    />
                    <Chip
                      label="Có kiểm soát"
                      size="small"
                      clickable
                      color={forwardMode === "controlled" ? "warning" : "default"}
                      variant={forwardMode === "controlled" ? "filled" : "outlined"}
                      onClick={() => setForwardMode("controlled")}
                      sx={{ fontWeight: 700, borderRadius: 1.5 }}
                    />
                    <Chip
                      label="Cho phép tất cả"
                      size="small"
                      clickable
                      color={forwardMode === "allow" ? "success" : "default"}
                      variant={forwardMode === "allow" ? "filled" : "outlined"}
                      onClick={() => setForwardMode("allow")}
                      sx={{ fontWeight: 700, borderRadius: 1.5 }}
                    />
                  </Stack>
                </Stack>
              </Box>

              {/* Rule 8: Escalation Ladder (Ban after warnings) */}
              <RuleRow
                icon={<Ban size={18} color="#dc2626" />}
                title="Thang trừng phạt lũy tiến (Auto-Ban)"
                desc={`Tự động cấm sau ${banAfterWarnings} lần cảnh báo (${Math.round(Number(banSeconds) / 3600)}h)`}
                conditionChip={`Chạm ${banAfterWarnings} cảnh báo`}
                actionChip={`Ban ${Math.round(Number(banSeconds) / 3600)}h`}
                actionColor="error"
                switchOn={autoBanLadderOn}
                onToggle={() => {
                  if (onUpdateSettings) {
                    void onUpdateSettings({ ban_after_warnings: autoBanLadderOn ? "0" : "3" });
                  } else {
                    const r = getRow("ban_after_warnings");
                    if (r) toggleConfigValue(r);
                  }
                }}
                onEdit={() => {
                  setEditingRule({
                    title: "Thang trừng phạt lũy tiến (Auto-Ban)",
                    desc: "Tự động cấm thành viên khi số lần cảnh báo vi phạm vượt quá ngưỡng.",
                    fields: [
                      { key: "ban_after_warnings", label: "Số lần cảnh báo tối đa trước khi Ban", type: "number", unit: "lần", hint: "Đặt 0 để tắt" },
                      { key: "ban_seconds", label: "Thời hạn cấm (giây)", type: "number", unit: "giây", hint: "vd: 86400 = 24h" },
                    ],
                    values: {
                      ban_after_warnings: banAfterWarnings,
                      ban_seconds: banSeconds,
                    },
                  });
                }}
                saving={saving}
              />

              {/* Rule 9: Service Message Cleaner */}
              <RuleRow
                icon={<Trash2 size={18} color="#059669" />}
                title="Tự động dọn tin nhắn hệ thống"
                desc="Xóa thông báo tham gia/rời nhóm, tin ghim và đổi ảnh để giữ nhóm sạch đẹp"
                conditionChip="Tin hệ thống (Join/Leave/Pin)"
                actionChip="TỰ ĐỘNG XÓA"
                actionColor="info"
                switchOn={deleteSystemMessages}
                onToggle={() => {
                  if (onUpdateSettings) {
                    void onUpdateSettings({ delete_system_messages: deleteSystemMessages ? "false" : "true" });
                  } else {
                    const r = getRow("delete_system_messages");
                    if (r) toggleConfigValue(r);
                  }
                }}
                onEdit={() => {
                  setEditingRule({
                    title: "Tự động dọn tin nhắn hệ thống",
                    desc: "Tự động xóa các tin nhắn sự kiện từ Telegram để nhóm luôn sạch đẹp.",
                    fields: [
                      {
                        key: "delete_system_messages",
                        label: "Trạng thái tự động xóa",
                        type: "select",
                        options: [
                          { value: "true", label: "Bật — Tự động xóa sạch tin hệ thống (Khuyên dùng)" },
                          { value: "false", label: "Tắt — Giữ lại tin hệ thống" },
                        ],
                      },
                    ],
                    values: {
                      delete_system_messages: deleteSystemMessages ? "true" : "false",
                    },
                  });
                }}
                saving={saving}
              />

              {/* Rule 10: Emoji Spam */}
              <RuleRow
                icon={<Smile size={18} color="#d97706" />}
                title="Chống spam biểu tượng cảm xúc (Emoji Flood)"
                desc={`Giới hạn tối đa ${emojiMaxCount} emoji/tin nhắn để tránh xả icon làm lag nhóm`}
                conditionChip={`> ${emojiMaxCount} emoji/tin`}
                actionChip="XÓA TIN"
                actionColor="warning"
                switchOn={emojiSpamEnabled}
                onToggle={() => {
                  if (onUpdateSettings) {
                    void onUpdateSettings({ emoji_spam_enabled: emojiSpamEnabled ? "false" : "true" });
                  } else {
                    const r = getRow("emoji_spam_enabled");
                    if (r) toggleConfigValue(r);
                  }
                }}
                onEdit={() => {
                  setEditingRule({
                    title: "Chống spam biểu tượng cảm xúc (Emoji Flood)",
                    desc: "Phát hiện và xóa các tin nhắn chứa quá nhiều emoji gây trôi chat.",
                    fields: [
                      { key: "emoji_spam_max_count", label: "Số lượng emoji tối đa trong 1 tin", type: "number", unit: "emoji", hint: "Vượt quá ngưỡng này sẽ bị xóa (Mặc định 8)" },
                      {
                        key: "emoji_spam_enabled",
                        label: "Trạng thái kiểm tra emoji",
                        type: "select",
                        options: [
                          { value: "true", label: "Bật kiểm tra" },
                          { value: "false", label: "Tắt kiểm tra" },
                        ],
                      },
                    ],
                    values: {
                      emoji_spam_max_count: emojiMaxCount,
                      emoji_spam_enabled: emojiSpamEnabled ? "true" : "false",
                    },
                  });
                }}
                saving={saving}
              />

              {/* Rule 11: Anti-Bot Shield */}
              <RuleRow
                icon={<Bot size={18} color="#dc2626" />}
                title="Chặn bot lạ xâm nhập (Anti-Bot Shield)"
                desc="Chặn tin nhắn từ bot chưa được cấp phép và tự động kick khỏi nhóm"
                conditionChip="Tài khoản Bot trái phép"
                actionChip="XÓA & KICK"
                actionColor="error"
                switchOn={deleteMessagesFromBots || removeUnknownBots}
                onToggle={() => {
                  const nextState = !(deleteMessagesFromBots || removeUnknownBots);
                  if (onUpdateSettings) {
                    void onUpdateSettings({
                      delete_messages_from_bots: nextState ? "true" : "false",
                      remove_unknown_bots: nextState ? "true" : "false",
                    });
                  } else {
                    const r = getRow("delete_messages_from_bots");
                    if (r) toggleConfigValue(r);
                  }
                }}
                onEdit={() => {
                  setEditingRule({
                    title: "Chặn bot lạ xâm nhập (Anti-Bot Shield)",
                    desc: "Ngăn chặn các bot quảng cáo hoặc userbot được add vào nhóm trái phép.",
                    fields: [
                      {
                        key: "delete_messages_from_bots",
                        label: "Tự động xóa tin nhắn từ bot lạ",
                        type: "select",
                        options: [
                          { value: "true", label: "Có xóa tin (Khuyên dùng)" },
                          { value: "false", label: "Không xóa tin" },
                        ],
                      },
                      {
                        key: "remove_unknown_bots",
                        label: "Tự động kick bot lạ ra khỏi nhóm",
                        type: "select",
                        options: [
                          { value: "true", label: "Có kick bot (Khuyên dùng)" },
                          { value: "false", label: "Không kick" },
                        ],
                      },
                    ],
                    values: {
                      delete_messages_from_bots: deleteMessagesFromBots ? "true" : "false",
                      remove_unknown_bots: removeUnknownBots ? "true" : "false",
                    },
                  });
                }}
                saving={saving}
              />

              {/* Rule 12: Admin Exemption */}
              <RuleRow
                icon={<Crown size={18} color="#16a34a" />}
                title="Miễn trừ Quản trị viên (Admin Whitelist)"
                desc="Bỏ qua toàn bộ bộ lọc và kiểm duyệt đối với Admin và Chủ sở hữu nhóm"
                conditionChip="Là Admin / Owner"
                actionChip="MIỄN TRỪ"
                actionColor="default"
                switchOn={exemptAdmins}
                onToggle={() => {
                  if (onUpdateSettings) {
                    void onUpdateSettings({ exempt_admins: exemptAdmins ? "false" : "true" });
                  } else {
                    const r = getRow("exempt_admins");
                    if (r) toggleConfigValue(r);
                  }
                }}
                onEdit={() => {
                  setEditingRule({
                    title: "Miễn trừ Quản trị viên (Admin Whitelist)",
                    desc: "Cấu hình xem Admin có chịu sự chi phối của các luật kiểm duyệt hay không.",
                    fields: [
                      {
                        key: "exempt_admins",
                        label: "Miễn trừ kiểm duyệt cho admin",
                        type: "select",
                        options: [
                          { value: "true", label: "Bật miễn trừ — Admin thoải mái gửi tin/link (Khuyên dùng)" },
                          { value: "false", label: "Tắt miễn trừ — Áp dụng kiểm duyệt cả với admin" },
                        ],
                      },
                    ],
                    values: {
                      exempt_admins: exemptAdmins ? "true" : "false",
                    },
                  });
                }}
                saving={saving}
              />
            </Stack>
          </Paper>

          {/* Dedicated Rule Edit Modal */}
          <Dialog
            open={Boolean(editingRule)}
            onClose={() => setEditingRule(null)}
            maxWidth="sm"
            fullWidth
            slotProps={{
              paper: {
                sx: { borderRadius: 3, p: 1 },
              },
            }}
          >
            {editingRule && (
              <>
                <DialogTitle sx={{ pb: 1 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {editingRule.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {editingRule.desc}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setEditingRule(null)}>
                      <X size={18} />
                    </IconButton>
                  </Stack>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2.5, pb: 2 }}>
                  <Stack spacing={2.5}>
                    {editingRule.fields.map((field) => (
                      <Box key={field.key}>
                        <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.75, display: "block" }}>
                          {field.label} {field.unit ? `(${field.unit})` : ""}
                        </Typography>
                        {field.type === "select" ? (
                          <TextField
                            select
                            fullWidth
                            size="small"
                            value={editingRule.values[field.key] ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingRule((prev) =>
                                prev ? { ...prev, values: { ...prev.values, [field.key]: val } } : null
                              );
                            }}
                            helperText={field.hint}
                          >
                            {(field.options || []).map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        ) : (
                          <TextField
                            fullWidth
                            size="small"
                            type={field.type === "number" ? "number" : "text"}
                            value={editingRule.values[field.key] ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingRule((prev) =>
                                prev ? { ...prev, values: { ...prev.values, [field.key]: val } } : null
                              );
                            }}
                            helperText={field.hint}
                          />
                        )}
                      </Box>
                    ))}
                  </Stack>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ px: 3, py: 2 }}>
                  <MuiButton variant="outlined" color="inherit" onClick={() => setEditingRule(null)} disabled={modalSaving}>
                    Hủy
                  </MuiButton>
                  <MuiButton
                    variant="contained"
                    color="primary"
                    startIcon={modalSaving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
                    onClick={handleSaveModal}
                    disabled={modalSaving}
                    sx={{ fontWeight: 700 }}
                  >
                    Lưu quy tắc
                  </MuiButton>
                </DialogActions>
              </>
            )}
          </Dialog>

          {/* Active Edit Drawer / Inline Form if user clicked "Sửa" */}
          {selected && Object.keys(draft).length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper", borderRadius: 2, border: "2px solid", borderColor: "primary.main" }}>
              <Stack spacing={1.5}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Tùy chỉnh: {configLabel(String(selected.key || ""))}
                  </Typography>
                  <MuiButton size="small" variant="text" onClick={closeFocusedPanel}>
                    Đóng
                  </MuiButton>
                </Stack>
                <ConfigEditor
                  draft={draft as ConfigEditorDraft}
                  saving={saving}
                  editorKind={configEditorKind(String(selected.key || ""))}
                  configSelectOptions={configSelectOptions}
                  configPlaceholders={configPlaceholders}
                  fieldUnitHint={fieldUnitHint}
                  setDraft={setDraft}
                  closeFocusedPanel={closeFocusedPanel}
                  save={save}
                />
              </Stack>
            </Paper>
          )}
        </Stack>
      )}

      {/* 4. TAB 2: RULE SANDBOX (LIVE SIMULATOR) */}
      {activeTab === "sandbox" && (
        <Grid container spacing={2}>
          {/* Left Column: Test inputs */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack spacing={2}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Thử nghiệm tin nhắn
                </Typography>

                <TextField
                  label="Nội dung tin nhắn thử nghiệm"
                  multiline
                  minRows={3}
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Tiểu sử (Bio) của người gửi"
                  size="small"
                  value={testUserBio}
                  onChange={(e) => setTestUserBio(e.target.value)}
                  fullWidth
                />

                <Stack spacing={1}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    Thuộc tính tin nhắn:
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                    <Chip
                      label={testHasLink ? "Có link" : "Không link"}
                      clickable
                      color={testHasLink ? "primary" : "default"}
                      onClick={() => setTestHasLink((v) => !v)}
                      size="small"
                      sx={{ borderRadius: 1 }}
                    />
                    <Chip
                      label={testHasButtons ? "Có inline buttons" : "Không button"}
                      clickable
                      color={testHasButtons ? "error" : "default"}
                      onClick={() => setTestHasButtons((v) => !v)}
                      size="small"
                      sx={{ borderRadius: 1 }}
                    />
                    <Chip
                      label={testIsForwarded ? "Tin forward" : "Tin trực tiếp"}
                      clickable
                      color={testIsForwarded ? "warning" : "default"}
                      onClick={() => setTestIsForwarded((v) => !v)}
                      size="small"
                      sx={{ borderRadius: 1 }}
                    />
                    <Chip
                      label={`Lặp lại: ${testRepeatCount} lần`}
                      clickable
                      color={testRepeatCount > 1 ? "secondary" : "default"}
                      onClick={() => setTestRepeatCount((c) => (c >= 5 ? 1 : c + 2))}
                      size="small"
                      sx={{ borderRadius: 1 }}
                    />
                  </Stack>
                </Stack>

                <Divider />

                {/* Verdict Box */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                    Đánh giá từ Bot:
                  </Typography>
                  {sandboxAnalysis.isViolated ? (
                    <Alert severity="error" sx={{ borderRadius: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        🚨 Phát hiện vi phạm ({sandboxAnalysis.violations.length})
                      </Typography>
                      <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                        {sandboxAnalysis.violations.map((v, i) => (
                          <Typography key={i} variant="caption" sx={{ display: "block" }}>
                            • <strong>{v.rule}</strong>: {v.detail} → <em>Xử lý: {v.action}</em>
                          </Typography>
                        ))}
                      </Stack>
                      <Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>
                        ⚡ Hành vi trừng phạt: <code>{sandboxAnalysis.severeAction.toUpperCase()}</code>
                      </Typography>
                    </Alert>
                  ) : (
                    <Alert severity="success" sx={{ borderRadius: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        ✅ Hợp lệ — Tin nhắn an toàn
                      </Typography>
                      <Typography variant="caption">
                        Không vi phạm bộ lọc spam, link ẩn hay blacklist.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {/* Right Column: Telegram Phone Simulator Preview */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Stack spacing={1.5} sx={{ width: "100%", alignItems: "center" }}>
                <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    Mô phỏng Telegram
                  </Typography>
                </Box>

                <TelegramPhoneSimulator
                  groupName={selectedGroupName}
                  botName="Cu Bot Security"
                  botUsername={`@${selectedBotKey}`}
                  messageText={
                    sandboxAnalysis.isViolated
                      ? `⚠️ **CẢNH BÁO KIỂM DUYỆT**\n\nNgười dùng @user vừa vi phạm: **${sandboxAnalysis.violations[0]?.rule}**\n\n⚡ **Hình phạt**: Đã ${sandboxAnalysis.severeAction} và xóa tin nhắn.\n\n*Vui lòng tuân thủ quy tắc nhóm để tránh bị ban vĩnh viễn.*`
                      : testText
                  }
                  deleteAfterSeconds={30}
                />
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* 5. TAB 3: NOTICE TEMPLATES */}
      {activeTab === "templates" && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Mẫu thông báo vi phạm
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default", borderRadius: 2 }}>
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Tin nhắn cảnh báo vi phạm
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", p: 1.5, bgcolor: "background.paper", borderRadius: 1 }}>
                      {warningNotice}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Biến: <code>{`{user}`}</code>, <code>{`{chat}`}</code>, <code>{`{reason}`}</code>, <code>{`{count}`}</code>
                    </Typography>
                    <MuiButton
                      variant="outlined"
                      size="small"
                      startIcon={<Edit3 size={14} />}
                      onClick={() => {
                        const r = getRow("warning_text");
                        if (r) startEdit(r);
                      }}
                      sx={{ alignSelf: "flex-start", textTransform: "none", borderRadius: 1.5 }}
                    >
                      Sửa mẫu tin
                    </MuiButton>
                  </Stack>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default", borderRadius: 2 }}>
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Thời gian tự xóa tin cảnh báo
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tự động xóa sau {getVal("warning_notice_delete_seconds", "30")}s để tránh rác nhóm.
                    </Typography>
                    <MuiButton
                      variant="outlined"
                      size="small"
                      startIcon={<Edit3 size={14} />}
                      onClick={() => {
                        const r = getRow("warning_notice_delete_seconds");
                        if (r) startEdit(r);
                      }}
                      sx={{ alignSelf: "flex-start", textTransform: "none", borderRadius: 1.5 }}
                    >
                      Đổi thời gian
                    </MuiButton>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        </Paper>
      )}

      {/* 6. TAB 4: ADVANCED SETTINGS */}
      {activeTab === "advanced" && (
        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Thông số xử lý & Tự hủy thông báo (Timers & Retention)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Điều chỉnh chu kỳ lưu trữ tin nhắn cảnh báo và độ trễ xóa vi phạm để tối ưu hiệu năng nhóm
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default", borderRadius: 2 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Tự xóa cảnh báo Spam
                        </Typography>
                        <Chip label={`${getVal("spam_notice_delete_seconds", "20")}s`} size="small" variant="outlined" sx={{ height: 22, fontWeight: 700 }} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Thời gian bot tự hủy thông báo cảnh báo spam trong nhóm chat.
                      </Typography>
                      <MuiButton
                        variant="outlined"
                        size="small"
                        startIcon={<Edit3 size={14} />}
                        onClick={() => {
                          const r = getRow("spam_notice_delete_seconds");
                          if (r) startEdit(r);
                        }}
                        sx={{ alignSelf: "flex-start", textTransform: "none", mt: 0.5, borderRadius: 1.5 }}
                      >
                        Chỉnh sửa
                      </MuiButton>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default", borderRadius: 2 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Tự xóa cảnh báo Forward
                        </Typography>
                        <Chip label={`${getVal("forward_warning_delete_seconds", "180")}s`} size="small" variant="outlined" sx={{ height: 22, fontWeight: 700 }} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Thời gian bot tự hủy thông báo vi phạm chia sẻ chuyển tiếp tin.
                      </Typography>
                      <MuiButton
                        variant="outlined"
                        size="small"
                        startIcon={<Edit3 size={14} />}
                        onClick={() => {
                          const r = getRow("forward_warning_delete_seconds");
                          if (r) startEdit(r);
                        }}
                        sx={{ alignSelf: "flex-start", textTransform: "none", mt: 0.5, borderRadius: 1.5 }}
                      >
                        Chỉnh sửa
                      </MuiButton>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default", borderRadius: 2 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Thử lại khi xóa tin lỗi (Retry)
                        </Typography>
                        <Chip label={`${getVal("violation_delete_retry_seconds", "2")}s`} size="small" variant="outlined" sx={{ height: 22, fontWeight: 700 }} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Khoảng trễ thử lại lệnh deleteMessage nếu Telegram API gặp timeout hoặc rate-limit.
                      </Typography>
                      <MuiButton
                        variant="outlined"
                        size="small"
                        startIcon={<Edit3 size={14} />}
                        onClick={() => {
                          const r = getRow("violation_delete_retry_seconds");
                          if (r) startEdit(r);
                        }}
                        sx={{ alignSelf: "flex-start", textTransform: "none", mt: 0.5, borderRadius: 1.5 }}
                      >
                        Chỉnh sửa
                      </MuiButton>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default", borderRadius: 2 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Bộ nhớ đệm quét Bio (Cache)
                        </Typography>
                        <Chip label={`${Math.round(Number(getVal("bio_scan_cache_seconds", "3600")) / 60)} phút`} size="small" variant="outlined" sx={{ height: 22, fontWeight: 700 }} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Thời gian lưu kết quả kiểm tra tiểu sử để tránh gọi API liên tục cho cùng một người dùng.
                      </Typography>
                      <MuiButton
                        variant="outlined"
                        size="small"
                        startIcon={<Edit3 size={14} />}
                        onClick={() => {
                          const r = getRow("bio_scan_cache_seconds");
                          if (r) startEdit(r);
                        }}
                        sx={{ alignSelf: "flex-start", textTransform: "none", mt: 0.5, borderRadius: 1.5 }}
                      >
                        Chỉnh sửa
                      </MuiButton>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </Stack>
          </Paper>
        </Stack>
      )}
    </Box>
  );
}

// Sub-component: A single clean rule row in the Policy Matrix
function RuleRow({
  icon,
  title,
  desc,
  conditionChip,
  actionChip,
  actionColor = "default",
  switchOn,
  onToggle,
  onEdit,
  saving,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  conditionChip: string;
  actionChip: string;
  actionColor?: "warning" | "info" | "secondary" | "error" | "default";
  switchOn: boolean;
  onToggle: () => void;
  onEdit: () => void;
  saving: boolean;
}) {
  return (
    <Box
      sx={{
        p: 1.75,
        bgcolor: switchOn ? "background.paper" : "action.hover",
        opacity: switchOn ? 1 : 0.65,
        transition: "all 0.15s ease",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" } }}
      >
        {/* Left: Icon + Title + Description */}
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", flex: 1, minWidth: 0 }}>
          <Box sx={{ mt: 0.25, flexShrink: 0 }}>{icon}</Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              {desc}
            </Typography>
          </Box>
        </Stack>

        {/* Right: Condition + Action Badges + Switch + Edit */}
        <Stack
          direction="row"
          spacing={1.25}
          sx={{ alignItems: "center", flexWrap: "wrap", justifyContent: { xs: "flex-start", md: "flex-end" } }}
        >
          <Tooltip title="Ngưỡng kích hoạt">
            <Chip size="small" variant="outlined" label={conditionChip} sx={{ fontSize: "0.72rem", height: 24 }} />
          </Tooltip>

          <Tooltip title="Hành vi trừng phạt của Bot">
            <Chip
              size="small"
              label={actionChip.toUpperCase()}
              color={actionColor}
              sx={{ fontSize: "0.72rem", fontWeight: 700, height: 24 }}
            />
          </Tooltip>

          <IconButton size="small" onClick={onEdit} title="Tùy chỉnh sâu">
            <Edit3 size={15} />
          </IconButton>

          <Switch checked={switchOn} onChange={onToggle} disabled={saving} size="small" />
        </Stack>
      </Stack>
    </Box>
  );
}
