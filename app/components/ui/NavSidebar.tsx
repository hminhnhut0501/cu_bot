"use client";

import {
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";

export type NavItem = {
  key: string;
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
  group?: string;
};

export type NavGroup = {
  key: string;
  title?: string;
  items: NavItem[];
  muted?: boolean;
};

export type NavSidebarProps = {
  open: boolean;
  onClose: () => void;
  /** Width in px, default 280 */
  width?: number;
  /** Permanent (desktop) vs temporary (mobile) */
  variant?: "permanent" | "persistent" | "temporary";
  items: NavItem[];
  groups?: NavGroup[];
  activeKey?: string;
  onSelect: (key: string) => void;
  /** Top-of-drawer content (logo, bot switcher) */
  header?: ReactNode;
  /** Bottom-of-drawer content (env status, logout) */
  footer?: ReactNode;
};

/**
 * Light sidebar built on MUI Drawer + List.
 *
 * Replaces `.sidebar` + the inline `<nav>` element in `app/page.tsx`,
 * `.nav-group`, `.nav-group-muted`, `.nav-unlock`, and the bot-switcher
 * block in `.topbar`. The component renders groups with section titles
 * and individual items with optional icons and badges.
 */
export default function NavSidebar({
  open,
  onClose,
  width = 280,
  variant = "persistent",
  items,
  groups,
  activeKey,
  onSelect,
  header,
  footer,
}: NavSidebarProps) {
  const paperSx = {
    width,
    boxSizing: "border-box",
    borderRight: "1px solid",
    borderColor: "divider",
    backgroundColor: "background.paper",
    backgroundImage: "linear-gradient(180deg, rgba(15, 118, 110, 0.03), transparent 18%)",
  };

  const content = (
    <Stack sx={{ height: "100%" }} spacing={0}>
      {header ? (
        <Box sx={{ p: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>{header}</Box>
      ) : null}

      <Box sx={{ flex: 1, overflowY: "auto", py: 1 }}>
        {groups && groups.length > 0
          ? groups.map((group, groupIdx) => (
                <Box
                  key={group.key}
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    opacity: group.muted ? 0.6 : 1,
                  }}
                >
                {group.title ? (
                  <Typography
                    variant="overline"
                    color={group.muted ? "text.disabled" : "text.secondary"}
                    sx={{ display: "block", px: 1, mb: 0.75, letterSpacing: "0.11em" }}
                  >
                    {group.title}
                  </Typography>
                ) : null}
                <List dense disablePadding>
                  {group.items.map((item) => (
                    <ListItem key={item.key} disablePadding sx={{ mb: 0.25 }}>
                      <ListItemButton
                        selected={activeKey === item.key}
                        disabled={item.disabled}
                        onClick={() => {
                          if (item.disabled) return;
                          onSelect(item.key);
                          if (variant === "temporary") onClose();
                        }}
                        sx={{
                          borderRadius: 1.5,
                          px: 1.25,
                          py: 1,
                          "&.Mui-selected": {
                            boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)",
                          },
                        }}
                      >
                        {item.icon ? (
                          <ListItemIcon sx={{ minWidth: 28, color: "inherit" }}>
                            {item.icon}
                          </ListItemIcon>
                        ) : null}
                          <ListItemText
                          primary={item.label}
                          slotProps={{
                            primary: {
                              sx: {
                                fontSize: "0.8125rem",
                                fontWeight: activeKey === item.key ? 700 : 600,
                                letterSpacing: "-0.01em",
                              },
                            },
                          }}
                        />
                        {item.badge ? (
                          <Box sx={{ ml: 1, color: "text.secondary" }}>{item.badge}</Box>
                        ) : null}
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
                {groupIdx < groups.length - 1 ? <Divider sx={{ my: 0.5 }} /> : null}
              </Box>
            ))
          : null}

        {items && items.length > 0 ? (
          <Box sx={{ px: 1.5, py: 1 }}>
            <List dense disablePadding>
              {items.map((item) => (
                <ListItem key={item.key} disablePadding sx={{ mb: 0.25 }}>
                  <ListItemButton
                    selected={activeKey === item.key}
                    disabled={item.disabled}
                    onClick={() => {
                      if (item.disabled) return;
                      onSelect(item.key);
                      if (variant === "temporary") onClose();
                    }}
                    sx={{
                      borderRadius: 1.5,
                      px: 1.25,
                      py: 1,
                      "&.Mui-selected": {
                        boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)",
                      },
                    }}
                  >
                    {item.icon ? (
                      <ListItemIcon sx={{ minWidth: 28, color: "inherit" }}>
                        {item.icon}
                      </ListItemIcon>
                    ) : null}
                    <ListItemText
                      primary={item.label}
                      slotProps={{ primary: { sx: { fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "-0.01em" } } }}
                    />
                    {item.badge ? (
                      <Box sx={{ ml: 1, color: "text.secondary" }}>{item.badge}</Box>
                    ) : null}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        ) : null}
      </Box>

      {footer ? (
        <Box sx={{ p: 1.5, borderTop: "1px solid", borderColor: "divider" }}>{footer}</Box>
      ) : null}
    </Stack>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: paperSx } }}
      sx={{ width: open ? width : 0, flexShrink: 0, "& .MuiDrawer-paper": paperSx }}
    >
      {content}
    </Drawer>
  );
}
