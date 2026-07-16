# Member Screen UI Spec

Tài liệu này mô tả spec frontend cho màn **Thành viên** trong admin CP. Mục tiêu là làm cho màn này:

- tìm được người dùng nhanh khi danh sách dài
- nhìn rõ ai là ai, đang ở trạng thái gì
- hiểu được trạng thái `live` hay `snapshot`
- truy vết được lý do mute/ban/restrict
- có thể scale lên danh sách lớn mà không làm UI nhảy liên tục

---

## 1. Scope

Màn Thành viên gồm 4 cụm dữ liệu:

- danh sách hoạt động gần đây
- danh sách bị cấm chat / restricted / muted
- danh sách bị ban / kicked / blacklisted
- nhật ký thao tác liên quan đến member

Backend hiện có các nguồn chính:

- `GET /api/members/overview`
- `POST /api/members/action`

Nguồn dữ liệu:

- `analytics_member_activity`
- `member_moderation_state`
- `audit_logs`

---

## 2. Screen Layout

### 2.1 Component Tree

```text
MemberPage
├─ PageHeader
│  ├─ title
│  ├─ subtitle
│  ├─ context chips: bot, scope, runtime
│  └─ top actions
│     ├─ global search
│     ├─ refresh
│     └─ command
├─ MemberSummaryRow
│  ├─ StatCard ActiveRecent
│  ├─ StatCard Muted
│  ├─ StatCard Banned
│  └─ StatCard Blacklisted
├─ MemberWorkspace
│  ├─ MemberTabBar
│  │  ├─ All
│  │  ├─ ActiveRecent
│  │  ├─ Muted
│  │  ├─ Banned
│  │  ├─ Blacklisted
│  │  └─ AuditLog
│  ├─ MemberToolbar
│  │  ├─ SearchInput
│  │  ├─ FilterChips
│  │  │  ├─ status
│  │  │  ├─ role
│  │  │  ├─ source
│  │  │  ├─ time range
│  │  │  └─ has reason
│  │  ├─ SortMenu
│  │  ├─ ResetFiltersButton
│  │  └─ ExportButton optional
│  ├─ MemberListPane
│  │  ├─ ListHeader
│  │  ├─ ListRows
│  │  │  └─ MemberRow
│  │  ├─ EmptyState
│  │  └─ PaginationFooter
│  └─ MemberDetailDrawer
│     ├─ MemberProfile
│     ├─ ModerationState
│     ├─ Timeline
│     ├─ QuickActions
│     └─ Notes
└─ ConfirmActionDialog
```

### 2.2 Screen Hierarchy

1. Hero
2. KPI row
3. Tab bar
4. Filter/search bar
5. List
6. Drawer detail
7. Confirm action modal

Không nên lặp lại tiêu đề hoặc context ở nhiều block khác nhau.

---

## 3. Tab Model

### 3.1 Tabs

- `All`
- `Active recent`
- `Muted`
- `Banned`
- `Blacklisted`
- `Audit log`

### 3.2 Tab behavior

- `All` là union của activity + moderation state.
- `Active recent` ưu tiên member có `last_seen_at` mới nhất.
- `Muted` hiển thị `status = muted`.
- `Banned` hiển thị `status = banned`.
- `Blacklisted` hiển thị `status = blacklisted`.
- `Audit log` hiển thị lịch sử thao tác, không dùng cùng item shape với member row.

### 3.3 Empty state per tab

Mỗi tab phải có empty state riêng:

- `Không có dữ liệu khớp bộ lọc hiện tại`
- `Nhóm này chưa có member bị mute`
- `Chưa có log thao tác`

Không để trống trắng hoàn toàn.

---

## 4. Props / State

## 4.1 Page State

```ts
type MemberTab = "all" | "active" | "muted" | "banned" | "blacklisted" | "audit";

type MemberFilters = {
  search: string;
  botKey: string;
  groupId: string;
  status?: "normal" | "muted" | "banned" | "blacklisted" | "";
  role?: "owner" | "mod" | "vip" | "member" | "restricted" | "";
  source?: "activity" | "state" | "audit" | "activity+state" | "";
  reason?: "all" | "has_reason" | "missing_reason";
  timeRange?: "24h" | "7d" | "30d" | "custom";
  sortBy?: "last_seen_at" | "updated_at" | "display_name" | "status";
  sortDir?: "asc" | "desc";
};

type MemberPageState = {
  tab: MemberTab;
  filters: MemberFilters;
  page: number;
  pageSize: number;
  selectedMemberId?: string;
  selectedUserId?: string;
  drawerOpen: boolean;
  refreshTick: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error?: string;
  lastUpdatedAt?: string;
};
```

