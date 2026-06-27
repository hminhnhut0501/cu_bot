# Admin CP IA/UX Guideline

Tài liệu này chuyển IA/UX spec thành guideline áp dụng trực tiếp cho codebase hiện tại. Mục tiêu là chuẩn hóa cấp điều hướng, giảm trùng nghĩa giữa tab, filter và CTA, và làm cho từng màn rõ ràng ngay từ 3 giây đầu nhìn vào.

## 1. Mục tiêu thiết kế

- Mỗi màn chỉ có một ý nghĩa chính.
- Mỗi cấp UI chỉ phục vụ một vai trò rõ ràng.
- Không dùng cùng một kiểu hiển thị cho hai khái niệm khác nhau nếu người dùng có thể nhầm.
- Hạn chế số CTA nổi bật trong header.
- Không để tab đóng vai filter hoặc filter đóng vai tab.

## 2. Cấu trúc chuẩn toàn hệ thống

### 2.1 Sidebar

- Là điều hướng cấp 1.
- Đại diện cho workspace / module lớn.
- Không lặp lại logic với tab ở content area.

### 2.2 Page header

- Chỉ giữ:
  - eyebrow
  - title
  - subtitle ngắn
  - breadcrumbs nếu cần
  - tối đa 1 primary action
  - tối đa 2 secondary actions
- Header không nên chứa nhiều control nghiệp vụ.
- Nếu một control chỉ áp dụng cho một module hoặc một section, nó nên nằm trong content area của module đó.

### 2.3 Section tabs

- Dùng để chuyển giữa các khu vực nghiệp vụ lớn trong cùng một module.
- Ví dụ:
  - `Quản lý hồ sơ`
  - `Duyệt báo cáo`
  - `Thiết lập dùng chung`
- Không dùng section tabs cho trạng thái dữ liệu.

### 2.4 Filter bar

- Dùng để lọc list hoặc queue.
- Nên hiển thị dưới dạng:
  - pills
  - chips
  - segmented control
- Không nên hiển thị như tab chính nếu chỉ là trạng thái dữ liệu.

### 2.5 Workspace content

- Là nơi chứa list, detail, form, inbox, dashboard hoặc editor.
- Nội dung ở đây nên bám theo section đang chọn, không tái hiện lại cùng một điều hướng.

## 3. Quy ước phân biệt tab, filter, button

### 3.1 Tab

Dùng tab khi:

- người dùng chuyển giữa các khu vực nghiệp vụ khác nhau
- mỗi lựa chọn có thể chứa dữ liệu và hành vi riêng
- việc đổi lựa chọn làm thay đổi ngữ cảnh làm việc rõ rệt

Không dùng tab khi:

- chỉ là trạng thái bản ghi
- chỉ là bộ lọc danh sách
- chỉ là nhóm nút thao tác
- chỉ là preset query

### 3.2 Filter

Dùng filter khi:

- mục đích chính là thu hẹp tập dữ liệu
- lựa chọn không phải là một workspace riêng

### 3.3 Button

Chia rõ:

- `Primary action`: tạo, lưu, xác nhận, submit
- `Secondary action`: command, refresh, export, mở bảng phụ
- `Destructive action`: xóa, reject, ban, hủy

Một màn chỉ nên có một primary action thật sự nổi bật.

## 4. Mapping theo codebase hiện tại

### 4.1 Chống scam

**Mục tiêu màn**
- Xử lý quy trình duyệt report.
- Tra cứu dữ liệu scam.
- Quản lý cấu hình dùng chung của module anti-scam.

**Cấu trúc đúng**

- Sidebar: chọn module `Chống scam`
- Section tabs:
  - `Quản lý hồ sơ scam`
  - `Duyệt report scam`
  - `Thiết lập dùng chung`
- Filter bar:
  - `Pending`
  - `Need more info`
  - `Confirmed`
  - `Rejected`
  - `Duplicate`
  - `All`
- Primary action:
  - chỉ để ở section có hành động tạo hoặc duyệt thực sự
- Secondary actions:
  - `Mở bảng report`
  - `Broadcast log`
  - `Command`

**Không nên làm**
- Không để bộ lọc trạng thái trông giống module tab.
- Không lặp tab `Tất cả / Chờ duyệt / Đã xác nhận / Từ chối` ở cả trên và dưới.
- Không đặt `Tạo báo cáo` như CTA toàn cục nếu nó chỉ thuộc một section.

