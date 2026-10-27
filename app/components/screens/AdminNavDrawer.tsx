"use client";

import {
  Box,
  Button as MuiButton,
  Drawer,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Database, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
          p: sidebarCollapsed ? 1.25 : 2,
          transition: "width 180ms ease, padding 180ms ease",
          overflowX: "hidden",
        },
      }}
    >
      <Stack spacing={2} sx={{ minHeight: "100%" }}>
        <Paper variant="outlined" sx={{ p: sidebarCollapsed ? 1.25 : 2, bgcolor: "background.default" }}>
          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0 }}>
                <Box sx={{ width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: 1, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", flexShrink: 0 }}>
                  <Database size={20} />
                </Box>
                {!sidebarCollapsed ? (
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ lineHeight: 1.1, fontWeight: 800 }}>Cu Bot OS</Typography>
                    <Typography variant="caption" color="text.secondary">Ops center</Typography>
                  </Box>
                ) : null}
              </Stack>
              <IconButton onClick={() => setSidebarCollapsed((current) => !current)} title={sidebarCollapsed ? "Mở sidebar" : "Thu sidebar"}>
                {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </IconButton>
            </Stack>
          </Stack>
        </Paper>
        <Stack spacing={1.5} component="nav" sx={{ flex: 1 }}>
          {[
            ["Tổng quan", CORE_LAYERS.filter((layer) => layer.navSection === "Tổng quan")],
            ["Vận hành", CORE_LAYERS.filter((layer) => layer.navSection === "Vận hành").filter((layer) => ["bot", "group", "modules", "logs", "analytics", "members", "blacklist"].includes(layer.key))],
            ["Modules", allModuleLayers.filter((layer) => ["moderation", "automation", "welcome", "auto_reply", "anti_scam", "channel_publisher", "share_unlock"].includes(layer.moduleKey || ""))],
            ["Khác", advancedLayer ? [advancedLayer] : []],
          ].map(([title, layers]) => (
            <Stack key={String(title)} spacing={0.75}>
              {!sidebarCollapsed ? <Typography variant="overline" color="text.secondary">{String(title)}</Typography> : null}
              {(layers as any[]).map((layer) => {
                const LayerIcon = layer.icon;
                const moduleOff = "isOn" in layer && layer.isOn === false;
                const locked = layer.key === "advanced" && !advancedUnlocked;
                const active = layer.key === activeLayer;
                return (
                  <MuiButton
                    key={layer.key}
                    fullWidth
                    variant={active ? "contained" : "text"}
                    color={active ? "primary" : "inherit"}
                    disabled={locked}
                    onClick={() => {
                      if (locked) return;
                      if ("moduleKey" in layer && layer.moduleKey) {
                        if (moduleOff) return;
                        openModuleConfigure(String(layer.moduleKey));
                        return;
                      }
                      selectLayer(layer.key);
                    }}
                    startIcon={<LayerIcon size={17} />}
                    sx={{
                      justifyContent: sidebarCollapsed ? "center" : "flex-start",
                      opacity: moduleOff ? 0.46 : 1,
                      pointerEvents: locked ? "none" : "auto",
                      px: sidebarCollapsed ? 1 : undefined,
                      minWidth: 0,
                      "& .MuiButton-startIcon": {
                        marginRight: sidebarCollapsed ? 0 : 1,
                        marginLeft: sidebarCollapsed ? 0 : undefined,
                      },
                    }}
                  >
                    {!sidebarCollapsed ? (
                      <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>{layer.shortTitle}</Box>
                    ) : null}
                  </MuiButton>
                );
              })}
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Drawer>
  );
}