## 4.2 Row State

```ts
type MemberRow = {
  id?: number;
  bot_key: string;
  chat_id: string;
  user_id: string;
  username?: string;
  display_name?: string;
  status: "normal" | "muted" | "banned" | "blacklisted";
  reason?: string;
  until_at?: string | null;
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
  last_seen_at?: string;
  payload?: Record<string, unknown>;
  source?: "activity" | "state" | "audit" | "activity+state";
};
```

## 4.3 Detail Drawer State

```ts
type MemberDetailState = {
  member: MemberRow | null;
  timeline: Array<{
    type: "join" | "leave" | "mute" | "unmute" | "ban" | "unban" | "blacklist" | "unblacklist" | "note";
    at: string;
    actor?: string;
    reason?: string;
    source?: string;
  }>;
  loading: boolean;
  error?: string;
};
```

---

## 5. API Contract

## 5.1 Current `GET /api/members/overview`

### Query params hiện có

- `bot_key`
- `group_id`
- `search`
- `date`
- `limit`

### Response hiện có

```ts
type MemberOverviewResponse = {
  date: string;
  scope: {
    botKey: string;
    groupId: string;
  };
  summary: {
    activeToday: number;
    visibleMembers: number;
    muted: number;
    banned: number;
    blacklisted: number;
    normalTracked: number;
  };
  members: MemberRow[];
  active: MemberRow[];
  muted: MemberRow[];
  banned: MemberRow[];
  blacklisted: MemberRow[];
  logs: Array<Record<string, unknown>>;
};
```

### Important note

API hiện tại đang làm kiểu:

- query dữ liệu
- merge phía server
- `search`
- `slice(0, limit)`

Tức là **chưa phải pagination thật**. Nếu danh sách dài, frontend sẽ vẫn khó quản lý nếu không nâng API.

---

## 5.2 Recommended API for frontend

Nên nâng `GET /api/members/overview` theo dạng paginated:

### Query params đề xuất

- `bot_key`
- `group_id`
- `tab`
- `search`
- `status`
- `role`
- `source`
- `reason`
- `sort_by`
- `sort_dir`
- `page`
- `page_size`
- `cursor` optional
- `date`
- `time_range`

### Response đề xuất

```ts
type MemberOverviewPagedResponse = {
  date: string;
  scope: {
    botKey: string;
    groupId: string;
  };
  summary: {
    activeToday: number;
    visibleMembers: number;
    muted: number;
    banned: number;
    blacklisted: number;
    normalTracked: number;
  };
  filtersApplied: MemberFilters;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasNextPage: boolean;
    nextCursor?: string | null;
  };
  members: MemberRow[];
  logs: Array<Record<string, unknown>>;
  meta: {
    lastUpdatedAt: string;
    queryMode: "activity" | "state" | "mixed" | "audit";
    snapshotMode: "live" | "snapshot";
  };
};
```

### Recommended detail endpoint

Để drawer không phải nhét hết vào overview:

- `GET /api/members/detail?bot_key=&group_id=&user_id=`

Response:

```ts
type MemberDetailResponse = {
  member: MemberRow;
  timeline: MemberDetailState["timeline"];
  stats: {
    joinCount: number;
    leaveCount: number;
    actionCount: number;
    lastActionAt?: string;
  };
  notes: Array<{
    id: string;
    text: string;
    created_at: string;
    created_by?: string;
  }>;
};
```

---

## 6. Member Row Contract

Mỗi dòng member trong list nên render theo thứ tự ưu tiên sau:

1. avatar
2. display name
3. username
4. user ID
5. status badge
6. last seen / updated at
7. reason chip
8. source chip
9. action buttons

### Fallback rules

- Nếu thiếu `display_name`, hiển thị `username`, rồi đến `user_id`.
- Nếu thiếu `username`, không để trống, hiển thị `@unknown` hoặc `No username`.
- Nếu thiếu `reason`, hiển thị `Chưa có lý do`.
- Nếu thiếu `last_seen_at`, fallback sang `updated_at`.
- Nếu thiếu cả hai, hiển thị `-`.

### Suggested visible row fields

- `display_name`
- `username`
- `user_id`
- `status`
- `last_seen_at`
- `reason`
- `source`

---

## 7. Search / Filter / Sort Logic

## 7.1 Search

Search nên match các trường:

- `display_name`
- `username`
- `user_id`
- `reason`
- `created_by`
- `updated_by`