**Áp vào code**
- `scam_reports` là queue / inbox flow.
- `scam_entities` là data management flow.
- `config` là shared settings flow.
- Header hiện tại ở `Topbar` nên chỉ còn control thật sự toàn cục hoặc phù hợp với screen đang mở.

Files liên quan:
- [app/page.tsx](/Users/hminhnhut/Cu_bot/app/page.tsx)
- [app/components/screens/ScamInbox.tsx](/Users/hminhnhut/Cu_bot/app/components/screens/ScamInbox.tsx)
- [app/components/screens/Topbar.tsx](/Users/hminhnhut/Cu_bot/app/components/screens/Topbar.tsx)

### 4.2 Group

**Mục tiêu màn**
- Quản lý group / scope / quyền bot trong group.
- Cấu hình nội dung, lịch gửi, quyền, và thông tin nhóm.

**Cấu trúc đúng**

- Sidebar: module `Group`
- Section tabs:
  - `Thông tin`
  - `Lịch gửi`
  - `Quyền và bảo vệ`
  - `Nội dung`
  - `Kỹ thuật`
- Filter bar:
  - chỉ dùng khi list nhóm cần lọc bot, scope, trạng thái
- Primary action:
  - `Lưu`
  - `Tạo mới` nếu đang tạo record group
- Secondary actions:
  - `Sửa`
  - `Bật / Tắt`
  - `Xem lịch sử`

**Không nên làm**
- Không để control cấp kỹ thuật lẫn với control cấp nội dung trong cùng một hàng nếu không có phân tách rõ.
- Không để tab section và field group biến thành cùng một kiểu UI.

**Áp vào code**
- `groupEditorTabs` nên là section tabs đúng nghĩa.
- `selectedScope` là filter ngữ cảnh, không phải section.

Files liên quan:
- [app/page.tsx](/Users/hminhnhut/Cu_bot/app/page.tsx)
- [app/components/ui/TabsBar.tsx](/Users/hminhnhut/Cu_bot/app/components/ui/TabsBar.tsx)
- [app/components/screens/Topbar.tsx](/Users/hminhnhut/Cu_bot/app/components/screens/Topbar.tsx)

### 4.3 Bot

**Mục tiêu màn**
- Quản lý bot, trạng thái, config riêng, và hành vi vận hành.

**Cấu trúc đúng**

- Sidebar: module `Bot`
- Section tabs:
  - `Tổng quan`
  - `Cấu hình`
  - `Hành vi`
  - `Logs liên quan`
  - `Tài nguyên`
- Filter bar:
  - bot selector
  - scope selector nếu thật sự cần
- Primary action:
  - `Lưu cấu hình`
- Secondary actions:
  - `Reload`
  - `Command`
  - `Tạo mới` nếu màn có CRUD thực sự

**Không nên làm**
- Không biến bot selector thành tab.
- Không đặt hành động tạo mới cùng mức nhấn mạnh với hành động lưu nếu người dùng đang sửa config.

**Áp vào code**
- `Topbar` hiện đang đóng vai trò rất lớn trong chọn bot và scope. Phần này phải được xem là filter context, không phải điều hướng.
- Các màn bot nên ưu tiên hiển thị `status`, `enabled`, `runtime`, `health` trước thao tác CRUD.

Files liên quan:
- [app/components/screens/Topbar.tsx](/Users/hminhnhut/Cu_bot/app/components/screens/Topbar.tsx)
- [app/page.tsx](/Users/hminhnhut/Cu_bot/app/page.tsx)
- [app/components/ui/PageHeader.tsx](/Users/hminhnhut/Cu_bot/app/components/ui/PageHeader.tsx)

### 4.4 Logs

**Mục tiêu màn**
- Tìm nhanh sự kiện, đọc ngữ cảnh, truy ngược hành động.

**Cấu trúc đúng**

- Sidebar: module `Logs`
- Section tabs:
  - nếu chỉ có một loại log thì không cần tab
  - nếu có nhiều domain log thì tách theo domain lớn
- Filter bar:
  - thời gian
  - bot
  - scope
  - action
  - status
- Primary action:
  - gần như không cần
- Secondary actions:
  - `Refresh`
  - `Export`
  - `Open detail`

**Không nên làm**
- Không tạo tab cấp nghiệp vụ nếu log chỉ khác nhau ở filter.
- Không để button thao tác lấn át search/filter.

**Áp vào code**
- `audit_logs` nên là một màn thiên về filter và detail, không phải tab-heavy screen.
- Nếu có view theo member logs và system logs, chỉ khi đó mới dùng section tabs.

