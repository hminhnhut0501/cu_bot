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
  CheckCircle2,
  Clock,
  Copy,
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
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
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
  const [activeTab, setActiveTab] = useState<"matrix" | "sandbox" | "templates">("matrix");

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
      {/* 1. Pulse Defense Header & Group Context */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          bgcolor: "background.paper",
          borderRadius: 2,
          backgroundImage: "linear-gradient(135deg, rgba(15, 118, 110, 0.05), transparent 60%)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" } }}
        >
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
              <ShieldCheck size={20} color="#0f766e" />
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                Hệ thống Phòng thủ & Kiểm duyệt Tự động
              </Typography>
              <Chip
                label="Active Defense"
                size="small"
                color="success"
                sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700 }}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Đang bảo vệ: <strong>{selectedGroupName}</strong> · Bot trực: <code>@{selectedBotKey}</code> · Tự động phát hiện spam, link độc, raid và trừng phạt tức thì.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <MuiButton
              variant="outlined"
              size="small"
              onClick={() => onOpenTaskData("keywords")}
              startIcon={<SlidersHorizontal size={14} />}
              sx={{ textTransform: "none" }}
            >
              Từ khóa cấm
            </MuiButton>
            <MuiButton
              variant="outlined"
              size="small"
              onClick={() => onOpenTaskData("domain_blacklist")}
              startIcon={<Link2 size={14} />}
              sx={{ textTransform: "none" }}
            >
              Blacklist Domain
            </MuiButton>
          </Stack>
        </Stack>
      </Paper>

      {/* 2. Navigation Pills: Policy Matrix vs Sandbox vs Templates */}
      <Stack direction="row" spacing={1} sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 1 }}>
        <MuiButton
          variant={activeTab === "matrix" ? "contained" : "text"}
          onClick={() => setActiveTab("matrix")}
          startIcon={<Shield size={16} />}
          sx={{ textTransform: "none", borderRadius: 1.5, fontWeight: 700 }}
        >
          Ma trận chính sách (Policy Matrix)
        </MuiButton>
        <MuiButton
          variant={activeTab === "sandbox" ? "contained" : "text"}
          onClick={() => setActiveTab("sandbox")}
          startIcon={<Zap size={16} />}
          sx={{ textTransform: "none", borderRadius: 1.5, fontWeight: 700 }}
        >
          Phòng thử nghiệm luật (Rule Sandbox)
        </MuiButton>
        <MuiButton
          variant={activeTab === "templates" ? "contained" : "text"}
          onClick={() => setActiveTab("templates")}
          startIcon={<MessageSquare size={16} />}
          sx={{ textTransform: "none", borderRadius: 1.5, fontWeight: 700 }}
        >
          Mẫu tin cảnh báo (Notice Templates)
        </MuiButton>
      </Stack>

      {/* 3. TAB 1: POLICY RULE MATRIX */}
      {activeTab === "matrix" && (
        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ p: 0, overflow: "hidden", borderRadius: 2 }}>
            <Box sx={{ p: 2, bgcolor: "background.default", borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Bảng quy tắc kiểm duyệt thời gian thực
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Các switch cập nhật lạc quan (0ms). Nhấp vào "Sửa" trên từng dòng để đổi ngưỡng số hoặc thời gian phạt.
              </Typography>
            </Box>

            <Stack divider={<Divider />}>
              {/* Rule 1: Spam Rate */}
              <RuleRow
                icon={<Clock size={18} color="#0284c7" />}
                title="Chống Spam tin nhắn nhanh (Flood Rate)"
                desc={`Giới hạn ${spamMax} tin / ${spamWindow} giây. Vượt ngưỡng sẽ ${spamAction}.`}
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
                    title: "Chống Spam tin nhắn nhanh (Flood Rate)",
                    desc: "Giới hạn số tin nhắn một thành viên có thể gửi trong một khoảng thời gian ngắn.",
                    fields: [
                      { key: "spam_max_messages", label: "Giới hạn số tin tối đa", type: "number", unit: "tin", hint: "Vượt quá ngưỡng này sẽ bị coi là spam (Đặt 0 để tắt)" },
                      { key: "spam_window_seconds", label: "Cửa sổ thời gian theo dõi", type: "number", unit: "giây", hint: "Khoảng thời gian gom nhóm tin nhắn để đếm" },
                      { key: "spam_action", label: "Hành vi xử lý vi phạm", type: "select", options: [
                        { value: "mute", label: "Chặn chat tạm thời (Mute) - Khuyên dùng" },
                        { value: "warn", label: "Cảnh báo (Warn)" },
                        { value: "delete", label: "Chỉ xóa tin (Delete)" },
                        { value: "kick", label: "Đuổi khỏi nhóm (Kick)" },
                        { value: "ban", label: "Cấm vĩnh viễn (Ban)" },
                      ]},
                      { key: "spam_restrict_seconds", label: "Thời hạn khóa chat (nếu chọn Mute)", type: "number", unit: "giây", hint: "vd: 300 = 5 phút, 3600 = 1 giờ, 86400 = 24 giờ" },
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
                title="Chống Lặp lại nội dung (Duplicate / Text & Sticker Raid)"
                desc={`Phát hiện tin nhắn hoặc sticker giống nhau quá ${dupMax} lần / ${dupWindow} giây.`}
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
                    title: "Chống Lặp lại nội dung (Duplicate / Text & Sticker Raid)",
                    desc: "Phát hiện tin nhắn hoặc sticker giống nhau lặp đi lặp lại nhiều lần.",
                    fields: [
                      { key: "duplicate_message_max_count", label: "Số lần trùng lặp tối đa cho phép", type: "number", unit: "lần" },
                      { key: "duplicate_message_window_seconds", label: "Thời gian theo dõi trùng lặp", type: "number", unit: "giây" },
                      { key: "duplicate_message_action", label: "Hành vi xử lý", type: "select", options: [
                        { value: "delete", label: "Xóa tin nhắn vi phạm (Delete)" },
                        { value: "warn", label: "Cảnh báo (Warn)" },
                        { value: "restrict", label: "Khóa chat tạm thời (Mute)" },
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
                title="Chống Spam ảnh / video / media (Media Flood)"
                desc={`Giới hạn gửi tối đa ${mediaMax} file media / ${mediaWindow} giây.`}
                conditionChip={`> ${mediaMax} media / ${mediaWindow}s`}
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
                    title: "Chống Spam ảnh / video / media (Media Flood)",
                    desc: "Ngăn chặn xả hàng loạt file media, sticker hoặc GIF làm loãng nhóm.",
                    fields: [
                      { key: "media_spam_max_messages", label: "Số file media tối đa", type: "number", unit: "file", hint: "Đặt 0 để tắt kiểm tra" },
                      { key: "media_spam_window_seconds", label: "Thời gian theo dõi", type: "number", unit: "giây" },
                      { key: "media_spam_action", label: "Hành vi xử lý", type: "select", options: [
                        { value: "delete", label: "Xóa media vi phạm (Delete)" },
                        { value: "warn", label: "Cảnh báo (Warn)" },
                        { value: "restrict", label: "Khóa chat tạm thời (Mute)" },
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
                title="Chặn Link ẩn & Text-Mention (@user vô hình)"
                desc="Tự động bóc tách các liên kết lồng trong văn bản hoặc ký tự khoảng trắng để tránh lách luật."
                conditionChip="Có liên kết ẩn / @mention"
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
                    title: "Chặn Link ẩn & Text-Mention (@user vô hình)",
                    desc: "Bóc tách link siêu liên kết ẩn trong ký tự hoặc @mention tàng hình.",
                    fields: [
                      { key: "hidden_link_action", label: "Hành vi khi phát hiện link ẩn", type: "select", options: [
                        { value: "delete", label: "Xóa tin nhắn (Delete) - Khuyên dùng" },
                        { value: "warn", label: "Cảnh báo (Warn)" },
                        { value: "restrict", label: "Khóa chat tạm thời (Mute)" },
                        { value: "ban", label: "Cấm vĩnh viễn (Ban)" },
                      ]},
                      { key: "hidden_link_reason", label: "Lý do ghi nhật ký và thông báo", type: "text" },
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
                title="Quét Link độc hại trong Bio thành viên (Bio Scanner)"
                desc="Kiểm tra tiểu sử của thành viên mới gia nhập, ngăn chặn tài khoản bot quảng cáo lừa đảo."
                conditionChip="Bio chứa link t.me/ hoặc URL"
                actionChip="Xóa tin & Hạn chế"
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
                    title: "Quét Link độc hại trong Bio thành viên (Bio Scanner)",
                    desc: "Kiểm tra tiểu sử của tài khoản mới gia nhập để lọc bot airdrop và lừa đảo.",
                    fields: [
                      { key: "bio_link_restrict_seconds", label: "Thời hạn khóa chat thành viên vi phạm bio", type: "number", unit: "giây", hint: "vd: 86400 = 24 giờ, 604800 = 7 ngày" },
                      { key: "bio_link_delete_message", label: "Tự động xóa tin nhắn vi phạm", type: "select", options: [
                        { value: "true", label: "Có xóa tin (Khuyên dùng)" },
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
                title="Chặn Tin nhắn có nút bấm (Inline Keyboard Scam Trap)"
                desc="Thành viên không phải admin gửi tin có nút bấm sẽ bị trừng phạt nghiêm khắc để diệt bot cào airdrop."
                conditionChip="Tin nhắn có inline button"
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
                    title: "Chặn Tin nhắn có nút bấm (Inline Keyboard Scam Trap)",
                    desc: "Thành viên thường gửi tin nhắn có nút inline button sẽ bị xử phạt ngay lập tức.",
                    fields: [
                      { key: "inline_keyboard_action", label: "Hành vi xử phạt", type: "select", options: [
                        { value: "ban", label: "Cấm vĩnh viễn (Ban) - Khuyên dùng diệt bot cào" },
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
              <Box sx={{ p: 2, bgcolor: "background.paper" }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Forward size={18} color="#6366f1" />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Chế độ kiểm soát tin Forward (Forward Gate)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Chặn triệt để tin chia sẻ từ kênh/nhóm khác để tránh spam kéo mem.
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
                      sx={{ fontWeight: 700 }}
                    />
                    <Chip
                      label="Có kiểm soát"
                      size="small"
                      clickable
                      color={forwardMode === "controlled" ? "warning" : "default"}
                      variant={forwardMode === "controlled" ? "filled" : "outlined"}
                      onClick={() => setForwardMode("controlled")}
                      sx={{ fontWeight: 700 }}
                    />
                    <Chip
                      label="Cho phép tất cả"
                      size="small"
                      clickable
                      color={forwardMode === "allow" ? "success" : "default"}
                      variant={forwardMode === "allow" ? "filled" : "outlined"}
                      onClick={() => setForwardMode("allow")}
                      sx={{ fontWeight: 700 }}
                    />
                  </Stack>
                </Stack>
              </Box>

              {/* Rule 8: Escalation Ladder (Ban after warnings) */}
              <RuleRow
                icon={<Ban size={18} color="#dc2626" />}
                title="Thang xử lý lũy tiến (Auto-Ban Ladder)"
                desc={`Tự động cấm thành viên sau ${banAfterWarnings} lần cảnh báo trong thời hạn ${Number(banSeconds) / 3600} giờ.`}
                conditionChip={`Chạm mốc ${banAfterWarnings} cảnh báo`}
                actionChip={`Ban ${Number(banSeconds) / 3600}h`}
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
                    title: "Thang xử lý lũy tiến (Auto-Ban Ladder)",
                    desc: "Tự động cấm thành viên khi số lần cảnh báo vi phạm vượt quá ngưỡng.",
                    fields: [
                      { key: "ban_after_warnings", label: "Số lần cảnh báo tối đa trước khi Ban", type: "number", unit: "lần", hint: "Đặt 0 để tắt chế độ Auto-ban" },
                      { key: "ban_seconds", label: "Thời hạn cấm thành viên", type: "number", unit: "giây", hint: "vd: 86400 = 24 giờ, 604800 = 7 ngày" },
                    ],
                    values: {
                      ban_after_warnings: banAfterWarnings,
                      ban_seconds: banSeconds,
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
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Trình kiểm thử tin nhắn (Message Inspector)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Nhập thử nội dung chat để kiểm tra xem bot sẽ phản hồi như thế nào với cấu hình hiện tại.
                  </Typography>
                </Box>

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
                    Mô phỏng đặc tính tin nhắn:
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                    <Chip
                      label={testHasLink ? "Có chứa link (ON)" : "Không có link"}
                      clickable
                      color={testHasLink ? "primary" : "default"}
                      onClick={() => setTestHasLink((v) => !v)}
                      size="small"
                    />
                    <Chip
                      label={testHasButtons ? "Có inline buttons (ON)" : "Không có button"}
                      clickable
                      color={testHasButtons ? "error" : "default"}
                      onClick={() => setTestHasButtons((v) => !v)}
                      size="small"
                    />
                    <Chip
                      label={testIsForwarded ? "Tin forward (ON)" : "Tin viết trực tiếp"}
                      clickable
                      color={testIsForwarded ? "warning" : "default"}
                      onClick={() => setTestIsForwarded((v) => !v)}
                      size="small"
                    />
                    <Chip
                      label={`Gửi lặp lại: ${testRepeatCount} lần`}
                      clickable
                      color={testRepeatCount > 1 ? "secondary" : "default"}
                      onClick={() => setTestRepeatCount((c) => (c >= 5 ? 1 : c + 2))}
                      size="small"
                    />
                  </Stack>
                </Stack>

                <Divider />

                {/* Verdict Box */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                    Kết luận đánh giá từ Bot:
                  </Typography>
                  {sandboxAnalysis.isViolated ? (
                    <Alert severity="error" sx={{ borderRadius: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        🚨 PHÁT HIỆN VI PHẠM ({sandboxAnalysis.violations.length} lỗi)
                      </Typography>
                      <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                        {sandboxAnalysis.violations.map((v, i) => (
                          <Typography key={i} variant="caption" sx={{ display: "block" }}>
                            • <strong>{v.rule}</strong>: {v.detail} $\rightarrow$ <em>Action: {v.action}</em>
                          </Typography>
                        ))}
                      </Stack>
                      <Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>
                        ⚡ Hành vi trừng phạt tổng hợp: <code>{sandboxAnalysis.severeAction.toUpperCase()}</code>
                      </Typography>
                    </Alert>
                  ) : (
                    <Alert severity="success" sx={{ borderRadius: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        ✅ HỢP LỆ — Tin nhắn an toàn
                      </Typography>
                      <Typography variant="caption">
                        Không vi phạm bất kỳ bộ lọc chống spam, link ẩn hay blacklist nào. Bot sẽ cho qua bình thường.
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
                    Mô phỏng hiển thị trên Telegram
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Phản hồi thực tế trong nhóm
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
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Mẫu thông báo vi phạm của Bot
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Soạn tin nhắn bot sẽ gửi vào nhóm khi phát hiện hành vi spam, kèm các biến tự động thay thế.
              </Typography>
            </Box>

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
                      Biến hỗ trợ: <code>{`{user}`}</code>, <code>{`{chat}`}</code>, <code>{`{reason}`}</code>, <code>{`{count}`}</code>
                    </Typography>
                    <MuiButton
                      variant="outlined"
                      size="small"
                      startIcon={<Edit3 size={14} />}
                      onClick={() => {
                        const r = getRow("warning_text");
                        if (r) startEdit(r);
                      }}
                      sx={{ alignSelf: "flex-start", textTransform: "none" }}
                    >
                      Sửa mẫu tin này
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
                      Tin nhắn cảnh báo sẽ tự động biến mất sau {getVal("warning_notice_delete_seconds", "30")} giây để giữ group sạch sẽ.
                    </Typography>
                    <MuiButton
                      variant="outlined"
                      size="small"
                      startIcon={<Edit3 size={14} />}
                      onClick={() => {
                        const r = getRow("warning_notice_delete_seconds");
                        if (r) startEdit(r);
                      }}
                      sx={{ alignSelf: "flex-start", textTransform: "none" }}
                    >
                      Đổi thời gian tự xóa
                    </MuiButton>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        </Paper>
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