Normalization:

- trim
- lowercase
- bỏ prefix `@`
- bỏ khoảng trắng dư

Search behavior:

- debounce 250-400ms
- reset page về 1 khi search thay đổi
- preserve search khi đổi tab nếu user chưa clear

## 7.2 Filter

### Search bar placement

Search đặt ở **toolbar ngay trên list**, không đặt trong hero.

### Filter placement

Filter đặt cùng hàng với search, ưu tiên:

- bên trái: search
- bên phải: filter chips + sort + reset + refresh

### Filter precedence

1. tab
2. scope
3. search
4. status/role/source/reason
5. sort
6. page

### Filter rules

- `status`
  - `active` tab không nên nhầm với `status = normal`
  - `muted`, `banned`, `blacklisted` là status thật
- `reason`
  - `has_reason`
  - `missing_reason`
- `source`
  - `activity`
  - `state`
  - `audit`
  - `activity+state`

## 7.3 Sort

Sort mặc định:

- `last_seen_at desc`

Các sort hợp lệ:

- `last_seen_at`
- `updated_at`
- `display_name`
- `status`

## 7.4 Pagination

### Why cần pagination thật

Backend hiện mới `limit` và `slice(0, limit)`, chưa có total count, nên nếu data nhiều sẽ:

- chậm
- dễ thiếu bản ghi
- khó infinite scroll
- search không đảm bảo chính xác trên dataset lớn

### Frontend behavior

- dùng page size mặc định `25`
- hiển thị `25 / 120`
- nếu tổng chưa có, dùng `Load more`
- nếu có total, dùng pagination số trang

### Recommended mode

Ưu tiên **cursor pagination** cho member list lớn.

Logic:

- load page đầu tiên
- giữ `nextCursor`
- nút `Tải thêm`
- khi đổi filter/search, reset cursor

---

## 8. Loading / Empty / Error State

## 8.1 Loading

- dùng skeleton row
- không thay layout đột ngột
- hiển thị `Đang cập nhật...`
- có `lastUpdatedAt`

## 8.2 Refreshing

- nếu refresh chỉ cập nhật data, giữ nguyên filter và tab
- không clear list trong lúc chờ
- nếu list đang có dữ liệu, show small spinner thôi

## 8.3 Empty

Empty state phải phân biệt:

- không có dữ liệu thật
- không có kết quả theo filter
- backend lỗi

## 8.4 Error

Error phải có:

- message ngắn
- `Try again`
- `Reset filters`

---

## 9. Action Model

## 9.1 Supported actions

Frontend cần support:

- `mute`
- `restrict`
- `ban`
- `kick`
- `unban`
- `unmute`
- `blacklist`
- `unblacklist`

## 9.2 Action UX

Mỗi action nên có:

- confirm dialog
- reason input
- duration input cho mute/restrict nếu cần
- dry-run toggle nếu muốn safe preview

### Action dialog fields

- target user summary
- action select
- reason textarea
- duration selector
- dry-run checkbox
- confirm button

## 9.3 Optimistic update

Không nên optimistic update toàn list nếu backend còn phụ thuộc Telegram result.

Nên:

- submit action
- show pending state trên row
- refresh row sau khi action success
- nếu action fail, giữ trạng thái cũ và show error

---

## 10. Visual Rules for This Screen

- hero chỉ xuất hiện 1 lần
- tab và content phải cùng container
- search/filter phải nằm sát list
- badge `live` chỉ dùng khi dữ liệu thật sự realtime
- nếu là polling, ghi rõ `snapshot` hoặc `cập nhật gần đây`
- empty state không được để trắng
- list item phải luôn có tên hoặc fallback rõ ràng

---

## 11. Backend Gaps to Close

Các gap nên xử lý trước hoặc cùng lúc với frontend:

- thêm `page`, `page_size`, `total`, `next_cursor`
- tách `tab` và `status` rõ hơn
- trả về `lastUpdatedAt`
- trả về `snapshotMode`
- chuẩn hóa `reason` fallback
- chuẩn hóa `display_name` fallback
- có endpoint detail riêng cho drawer

---

## 12. Acceptance Criteria

Màn Thành viên đạt chuẩn khi:

- tìm được member bằng tên, username, ID, reason
- không cần cuộn dài để tìm trong danh sách lớn
- biết rõ vì sao một user bị mute/ban
- biết list nào là live, list nào là snapshot
- đổi filter không làm UI nhảy loạn
- mở drawer là thấy đủ profile + timeline + action

