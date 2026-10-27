"use client";

import { useMemo } from "react";
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowLeft,
  CheckCheck,
  ExternalLink,
  MoreVertical,
  Phone,
  Search,
  ShieldCheck,
  Smile,
  Paperclip,
  Mic,
} from "lucide-react";

export type TelegramButton = {
  label: string;
  url?: string;
  row?: number;
};

export type TelegramPhoneSimulatorProps = {
  groupName?: string;
  memberCount?: number | string;
  botName?: string;
  botUsername?: string;
  messageText: string;
  buttons?: TelegramButton[];
  buttonsText?: string;
  mediaUrl?: string;
  mediaType?: "photo" | "video";
  deleteAfterSeconds?: number;
  timestamp?: string;
  sampleUser?: string;
};

export default function TelegramPhoneSimulator({
  groupName = "Cộng Đồng Telegram",
  memberCount = "1,248 members",
  botName = "Cu Bot",
  botUsername = "@cu_assistant_bot",
  messageText,
  buttons = [],
  buttonsText = "",
  mediaUrl,
  mediaType = "photo",
  deleteAfterSeconds = 0,
  timestamp = "21:30",
  sampleUser = "@huynh_minh_nhut",
}: TelegramPhoneSimulatorProps) {
  // Parse buttonsText (label | url) if buttons array is empty
  const parsedButtons: TelegramButton[] = useMemo(() => {
    if (buttons && buttons.length > 0) {
      return buttons.filter((b) => b.label.trim());
    }
    if (!buttonsText || !buttonsText.trim()) return [];
    return buttonsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("|").map((p) => p.trim());
        return {
          label: parts[0] || "Nút bấm",
          url: parts[1] || "",
        };
      });
  }, [buttons, buttonsText]);

  // Replace placeholders for realistic preview
  const formattedText = useMemo(() => {
    if (!messageText) return "Chưa có nội dung tin nhắn. Hãy nhập nội dung bên cạnh để xem trước...";
    return messageText
      .replace(/{user}|{mention}/g, sampleUser)
      .replace(/{group}|{group_name}/g, groupName)
      .replace(/{user_id}/g, "123456789")
      .replace(/{group_id}/g, "-100192837465")
      .replace(/{reason}/g, "Spam nội dung vi phạm")
      .replace(/{count}/g, "1")
      .replace(/{limit}/g, "3");
  }, [messageText, sampleUser, groupName]);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 380,
        mx: "auto",
        borderRadius: "36px",
        p: "12px",
        bgcolor: "#1e293b",
        boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        position: "relative",
      }}
    >
      {/* Phone Notch / Speaker */}
      <Box
        sx={{
          width: 120,
          height: 18,
          bgcolor: "#0f172a",
          borderRadius: "0 0 12px 12px",
          position: "absolute",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Box sx={{ width: 40, height: 4, bgcolor: "#334155", borderRadius: "99px" }} />
        <Box sx={{ width: 8, height: 8, bgcolor: "#1e293b", borderRadius: "50%" }} />
      </Box>

      {/* Phone Screen Container */}
      <Box
        sx={{
          borderRadius: "28px",
          overflow: "hidden",
          bgcolor: "#0e1621",
          display: "flex",
          flexDirection: "column",
          height: 580,
          border: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* Telegram App Header */}
        <Box
          sx={{
            pt: 3.5,
            pb: 1.25,
            px: 1.5,
            bgcolor: "#17212b",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(0, 0, 0, 0.2)",
            color: "#ffffff",
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
            <ArrowLeft size={20} color="#708499" />
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                bgcolor: "#2481cc",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                fontSize: "1rem",
                color: "#ffffff",
                flexShrink: 0,
              }}
            >
              {groupName.charAt(0).toUpperCase()}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                noWrap
                sx={{ fontWeight: 700, color: "#f5f5f5", fontSize: "0.9rem", lineHeight: 1.2 }}
              >
                {groupName}
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{ color: "#708499", fontSize: "0.75rem", display: "block" }}
              >
                {typeof memberCount === "number" ? `${memberCount.toLocaleString()} members` : memberCount}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.5} sx={{ color: "#708499" }}>
            <MoreVertical size={18} />
          </Stack>
        </Box>

        {/* Telegram Chat Wallpaper Area */}
        <Box
          sx={{
            flex: 1,
            p: 1.5,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(36, 129, 204, 0.06), transparent 70%),
              linear-gradient(180deg, #0e1621 0%, #0a0f18 100%)`,
            position: "relative",
          }}
        >
          {/* Day / Date Separator Badge */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <Chip
              size="small"
              label="Hôm nay"
              sx={{
                bgcolor: "rgba(0, 0, 0, 0.35)",
                color: "#94a3b8",
                fontSize: "0.72rem",
                height: 22,
                backdropFilter: "blur(4px)",
              }}
            />
          </Box>

          {/* Service Join Message */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
            <Chip
              size="small"
              label={`${sampleUser} đã tham gia nhóm`}
              sx={{
                bgcolor: "rgba(0, 0, 0, 0.3)",
                color: "#cbd5e1",
                fontSize: "0.75rem",
                height: 24,
                borderRadius: "12px",
              }}
            />
          </Box>

          {/* Bot Chat Bubble */}
          <Box sx={{ maxWidth: "90%", alignSelf: "flex-start", mb: 1 }}>
            {/* Bubble Header: Bot Avatar + Name */}
            <Stack direction="row" spacing={1} sx={{ alignItems: "flex-end", mb: 0.5 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  bgcolor: "#00b4d8",
                  display: "grid",
                  placeItems: "center",
                  color: "#ffffff",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                🤖
              </Box>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                <Typography sx={{ color: "#45a2e5", fontWeight: 700, fontSize: "0.82rem" }}>
                  {botName}
                </Typography>
                <Chip
                  size="small"
                  label="BOT"
                  sx={{
                    height: 16,
                    fontSize: "0.62rem",
                    bgcolor: "rgba(69, 162, 229, 0.2)",
                    color: "#45a2e5",
                    fontWeight: 800,
                    borderRadius: "4px",
                    px: 0.25,
                  }}
                />
              </Stack>
            </Stack>

            {/* Bubble Body */}
            <Paper
              elevation={0}
              sx={{
                bgcolor: "#182533",
                color: "#f5f5f5",
                borderRadius: "14px 14px 14px 4px",
                p: 1.5,
                border: "1px solid rgba(255, 255, 255, 0.06)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
              }}
            >
              {/* Optional Media Preview */}
              {mediaUrl ? (
                <Box
                  sx={{
                    width: "100%",
                    height: 140,
                    borderRadius: "8px",
                    overflow: "hidden",
                    mb: 1,
                    bgcolor: "#242f3d",
                    backgroundImage: `url(${mediaUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              ) : null}

              {/* Message Content */}
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.55,
                  fontSize: "0.85rem",
                  wordBreak: "break-word",
                  color: "#f1f5f9",
                }}
              >
                {formattedText}
              </Typography>

              {/* Timestamp & Auto-delete Indicator */}
              <Stack
                direction="row"
                spacing={0.75}
                sx={{
                  justifyContent: "flex-end",
                  alignItems: "center",
                  mt: 0.75,
                  color: "#708499",
                }}
              >
                {deleteAfterSeconds > 0 ? (
                  <Typography variant="caption" sx={{ fontSize: "0.68rem", color: "#f59e0b" }}>
                    ⏱️ tự xóa sau {deleteAfterSeconds}s
                  </Typography>
                ) : null}
                <Typography variant="caption" sx={{ fontSize: "0.7rem", color: "#708499" }}>
                  {timestamp}
                </Typography>
                <CheckCheck size={14} color="#45a2e5" />
              </Stack>
            </Paper>

            {/* Inline Keyboard Buttons Grid */}
            {parsedButtons.length > 0 ? (
              <Box sx={{ mt: 0.75, display: "grid", gap: 0.5 }}>
                {parsedButtons.map((btn, index) => (
                  <Box
                    key={`${btn.label}-${index}`}
                    component="a"
                    href={btn.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.75,
                      py: 0.8,
                      px: 1.5,
                      bgcolor: "rgba(43, 82, 120, 0.45)",
                      "&:hover": {
                        bgcolor: "rgba(43, 82, 120, 0.7)",
                      },
                      color: "#64b5f6",
                      borderRadius: "8px",
                      textDecoration: "none",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      backdropFilter: "blur(6px)",
                      border: "1px solid rgba(100, 181, 246, 0.2)",
                      transition: "all 0.15s ease",
                      textAlign: "center",
                    }}
                  >
                    <span>{btn.label}</span>
                    {btn.url ? <ExternalLink size={13} style={{ opacity: 0.7 }} /> : null}
                  </Box>
                ))}
              </Box>
            ) : null}
          </Box>
        </Box>

        {/* Telegram Simulated Bottom Input Bar */}
        <Box
          sx={{
            py: 1,
            px: 1.25,
            bgcolor: "#17212b",
            borderTop: "1px solid rgba(0, 0, 0, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Smile size={20} color="#708499" />
          <Box
            sx={{
              flex: 1,
              bgcolor: "#242f3d",
              borderRadius: "18px",
              px: 1.5,
              py: 0.6,
              color: "#708499",
              fontSize: "0.82rem",
            }}
          >
            Nhập tin nhắn...
          </Box>
          <Paperclip size={18} color="#708499" />
          <Mic size={18} color="#708499" />
        </Box>
      </Box>
    </Box>
  );
}
