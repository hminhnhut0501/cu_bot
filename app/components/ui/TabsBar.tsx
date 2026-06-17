"use client";

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
  tone?: "standard" | "pill";
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
  tone = "standard",
  sx,
}: TabsBarProps) {
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
        minHeight: tone === "pill" ? 0 : undefined,
        ...(tone === "pill"
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
                bgcolor: "background.paper",
                color: "text.secondary",
                fontWeight: 700,
                textTransform: "none",
                letterSpacing: 0,
                boxShadow: "none",
                transition: "all 160ms ease",
              },
              "& .MuiTab-root.Mui-selected": {
                bgcolor: "primary.main",
                color: "primary.contrastText",
                borderColor: "primary.main",
                boxShadow: "0 8px 20px rgba(15, 118, 110, 0.18)",
              },
              "& .MuiTab-root:hover": {
                bgcolor: "background.default",
              },
              "& .MuiTab-root.Mui-selected:hover": {
                bgcolor: "primary.dark",
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
        borderBottom: orientation === "horizontal" && tone === "standard" ? "1px solid" : "none",
        borderRight: orientation === "vertical" ? "1px solid" : "none",
        borderColor: "divider",
        ...(tone === "pill"
          ? {
              p: 1,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 999,
              bgcolor: "rgba(255,255,255,0.72)",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
            }
          : {}),
      }}
    >
      {tabs}
    </Box>
  );
}