Files liên quan:
- [app/page.tsx](/Users/hminhnhut/Cu_bot/app/page.tsx)
- [app/components/screens/AuditConsole.tsx](/Users/hminhnhut/Cu_bot/app/components/screens/AuditConsole.tsx)
- [app/components/screens/Topbar.tsx](/Users/hminhnhut/Cu_bot/app/components/screens/Topbar.tsx)

### 4.5 Module settings

**Mục tiêu màn**
- Cấu hình dùng chung theo module, ít nhất là `moderation`, `verification`, `welcome`, `auto_reply`, `channel_publisher`.

**Cấu trúc đúng**

- Sidebar: module chính
- Section tabs:
  - `Thiết lập dùng chung`
  - `Thiết lập theo module`
  - `Thiết lập nâng cao`
- Sub-section hoặc grouped cards:
  - từng block config rõ ràng
- Primary action:
  - `Lưu`
- Secondary actions:
  - `Reset`
  - `Bật / Tắt`
  - `Test`

**Không nên làm**
- Không để config field rải ngang như một danh sách phẳng nếu có thể nhóm theo hành vi.
- Không trộn config dùng chung với config riêng module trong cùng level UI.

**Áp vào code**
- `app/theme.ts` và `SYSTEM_CONFIG_SECTIONS` cho thấy hệ thống đã có khái niệm cấu hình chung. UI cần bám đúng khái niệm này thay vì hiển thị tất cả như cùng cấp.
- `ModerationToggles` nên là một block con trong `Thiết lập dùng chung`, không phải một màn độc lập nếu không có lý do riêng.

Files liên quan:
- [app/page.tsx](/Users/hminhnhut/Cu_bot/app/page.tsx)
- [app/components/screens/ModerationToggles.tsx](/Users/hminhnhut/Cu_bot/app/components/screens/ModerationToggles.tsx)
- [app/theme.ts](/Users/hminhnhut/Cu_bot/app/theme.ts)

## 5. Quy tắc áp dụng cho các component hiện có

### 5.1 `PageHeader`

- Chỉ dùng cho title bar của một màn.
- Không đưa tab nghiệp vụ trùng cấp vào `actions`.
- Nếu có children, hãy dùng cho filter row hoặc section controls, không dùng để nhồi thêm điều hướng mới.

File:
- [app/components/ui/PageHeader.tsx](/Users/hminhnhut/Cu_bot/app/components/ui/PageHeader.tsx)

### 5.2 `TabsBar`

- Chỉ dùng cho một vai trò tại một thời điểm.
- Nếu item là filter trạng thái, cần style khác với tab section.
- Nếu item là section tab, không để nó trông như segmented filter.

File:
- [app/components/ui/TabsBar.tsx](/Users/hminhnhut/Cu_bot/app/components/ui/TabsBar.tsx)

### 5.3 `Topbar`

- Topbar là nơi giữ context chọn bot, scope, search, bulk toggle và CTA toàn cục.
- Không nên chứa quá nhiều action nghiệp vụ của riêng từng màn.
- Nếu một nút chỉ hợp lệ trong một section, nút đó nên dịch xuống section đó.

File:
- [app/components/screens/Topbar.tsx](/Users/hminhnhut/Cu_bot/app/components/screens/Topbar.tsx)

## 6. Chuẩn review trước khi merge UI

Trước khi chốt một màn, cần check:

- Màn này có bao nhiêu cấp điều hướng đang hiện?
- Tab nào đang dùng thay cho filter?
- Filter nào đang trông như tab?
- CTA chính có bị lặp ở nhiều nơi không?
- Có thể hiểu “đang ở đâu” và “nên bấm gì tiếp” trong 5 giây không?

## 7. Ưu tiên refactor

1. Chống scam
2. Group
3. Bot
4. Logs
5. Module settings

Lý do:

- Đây là các màn có nhiều control nhất.
- Đây là nơi trùng cấp điều hướng rõ nhất.
- Chuẩn hóa các màn này sẽ tạo template cho phần còn lại.

## 8. Mapping thực thi theo component

### 8.1 `Topbar`

Hiện tại `Topbar` đang gánh nhiều vai trò cùng lúc: header, action bar, filter bar và một phần workspace switcher.

Cần tách theo nguyên tắc:

- Giữ lại:
  - search toàn cục trong ngữ cảnh màn hiện tại
  - bot selector
  - scope selector
  - refresh
  - `Về workbench` khi đang ở chế độ drill-down
