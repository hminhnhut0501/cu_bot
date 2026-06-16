# UI Audit — Control Panel (pre-design-system)

Repo: `/Users/hminhnhut/Cu_bot`
Branch: `main`
Audit date: 2026-06-16

This file is the deliverable for the "audit" step. The next task will
reference this list when refactoring `app/page.tsx` and
`app/components/module-screens.tsx` to use the new `app/components/ui/*`
base components.

## 1. Inventory

| File | Lines | `className=` count | Unique classes |
|---|---|---|---|
| `app/globals.css` | 5.696 | n/a | 277 top-level selectors |
| `app/page.tsx` | 5.643 | 139 | 90 |
| `app/components/module-screens.tsx` | 294 | 15 | 9 |

### 1.1 Dark-surface override block in `globals.css`

The most damaging block is at `app/globals.css:32-181` (legacy dark
overrides) plus `app/globals.css:126-181` (the `!important` "hard-stop"
block). It forces `#111821` / `#0f1620` background on:

* `.overview-compact`, `.overview-work-grid`, `.overview-log-panel`
* `.layer-workbench`, `.task-outcome-strip`
* `.audit-console`, `.channel-console`, `.menu-policy-console`
* `.config-center`, `.config-closed-state`
* `.bulk-panel`, `.editor-panel`, `.content-grid .list-panel`
* `.workbench-detail-stack`, `.module-workbench`
* `.metrics-dashboard`, `.scam-inbox`
* `.menu-control-card`, `.menu-control-rows article`
* `.metric-card`, `.metric-group`
* `.channel-post-card`, `.channel-preview`
* `.config-section`, `.setting-tile`
* `.module-screen`, `.module-screen-mini`, `.module-screen-head`
* `.review-queue-preview article`, `.policy-summary-grid article`

This is the **direct cause of the user's "lệch UI" complaint** — even
though the MUI theme is dark with primary `#00b8d9`, several `<section
className="...">` fragments still pull in these classes, so the rest of
the page surfaces stay dark teal while the new theme is supposed to be
clean-light.

### 1.2 Class taxonomy in `app/page.tsx`

