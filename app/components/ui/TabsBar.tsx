"use client";

import { alpha, useTheme } from "@mui/material/styles";
import { Box, Tab, Tabs } from "@mui/material";
import type { ReactNode } from "react";

export type TabItem = {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  badge?: ReactNode;
};

export type TabsBarProps = {
  items: TabItem[];
  value: string;
  onChange: (key: string) => void;
  /** Layout direction */
  orientation?: "horizontal" | "vertical";
  /** Use `scrollable` for many tabs (horizontal only) */
  scrollable?: boolean;
  /** Add a small wrapper Box (e.g. border-bottom) */
  wrapped?: boolean;
  /** Visual style */
  tone?: "standard" | "pill" | "filled" | "tonal" | "outlined";
  sx?: object;
};

/**
 * Standard tab bar.
 *
 * Replaces:
 * - `.config-tabs` (button group)
 * - `.channel-tabs`
 * - `.group-editor-tabs`
 * - `.layer-links`
 * - `.module-quick-nav`
 * - `.quick-filter-bar`
 * - `.module-tabs`
 */
export default function TabsBar({
  items,
  value,
  onChange,
  orientation = "horizontal",
  scrollable = false,
  wrapped = true,
  tone = "outlined",
  sx,
}: TabsBarProps) {
  const theme = useTheme();
  const visual = tone === "standard" ? "outlined" : tone === "pill" ? "filled" : tone;
  const isFilled = visual === "filled";
  const isTonal = visual === "tonal";
  const isOutlined = visual === "outlined";
  const tonalSelectedBg = alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.22 : 0.12);
  const tonalSelectedHoverBg = alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.3 : 0.18);
  const currentIndex = Math.max(
    0,
    items.findIndex((item) => item.key === value),
  );

  const tabs = (
    <Tabs
      value={currentIndex}
      onChange={(_event, index) => {
        const next = items[index];
        if (next && !next.disabled) onChange(next.key);
      }}
      orientation={orientation}
      variant={scrollable ? "scrollable" : "standard"}
      scrollButtons={scrollable ? "auto" : false}
      sx={{
        minHeight: isFilled || isTonal ? 0 : undefined,
        ...(isFilled || isTonal
          ? {
              "& .MuiTabs-indicator": {
                display: "none",
              },
              "& .MuiTab-root": {
                minHeight: 40,
                px: 1.6,
                py: 0.8,
                borderRadius: 999,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: isTonal ? "background.default" : "background.paper",
                color: "text.secondary",
                fontWeight: 700,
                textTransform: "none",
                letterSpacing: 0,
                boxShadow: "none",
                transition: "all 160ms ease",
              },
              "& .MuiTab-root.Mui-selected": {
                bgcolor: isTonal ? tonalSelectedBg : "primary.main",
                color: isTonal ? "primary.main" : "primary.contrastText",
                borderColor: "primary.main",
                boxShadow: isTonal ? "none" : "0 8px 20px rgba(15, 118, 110, 0.18)",
              },
              "& .MuiTab-root:hover": {
                bgcolor: "background.default",
              },
              "& .MuiTab-root.Mui-selected:hover": {
                bgcolor: isTonal ? tonalSelectedHoverBg : "primary.dark",
              },
            }
          : {}),
        ...sx,
      }}
    >
      {items.map((item) => (
        <Tab
          key={item.key}
          disabled={item.disabled}
          label={
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
              {item.icon}
              <span>{item.label}</span>
              {item.badge}
            </Box>
          }
        />
      ))}
    </Tabs>
  );

  if (!wrapped) return tabs;

  return (
    <Box
      sx={{
        borderBottom: orientation === "horizontal" && isOutlined ? "1px solid" : "none",
        borderRight: orientation === "vertical" ? "1px solid" : "none",
        borderColor: "divider",
        ...(isFilled || isTonal
          ? {
              p: 1,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 999,
              bgcolor: isTonal ? "background.default" : "background.paper",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
            }
          : {}),
      }}
    >
      {tabs}
    </Box>
  );
}