- Dời xuống section:
  - CTA chỉ hợp lệ cho một module hoặc một tab cụ thể
  - filter trạng thái của list
  - các action nghiệp vụ như `Mở bảng report`, `Broadcast log`

Trong code hiện tại, phần `tableFilterTabs` ở `Topbar` là ứng viên đầu tiên cần đổi từ “tab” sang “filter pills”.

File:
- [app/components/screens/Topbar.tsx](/Users/hminhnhut/Cu_bot/app/components/screens/Topbar.tsx)

### 8.2 `PageHeader`

`PageHeader` nên là khung chuẩn cho tất cả screen:

- title
- subtitle
- breadcrumbs
- actions
- children cho filter row hoặc section controls

Không nên để `PageHeader` trở thành nơi chứa thêm một layer điều hướng khác.

File:
- [app/components/ui/PageHeader.tsx](/Users/hminhnhut/Cu_bot/app/components/ui/PageHeader.tsx)

### 8.3 `TabsBar`

Hiện `TabsBar` đang dùng chung cho:

- module tabs
- quick filters
- config tabs
- channel tabs
- group editor tabs

Để giảm nhầm lẫn, nên quy ước:

- `tone="standard"`: section tabs
- `tone="pill"`: filter pills

Nếu một use case không thuộc hai nhóm trên, cần tạo style riêng hoặc đổi sang `Chip` / `ToggleButtonGroup`.

File:
- [app/components/ui/TabsBar.tsx](/Users/hminhnhut/Cu_bot/app/components/ui/TabsBar.tsx)

## 9. Mapping theo màn trong app/page.tsx

### 9.1 `anti_scam`

- `scam_reports`: màn queue/inbox chính
- `scam_entities`: màn quản lý dữ liệu scam
- `config`: màn thiết lập dùng chung

Nguyên tắc:

- `scam_reports` là nơi có filter trạng thái, search, list, detail.
- `scam_entities` là nơi có CRUD rõ ràng.
- `config` là nơi có các block cài đặt, không nên lẫn với queue.

### 9.2 `group`

- `groups` là màn chính
- `groupEditorTabs` là section tabs
- `selectedScope` là filter context

Nguyên tắc:

- không để scope selector và section tabs trông như cùng một lớp UI
- chỉ dùng `TabsBar` cho nhóm nội dung khác nhau, không dùng cho bộ lọc scope

### 9.3 `bot`

- `bots` là màn chính để chọn bot, xem trạng thái và chỉnh cấu hình
- `module_settings` và config liên quan nên nằm trong section rõ ràng

Nguyên tắc:

- bot selector là context switcher
- `Tạo mới` chỉ xuất hiện khi đang ở list CRUD rõ ràng
- config action như `Lưu`, `Bật/tắt`, `Test` phải nằm gần block config

### 9.4 `audit_logs`

- ưu tiên search, filter, timeline, detail
- tab chỉ được dùng nếu tách log theo domain lớn

Nguyên tắc:

- nếu đổi tab mà chỉ thay đổi query, hãy dùng filter thay vì tab
- CTA chính gần như không tồn tại, thay vào đó là `Refresh`, `Export`, `Open detail`

### 9.5 `config`

- nếu đang ở `module:moderation`, `module:verification`, `module:menu_policy`, ... thì `config` phải được chia theo module section rõ ràng
- `SYSTEM_CONFIG_SECTIONS` chỉ là “dùng chung”, không phải tất cả config đều cùng một level

Nguyên tắc:

- `Thiết lập dùng chung` là section
- `Thiết lập theo module` là section
- field-level controls chỉ là nội dung bên trong section

## 10. Suggested refactor order

1. Chuẩn hóa `TabsBar` thành 2 vai trò rõ ràng: section tabs và filter pills.
2. Giảm `Topbar` chỉ còn context + CTA thật sự toàn cục.
3. Tách `anti_scam` thành 3 section cố định.
4. Chuẩn hóa `Group` thành tabs cho section, không cho filter.
5. Chuẩn hóa `Bot` và `Logs`.
6. Áp cùng pattern cho các module còn lại.

## 11. Definition of done cho UI/UX refactor

Một màn được coi là đạt chuẩn khi:

- người dùng biết ngay đây là module gì
- không có 2 điều hướng cùng cấp trông giống nhau
- filter không giả dạng tab
- CTA chính chỉ có 1
- section tabs, filter, và form actions không cạnh tranh nhau
- không cần đọc quá nhiều để hiểu nên thao tác gì tiếp theo