A. **Component-shaped** (whole "panels" or "screens" — these become MUI
   `<Section>` / `<StatCard>` / `Paper`):
   * `overview-compact`, `overview-work-grid`, `overview-log-panel`
   * `audit-console`, `audit-console-stats`
   * `channel-console`, `channel-post-card`, `channel-preview`
   * `menu-policy-console`, `menu-policy-grid`, `menu-policy-hero`,
     `menu-policy-status`
   * `config-center`, `config-section`, `config-tabs`, `config-quick-strip`
   * `bulk-panel`, `editor-panel`, `list-panel`, `content-grid`
   * `metric-card`, `metric-cards`, `metric-group`, `metric-groups`,
     `metric-icon`, `metrics-dashboard`, `metrics-empty`, `metrics-head`
   * `task-workbench`, `task-outcome-strip`, `task-workbench-hero`,
     `task-workbench-score`
   * `hero-panel`, `hero-icon`, `hero-stats`
   * `guided-steps`, `guided-flow`
   * `audit-log-row`, `audit-grid`, `audit-marker`
   * `policy-summary-grid`, `review-queue-preview`, `review-queue-list`,
     `review-queue-head`
   * `scope-bar`, `scope-breadcrumb`, `scope-summary`
   * `production-readiness`, `readiness-grid`
   * `schedule-wizard`, `schedule-flow-card`, `schedule-readiness`,
     `schedule-readiness-grid`, `schedule-status`, `schedule-steps`,
     `schedule-preview-grid`, `schedule-actions`
   * `command-palette`, `command-palette-backdrop`, `command-palette-head`,
     `command-palette-list`, `command-center`, `command-actions`,
     `command-empty`, `command-picks`, `command-copy`
   * `command-empty`, `command-picks`
   * `bot-context`, `bot-context-copy`, `bot-switcher`,
     `bot-switcher-pill`, `bot-switcher-track`
   * `plugin-manager`, `plugin-card`, `plugin-main`, `plugin-actions`,
     `plugin-action-row`, `plugin-status-box`
   * `layer-workbench`, `layer-nav`, `layer-links`, `layer-icon`,
     `layer-copy`
   * `group-editor-tabs`, `group-legend`, `group-presets`,
     `group-scope-callout`
   * `diagnostic-grid` (module-screens)
   * `inspector-shell`, `inspector-section`, `inspector-grid`,
     `inspector-head`, `inspector-actions`, `advanced-section`,
     `activity-stream`, `suggestion-box` (module-screens)
   * `sidebar`, `topbar`, `topbar-menu`, `topbar-menu-wrap`, `app-shell`,
     `workspace`
   * `login-shell`, `login-panel`
   * `loading`, `empty-state`, `error`
   * `meta-grid`, `meta-pill`
   * `advanced-warning`, `advanced-hint`
   * `module-workbench`, `module-page`, `module-panel`, `module-overview`
   * `module-screen`, `module-screen-mini`, `module-screen-head`,
     `module-tabs`, `module-section-head`, `module-switch`,
     `module-actions`, `module-quick-nav`, `module-flow-launcher`,
     `module-live-stats`, `module-copy`, `module-muted-note`,
     `module-off-note`, `module-edit-button`, `module-empty-focus`
   * `module-disabled-drawer`, `module-icon`
   * `auto-reply-builder`, `builder-guide`, `builder-test`
   * `severity-ribbon`, `live-dot`, `live-feed`, `live-feed-head`
   * `floating-toast`
   * `dashboard-strip`, `data-card`, `card-list`, `card-main`,
     `card-actions`, `card-state`, `card-title-row`
   * `status-card`, `status-dashboard`
   * `cockpit-metrics`
   * `usage-guide`, `builder-guide`
   * `ops-checklist`, `ops-checklist-grid`, `ops-checklist-head`,
     `ops-context-actions`, `ops-context-copy`, `ops-context-panel`,
     `ops-task-board`, `ops-task-card`, `ops-task-grid`, `ops-task-head`,
     `ops-task-icon`
   * `pool-preview`, `pool-preview-list`
   * `settings-grid`, `setting-tile`, `setting-value`, `setting-edit`,
     `setting-edit-actions`, `setting-edit-button`, `setting-actions`,
     `setting-code`, `setting-icon-actions`, `setting-top`
   * `moderation-settings-actions`, `moderation-settings-actions-grid`,
     `moderation-settings-strip`,
     `moderation-settings-strip-compact`
   * `scam-inbox`, `scam-inbox-copy`, `scam-inbox-stats`,
     `scam-evidence-box`, `scam-review-detail`, `scam-review-facts`,
     `scam-report-facts`
   * `quick-filter-bar`
   * `rule-tester`, `rule-test-results`
   * `channel-composer`, `channel-composer-backdrop`,
     `channel-composer-grid`, `channel-composer-head`,
     `channel-composer-actions`, `channel-compose-fields`
   * `channel-button-builder`, `channel-button-row`,
     `channel-time-grid`, `channel-tabs`
   * `channel-post-list`, `channel-post-card`, `channel-post-actions`,
     `channel-post-meta`, `channel-post-main`, `channel-post-title`,
     `channel-post-error`, `channel-pagination`
   * `channel-preview-head`, `channel-preview-schedule`
   * `telegram-post-preview`, `telegram-inline-buttons`
   * `menu-inline-editor`, `menu-row-actions`
   * `menu-control-card`, `menu-control-head`, `menu-control-rows`
   * `event-line`
   * `nav-group`, `nav-group-muted`, `nav-unlock`
   * `sidebar`, `brand`
   * `mode-switch`, `runtime-note`
   * `field-section`, `fields`
   * `compact-value`
   * `protection-score`, `protection-flow-launcher`
   * `context-alert`, `context-alerts`
   * `workbench-detail-head`, `workbench-detail-stack`,
     `workbench-actions-grid`, `workbench-empty`,
     `workbench-footer-actions`
   * `bulk-defaults`, `bulk-copy`, `bulk-preview`, `bulk-footer`
   * `editor-title`, `editor-title-actions`
   * `telegram-post-preview`, `telegram-inline-buttons`
   * `disabled-module-list`
   * `workflow-panel`, `workflow-chips`, `workflow-icon`, `workflow-copy`

B. **Utility / state classes** (small, only one or two CSS properties
   — convert to `sx={{ ... }}` or to `Chip color="success"`/`error`):
   * `primary`, `secondary`, `success`, `warning`, `error`, `danger`,
     `pending`, `confirmed`, `rejected`, `critical`
   * `eyebrow` (overline copy)
   * `spin` (loading spinner)
   * `icon-button` (square icon button)
   * `ghost` (subtle button) — appears in module-screens and page.tsx
   * `setting-edit` / `setting-edit-actions` / `setting-edit-button`
   * `toggle-field`, `checkbox-field`, `switch-field`, `switch-control`,
     `toggle`, `toggle-switch`
   * `select-card`
   * `search`
   * `alert`
   * `actions`, `action-badge`
   * `placeholder`
   * `save`
   * `list-header`
   * `ok` (module-screens diagnostic grid)

