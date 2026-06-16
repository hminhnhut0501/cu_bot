# `app/components/ui/` — base components

Light-themed MUI wrappers for the control panel. These are the **only**
components allowed to use the design system palette, shape, and shadow
tokens. The rest of the app imports them as plain MUI components.

All components:

- Use `sx` prop + the `theme` from `app/theme.ts`. **No styled-components,
  no `emotion` `styled()`, no className from the old `globals.css`.**
- Are typed in TypeScript with explicit prop types.
- Default-export a single React component.
- Render on a clean-light surface (`#ffffff` paper, `#f6f8fb` background).

## Index

| File | Replaces (legacy class) | Purpose |
|---|---|---|
| `Section.tsx` | `.audit-console`, `.bulk-panel`, `.editor-panel`, `.config-center`, `.menu-policy-console`, `.scam-inbox`, `.channel-console`, `.metrics-dashboard`, `.task-workbench`, `.hero-panel`, `.schedule-wizard`, `.bot-context`, `.plugin-manager`, `.layer-workbench`, `.module-workbench`, `.ops-task-board`, `.scam-review-detail`, `.module-page`, `.module-panel`, `.login-shell`, `.login-panel`, `.module-screen`, `.workbench-detail-stack`, `.config-section`, `.setting-tile` | Wrapper Paper with eyebrow + title + subtitle + actions |
| `StatCard.tsx` | `.metric-card`, `.metric-group`, `.status-card`, `.compact-value`, `<article>` in `.overview-compact` / `.overview-work-grid`, `<span>` in `.audit-console-stats` / `.scam-inbox-stats`, `.meta-pill` | Compact numeric / status card |
| `EmptyState.tsx` | `.empty-state`, `.command-empty`, `.workbench-empty`, `.metrics-empty`, `.overview-log-empty`, `.module-empty-focus` | Centered icon + title + body + optional CTA |
| `PageHeader.tsx` | `.topbar`, `.brand`, `.bot-context`, `.scope-bar`, `.scope-breadcrumb` | Top of a screen with breadcrumbs + actions |
| `LoadingScreen.tsx` | `.loading` | Full-page or in-section spinner |
| `ErrorAlert.tsx` | `.alert` (error), `.advanced-warning`, `.context-alert` (error) | Inline error banner (MUI `Alert`) |
| `SuccessAlert.tsx` | `.alert` (success), `.floating-toast` (success) | Inline success banner |
| `NavSidebar.tsx` | `.sidebar`, `<nav>` block, `.nav-group`, `.nav-unlock` | MUI Drawer + grouped List nav |
| `TabsBar.tsx` | `.config-tabs`, `.channel-tabs`, `.group-editor-tabs`, `.layer-links`, `.module-quick-nav`, `.quick-filter-bar`, `.module-tabs` | MUI Tabs wrapper with icon + badge support |
| `KeyValue.tsx` | `<div><b>label</b>value</div>` inside `.inspector-grid`, `.setting-tile`, `.config-section`, `.meta-grid`, `.diagnostic-grid` | Labelled field row, stacked or inline |

## Usage examples

```tsx
import Section from "@/app/components/ui/Section";
import StatCard from "@/app/components/ui/StatCard";
import PageHeader from "@/app/components/ui/PageHeader";
import TabsBar from "@/app/components/ui/TabsBar";
import NavSidebar from "@/app/components/ui/NavSidebar";
import { ErrorAlert, SuccessAlert } from "@/app/components/ui/...";
import EmptyState from "@/app/components/ui/EmptyState";
import LoadingScreen from "@/app/components/ui/LoadingScreen";
import KeyValue from "@/app/components/ui/KeyValue";

// Section with a single stat
<Section
  eyebrow="Hoạt động"
  title="Tổng quan hệ thống"
  subtitle="Số liệu cập nhật theo thời gian thực"
  actions={<Button variant="outlined" size="small">Làm mới</Button>}
>
  <StatCard
    label="Bot hoạt động"
    value={42}
    hint="Đã bật trong 24h qua"
    tone="primary"
  />
</Section>

// Page header
<PageHeader
  icon={<Bot size={20} />}
  title="Quản lý scam"
  subtitle="Hàng chờ báo cáo scam của bot Cu"
  breadcrumbs="Trang chủ / Vận hành / Scam"
  actions={
    <>
      <Button variant="outlined" size="small">Lọc</Button>
      <Button variant="contained" size="small">Xử lý tất cả</Button>
    </>
  }
/>

// Tabs
<TabsBar
  value={activeTab}
  onChange={setActiveTab}
  items={[
    { key: "queue", label: "Hàng chờ" },
    { key: "scheduled", label: "Đã lên lịch", badge: <Chip size="small" label="3" /> },
    { key: "sent", label: "Đã gửi" },
  ]}
/>

// Sidebar
<NavSidebar
  open
  variant="permanent"
  activeKey={activeKey}
  onSelect={setActiveKey}
  groups={[
    { key: "ops", title: "Vận hành", items: [
      { key: "overview", label: "Tổng quan", icon: <Activity size={16} /> },
    ]},
    { key: "tools", title: "Công cụ", muted: true, items: [
      { key: "scam", label: "Scam", icon: <ShieldCheck size={16} />, disabled: true },
    ]},
  ]}
  header={<Logo />}
/>
```

## Design tokens

The single source of truth is `app/theme.ts`. Components import
`tokens` from there when they need raw values (e.g. border-radius
inside a `sx` string). Most styling goes through MUI theme overrides.

| Token | Value | Use |
|---|---|---|
| `tokens.color.bg` | `#f6f8fb` | `background.default` |
| `tokens.color.paper` | `#ffffff` | Paper / Card |
| `tokens.color.surface` | `#f1f4f9` | Hover / inset wells |
| `tokens.color.line` | `#e5e7eb` | Default border |
| `tokens.color.primary` | `#0f766e` | Accent |
| `tokens.color.primaryDark` | `#115e59` | Accent hover |
| `tokens.color.primarySoft` | `#ccfbf1` | Filled-Chip / soft alert bg |
| `tokens.radius.sm` | `6` | Buttons, chips, inputs |
| `tokens.radius.md` | `10` | Paper, Card, Section |
| `tokens.radius.lg` | `14` | Dialog, Drawer |
| `tokens.shadow.sm` | `0 1px 2px rgba(15,23,42,0.05)` | `elevation={1}` |
| `tokens.shadow.md` | `0 4px 12px rgba(15,23,42,0.06)` | Hover |
| `tokens.shadow.lg` | `0 16px 40px rgba(15,23,42,0.08)` | Dialog, floating toast |
