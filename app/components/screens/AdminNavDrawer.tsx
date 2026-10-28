"use client";

import { useMemo } from "react";
import {
  Box,
  Button as MuiButton,
  Chip,
  Drawer,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Activity,
  Bot,
  Boxes,
  Database,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
  BarChart3,
  MessageSquareText,
  Clock,
  Trophy,
  Share2,
} from "lucide-react";
import { CORE_LAYERS } from "@/lib/cp-constants";

export type AdminNavDrawerProps = {
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  advancedUnlocked: boolean;
  activeLayer: string;
  openModuleConfigure: (moduleKey: string) => void;
  selectLayer: (key: string) => void;
  allModuleLayers: any[];
  advancedLayer?: any;
};

export default function AdminNavDrawer({
  sidebarWidth,
  sidebarCollapsed,
  setSidebarCollapsed,
  advancedUnlocked,
  activeLayer,
  openModuleConfigure,
  selectLayer,
  allModuleLayers,
  advancedLayer,
}: AdminNavDrawerProps) {
  const navSections = useMemo(() => {
    return [
      {
        title: "TỔNG QUAN",
        items: [
          CORE_LAYERS.find((l) => l.key === "overview"),
          CORE_LAYERS.find((l) => l.key === "analytics"),
          CORE_LAYERS.find((l) => l.key === "logs"),
        ].filter(Boolean),
      },
      {
        title: "AN NINH & BẢO VỆ",
        items: [
          allModuleLayers.find((l) => l.moduleKey === "moderation"),
          allModuleLayers.find((l) => l.moduleKey === "anti_scam"),
          CORE_LAYERS.find((l) => l.key === "blacklist"),
        ].filter(Boolean),
      },
      {
        title: "CỘNG ĐỒNG & THÀNH VIÊN",
        items: [
          CORE_LAYERS.find((l) => l.key === "members"),
          allModuleLayers.find((l) => l.moduleKey === "welcome"),
          allModuleLayers.find((l) => l.moduleKey === "share_unlock"),
        ].filter(Boolean),
      },
      {
        title: "NỘI DUNG & TƯƠNG TÁC",
        items: [
          allModuleLayers.find((l) => l.moduleKey === "channel_publisher"),
          allModuleLayers.find((l) => l.moduleKey === "automation"),
          allModuleLayers.find((l) => l.moduleKey === "auto_reply"),
          allModuleLayers.find((l) => l.moduleKey === "entertainment"),
        ].filter(Boolean),
      },
      {
        title: "HỆ THỐNG",
        items: [
          CORE_LAYERS.find((l) => l.key === "bot"),
          CORE_LAYERS.find((l) => l.key === "group"),
          CORE_LAYERS.find((l) => l.key === "modules"),
          advancedLayer ? advancedLayer : null,
        ].filter(Boolean),
      },
    ];
  }, [allModuleLayers, advancedLayer]);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: sidebarWidth,
        flexShrink: 0,
        display: { xs: "none", md: "block" },
        "& .MuiDrawer-paper": {
          width: sidebarWidth,
          boxSizing: "border-box",
          borderRight: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          p: sidebarCollapsed ? 1 : 1.75,
          transition: "width 180ms ease, padding 180ms ease",
          overflowX: "hidden",
        },
      }}
    >
      <Stack spacing={2} sx={{ minHeight: "100%" }}>
        {/* Brand header card */}
        <Paper
          variant="outlined"
          sx={{
            p: sidebarCollapsed ? 1 : 1.5,
            bgcolor: "background.default",
            borderRadius: 2,
          }}
        >
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 1.5,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(15, 118, 110, 0.25)",
                }}
              >
                <Database size={18} />
              </Box>
              {!sidebarCollapsed && (
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ lineHeight: 1.2, fontWeight: 800, letterSpacing: "-0.01em" }}>
                    CU BOT OS
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: "0.7rem" }}>
                    <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "success.main" }} />
                    Ops Center v2.4
                  </Typography>
                </Box>
              )}
            </Stack>
            <IconButton
              size="small"
              onClick={() => setSidebarCollapsed((current) => !current)}
              title={sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
              sx={{ color: "text.secondary" }}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </IconButton>
          </Stack>
        </Paper>

        {/* 4 Logical Business Nav Sections */}
        <Stack spacing={2} component="nav" sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", pr: 0.25 }}>
          {navSections.map(({ title, items }) => (
            <Stack key={title} spacing={0.5}>
              {!sidebarCollapsed && (
                <Typography
                  variant="overline"
                  sx={{
                    px: 1,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "text.secondary",
                    opacity: 0.8,
                  }}
                >
                  {title}
                </Typography>
              )}

              {items.map((layer: any) => {
                const LayerIcon = layer.icon || Layers;
                const isModule = Boolean(layer.moduleKey);
                const moduleOff = "isOn" in layer && layer.isOn === false;
                const locked = layer.key === "advanced" && !advancedUnlocked;
                const active =
                  activeLayer === layer.key ||
                  (isModule && activeLayer === `module:${layer.moduleKey}`);

                const btn = (
                  <MuiButton
                    key={layer.key}
                    fullWidth
                    disabled={locked}
                    onClick={() => {
                      if (locked) return;
                      if (isModule && layer.moduleKey) {
                        if (moduleOff) return;
                        openModuleConfigure(String(layer.moduleKey));
                        return;
                      }
                      selectLayer(layer.key);
                    }}
                    startIcon={<LayerIcon size={16} />}
                    sx={{
                      justifyContent: sidebarCollapsed ? "center" : "flex-start",
                      minWidth: 0,
                      height: 38,
                      borderRadius: 1.5,
                      textTransform: "none",
                      fontSize: "0.83rem",
                      fontWeight: active ? 700 : 500,
                      color: active ? "primary.main" : "text.secondary",
                      bgcolor: active ? "action.selected" : "transparent",
                      borderLeft: active ? "3px solid" : "3px solid transparent",
                      borderLeftColor: active ? "primary.main" : "transparent",
                      px: sidebarCollapsed ? 0.75 : 1.25,
                      opacity: moduleOff ? 0.45 : 1,
                      pointerEvents: locked ? "none" : "auto",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        bgcolor: active ? "action.selected" : "action.hover",
                        color: active ? "primary.main" : "text.primary",
                      },
                      "& .MuiButton-startIcon": {
                        marginRight: sidebarCollapsed ? 0 : 1.25,
                        marginLeft: 0,
                        color: active ? "primary.main" : "text.secondary",
                      },
                    }}
                  >
                    {!sidebarCollapsed && (
                      <Box
                        component="span"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                          textAlign: "left",
                        }}
                      >
                        {layer.shortTitle || layer.title}
                      </Box>
                    )}
                    {!sidebarCollapsed && moduleOff && (
                      <Chip label="OFF" size="small" sx={{ height: 16, fontSize: "0.62rem", opacity: 0.6 }} />
                    )}
                  </MuiButton>
                );

                if (sidebarCollapsed) {
                  return (
                    <Tooltip key={layer.key} title={layer.shortTitle || layer.title} placement="right" arrow>
                      <Box>{btn}</Box>
                    </Tooltip>
                  );
                }
                return btn;
              })}
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Drawer>
  );
}