C. **State-machine colors** (red/green pill) — keep visual meaning but
   move to MUI `Chip` with `color`/`sx`:
   * `pending`, `confirmed`, `rejected`, `critical`, `danger`,
     `success`, `warning`, `error`, `ok`, `health`

### 1.3 Class taxonomy in `app/components/module-screens.tsx`

9 unique classes. All sit on the legacy `<div>` inspector:
`.inspector-shell`, `.inspector-section`, `.inspector-grid`,
`.inspector-head`, `.advanced-section`, `.diagnostic-grid`,
`.activity-stream`, `.suggestion-box`, `.ghost`, `.ok`.

`AutomationScreen`, `ModerationScreen`, `ScamScreen`, `BotScreen`,
`GroupScreen` already use MUI `Paper`/`Stack`/sx — they are clean. Only
`InspectorPanel` (lines 222-293) still uses legacy HTML. Next task will
replace it with MUI `Section`/`KeyValue`/`Stack`.

### 1.4 `app/layout.tsx`

Currently 16 lines, no `ThemeProvider`, no `CssBaseline`. `ThemeProvider`
lives at `app/page.tsx:3785-5641` and wraps only the post-login return
value. Login/loading branches above it are unstyled.

After this task, `app/layout.tsx` will own `ThemeProvider` + `CssBaseline`
and `app/page.tsx` will drop its own copy.

**Implementation note.** Putting `<ThemeProvider>` + `<CssBaseline>`
directly inside `app/layout.tsx` causes a build-time crash
(`unstable_createUseMediaQuery is not a function`) because `CssBaseline`
calls `useMediaQuery`, which is a client hook, and `app/layout.tsx` is a
server component in Next 14. The fix is a tiny client wrapper:
`app/theme-registry.tsx` (uses `"use client"`), mounted by `app/layout.tsx`
as `<ThemeRegistry>{children}</ThemeRegistry>`. This is the official
pattern in `mui/material-ui` docs for Next 14 App Router and keeps
`export const metadata` working in the server layout. The spec's intent
("theme at root") is satisfied — `ThemeProvider` covers the whole tree.

### 1.5 Current theme tokens (in `app/page.tsx:168-224`)

```ts
mode: "dark"
background.default: "#070b10"
background.paper:  "#111821"
primary.main:      "#00b8d9"   (teal)
secondary.main:    "#7dd3fc"
success/warning/error: bright saturated (#4ade80 / #fbbf24 / #fb7185)
typography: IBM Plex Sans / Be Vietnam Pro
shape.borderRadius: 14
MuiPaper.backgroundImage: "none"
MuiCard backgroundImage: linear-gradient overlay
MuiButton.disableElevation: true
```

→ This task replaces with a light, neutral palette + Inter font.

### 1.6 API routes (read-only inventory, no refactor needed)

* `app/api/[table]/route.ts` — generic CRUD by Supabase table key.
* `app/api/healthz/` — health check.
* `app/api/meta/` — returns table metadata + env status.
* `app/api/channel-posts/` — channel post operations.

These are pure JSON; they don't render UI. No CSS dependencies.

## 2. Mapping old classes → new base components

