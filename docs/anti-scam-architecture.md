# Anti-scam Architecture

This document defines the DB schema, API surface, and Admin UX for the anti-scam module.

## Data Model

### `scam_reports`
Incoming user reports, kept as raw evidence and review queue items.

Key fields:
- `status`: `pending | need_more_info | confirmed | rejected | duplicate`
- `evidence_payload`: JSON with Telegram attachment metadata
- `confidence_score`: reviewer confidence before final confirmation
- `scam_percent`: computed score shown to admins and users
- `duplicate_of`: link to the canonical report when merged

### `scam_entities`
Canonical scam records used by lookup and broadcast.

Key fields:
- normalized search columns: `normalized_uid`, `normalized_username`, `normalized_bank_account`, `normalized_phone`, `normalized_name`
- `risk_level`, `confidence_score`, `scam_percent`
- `last_report_id`, `reviewed_by`, `reviewed_at`

### `scam_report_attachments`
One row per media item attached to a report.

### `scam_aliases`
Alias index to support fuzzy lookup and name variations.

### `scam_broadcasts`
Message delivery log for group/channel notifications.

## API Routes

Keep the generic CP table CRUD route for direct editing, and add specialized routes for review and search:

- `GET /api/scam_reports`
- `POST /api/scam_reports`
- `PATCH /api/scam_reports`
- `POST /api/scam_reports/:id/confirm`
- `POST /api/scam_reports/:id/reject`
- `POST /api/scam_reports/:id/duplicate`
- `POST /api/scam_reports/:id/need-more-info`
- `GET /api/scam_entities`
- `POST /api/scam_entities`
- `PATCH /api/scam_entities`
- `POST /api/scam_entities/:id/disable`
- `POST /api/scam_entities/:id/enable`
- `POST /api/scam_aliases`
- `GET /api/scam_aliases?entity_id=...`
- `GET /api/scam_lookup?q=...`
- `POST /api/scam_broadcasts`
- `POST /api/scam_broadcasts/:id/send`
- `GET /api/scam_broadcasts`

## Telegram Commands

### User
- `/report`
- `/check`
- `/scam`

### Admin
- `/addscam`
- `/editscam`
- `/confirmscam`
- `/rejectscam`
- `/duplicatescam`
- `/needinfo`
- `/scamdetail`
- `/scamlist`
- `/scambroadcast`

## UX Principles

- Private chat is the default intake channel for reports.
- Admin review should be queue-first, not table-first.
- One report card should show summary, evidence, extracted fields, and actions in one screen.
- Confirmation should create or update a canonical scam entity and trigger broadcast when configured.
- Group lookup must stay short, readable, and immediate.

## Admin Inbox Layout

Recommended layout:

1. Left rail: status filters and counters.
2. Main list: report cards sorted by `pending` and newest first.
3. Right panel: selected report detail, attachments, extracted fields, and action buttons.

Recommended quick actions:
- `Xác nhận`
- `Từ chối`
- `Đánh dấu trùng`
- `Cần bổ sung`
- `Tạo hồ sơ scam`

Recommended card content:
- Reporter
- Target identity fields
- Evidence thumbnail count
- Risk score
- Status badge
- Created time

