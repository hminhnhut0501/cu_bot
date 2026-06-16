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
      sx={sx}
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
        borderBottom: orientation === "horizontal" ? "1px solid" : "none",
        borderRight: orientation === "vertical" ? "1px solid" : "none",
        borderColor: "divider",
      }}
    >
      {tabs}
    </Box>
  );
}