| Old class(es) | New base component |
|---|---|
| `overview-compact`, `audit-console`, `channel-console`, `menu-policy-console`, `config-center`, `bulk-panel`, `editor-panel`, `metrics-dashboard`, `scam-inbox`, `task-workbench`, `hero-panel`, `schedule-wizard`, `command-center`, `bot-context`, `plugin-manager`, `layer-workbench`, `module-workbench`, `dashboard-strip`, `ops-task-board`, `pool-preview`, `scam-review-detail`, `module-page`, `module-panel`, `login-shell`, `login-panel`, `module-screen`, `workbench-detail-stack`, `audit-log-row`, `config-section`, `setting-tile` | `<Section>` (Paper wrapper with title/subtitle/actions) |
| `metric-card`, `metric-group`, `status-card`, `audit-console-stats span`, `scam-inbox-stats span`, `overview-compact article`, `overview-work-grid article`, `metric-icon`, `hero-stats`, `compact-value`, `meta-pill` | `<StatCard>` |
| `empty-state`, `command-empty`, `workbench-empty`, `metrics-empty`, `overview-log-empty`, `module-empty-focus` | `<EmptyState>` |
| `topbar`, `bot-context`, `brand`, `scope-bar`, `scope-breadcrumb` | `<PageHeader>` |
| `loading` (full-page), `login-shell` (loading branch only) | `<LoadingScreen>` |
| `alert`, `advanced-warning`, `floating-toast`, `context-alert`, `module-off-note` | `<ErrorAlert>` / `<SuccessAlert>` |
| `sidebar`, `topbar-menu`, `nav-group`, `layer-nav`, `module-quick-nav`, `layer-links`, `config-tabs`, `channel-tabs`, `group-editor-tabs` | `<NavSidebar>` (Drawer + List) and `<TabsBar>` |
| `eyebrow` overline copy | `Typography variant="overline" color="primary"` (no component) |
| `eyebrow`, `metric-label/value`, `setting-tile`, `config-section` row layout | `<KeyValue>` |
| `pending/confirmed/rejected/critical/danger/success/warning/error/ok/health` | MUI `<Chip color="success|error|warning|info" />` |
| `spin` | MUI `<CircularProgress size={16} />` |
| `icon-button` | MUI `IconButton` |
| `ghost` button | MUI `Button variant="text"` |
| `search` input | MUI `TextField` with `startIcon` `<Search />` |
| `toggle-field`, `toggle`, `switch-field`, `switch-control`, `checkbox-field` | MUI `Switch` / `Checkbox` with `FormControlLabel` |
| `select-card` | MUI `Select` inside `FormControl` |
| `field-section` / `fields` | MUI `Stack spacing={1.5}` |
| `actions`, `action-badge` | MUI `Stack direction="row" gap={1}` + `Chip` |
| `placeholder` | MUI `Skeleton` or `<EmptyState>` |

## 3. Risks

* **Visible regression during transition.** `app/page.tsx` will keep
  using both the new light theme and the old class-based markup. Old
  classes lose their dark backgrounds because we wipe `globals.css`.
  Visual result between this task and the next refactor will be a mix
  of clean-light MUI panels and bare, unstyled `<section>`/`<div>`.
  Acceptable because the next task is a UI refactor of the same areas.
* **Inspector panel in `module-screens.tsx`.** It still uses legacy
  `<section className="inspector-...">`. Will look unstyled after the
  wipe. Mitigation: next task will rewrite `InspectorPanel` to use
  `<Section>` / `<KeyValue>`.
* **Class names used in the data-testid / smoke test.** Audit found
  `scripts/smoke-admin-cp.mjs` and Playwright tests do **not** use
  class selectors — they navigate by text. Verified with `grep -n
  "className" scripts/`.
* **MUI v9 + `@mui/x-data-grid` v9.** No new dependencies needed.
* **`globals.css` is 5.696 lines.** Wiping it is intentional and
  required by spec. Any non-`className` global utility that the page
  uses (e.g. `body { margin: 0 }`) is preserved in the rewrite.

## 4. Dependencies to add (none)

No new package required. `package.json` already contains:
`@mui/material@^9.1.1`, `@mui/icons-material@^9.1.1`,
`@mui/x-data-grid@^9.5.0`, `@emotion/react`, `@emotion/styled`,
`lucide-react`. The base components only use `@mui/material` + a few
`lucide-react` icons.

## 5. Next-task checklist (handoff)

The follow-up "refactor `app/page.tsx`" task should:

1. Import base components from `./components/ui`.
2. Replace each `<section className="audit-console">…</section>` with
   `<Section title=… subtitle=… actions=…>…</Section>`.
3. Replace `metric-card`/`<article>` with `<StatCard>`.
4. Replace `eyebrow` `<div>` with `<Typography variant="overline" …>`.
5. Replace `pending/confirmed/...` classes with MUI `<Chip color=…>`.
6. Replace `spin` with `<CircularProgress size={16} />`.
7. Replace `sidebar` + `<nav>` with `<NavSidebar>`.
8. Replace `config-tabs`, `channel-tabs`, `group-editor-tabs`,
   `module-quick-nav` raw `<button>` groups with `<TabsBar>`.
9. Rewrite `InspectorPanel` (in `module-screens.tsx`) using
   `<Section>` + `<KeyValue>` + MUI buttons.
10. Remove dead imports only after the new components are in use.
