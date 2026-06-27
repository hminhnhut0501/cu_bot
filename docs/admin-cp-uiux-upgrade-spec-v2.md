# Admin CP UI/UX Upgrade Spec v2

Tài liệu này là bản nâng cấp v2, ngắn và thực dụng, để đưa toàn bộ admin CP về một hệ IA/UI thống nhất hơn. Mục tiêu không phải làm lại toàn bộ visual, mà là sửa đúng các lỗi đang gây khó hiểu:

- màu sắc chưa có semantic rõ
- block trùng vai trò
- tab và content bị tách rời
- filter, navigation, meta và action đang dùng visual quá giống nhau
- cùng một loại thông tin nhưng hiển thị bằng nhiều pattern chắp vá

## 1. Nguyên tắc IA toàn hệ thống

### 1.1 Chỉ có 4 cấp điều hướng

- `App navigation`: sidebar
- `Screen navigation`: tab hoặc section switcher trong một màn
- `Data filter`: filter trạng thái, filter action, filter queue
- `Record action`: create, save, confirm, reject, delete

Không được dùng một component trông giống nhau cho cả 4 cấp này.

### 1.2 Mỗi màn chỉ có 1 hero

Hero là block đầu tiên của màn và chỉ có:

- tên màn
- mô tả ngắn
- context hiện tại: bot, scope, runtime nếu cần
- CTA chính nếu có
- CTA phụ nếu thực sự cần

Không được có thêm block thứ hai lặp lại:

- title
- subtitle
- context chip
- icon domain

### 1.3 Tab phải đi cùng content

Nếu một tab điều khiển một vùng nội dung, tab đó phải nằm trong cùng container với vùng nội dung đó.

Không dùng kiểu:

- block A chỉ chứa tab
- block B ở dưới mới chứa nội dung của tab

Đó là nguồn chính gây cảm giác "cụt" và mất mạch.

### 1.4 Filter là filter, không được giả làm tab màn

Filter trạng thái như:

- `Tất cả`
- `Chạy`
- `Tắt`
- `Pending`
- `Confirmed`

chỉ được dùng để lọc dataset hiện tại. Nó phải nằm sát list, board, queue hoặc inbox mà nó điều khiển.

Không đặt filter dataset ở hero nếu filter đó không áp dụng cho toàn màn.

### 1.5 Mỗi block phải trả lời được một câu hỏi

Một block chỉ nên phục vụ một trong các mục đích sau:

- `What screen am I on?`
- `What should I do now?`
- `What section am I in?`
- `What data am I looking at?`
- `What action can I take?`

Nếu một block đang vừa mô tả screen, vừa mô tả section, vừa lặp lại context bot/scope, block đó cần bị gộp hoặc tách lại.

## 2. Rule màu, surface, component

### 2.1 Màu sắc

Chỉ dùng 3 lớp màu chính:

- `Brand primary`: màu tương tác chính toàn app
- `Semantic status`: success, warning, error, info
- `Module accent`: dùng rất nhẹ để nhận diện domain, không được lấn vai semantic status

### 2.2 Quy tắc semantic màu

- `Primary`: dùng cho CTA chính, selected state chính, focus state
- `Success`: chỉ cho trạng thái tốt, confirmed, enabled, passed
- `Warning`: pending, needs attention, partial risk
- `Error`: reject, failed, danger
- `Info`: technical info, analytics, supporting context

`Anti-scam` có thể có accent đỏ/hồng nhẹ ở hero hoặc overline, nhưng không được làm toàn màn giống cảnh báo lỗi.

### 2.3 Surface hierarchy

Chỉ giữ 3 pattern surface:

#### Surface A: Hero surface

Dùng cho hero đầu màn.

- có accent nhẹ theo module
- có title/subtitle/context/actions
- không chứa data list

#### Surface B: Workspace surface

Dùng cho vùng làm việc chính:

- tab + content
- list + detail
- dashboard + action

Đây là khối chính của màn.

#### Surface C: Inset surface

Dùng cho:

- stat tile
- queue card
- log card
- detail meta block
- empty state area

Không tạo thêm biến thể thứ tư, thứ năm nếu không thật sự cần.

### 2.4 Tab rule

- `Screen tabs`: `outlined` hoặc `filled`, gắn với workspace
- `Filter tabs`: `filled` nhỏ gọn, luôn nằm gần list
- `Deep config tabs`: `outlined`, đặt trong editor/config workspace

Không dùng một style tab cho cả navigation và filter.

### 2.5 Chip rule

Chip chỉ dùng cho 3 việc:

- meta ngắn: `Bot`, `Scope`, `Runtime`
- status ngắn: `ON`, `OFF`, `Pending`
- count badge nhẹ

Không dùng chip để thay cho heading, summary card hoặc mini paragraph.

### 2.6 Card rule

- `StatCard`: chỉ dành cho metric hoặc state summary
- `List card`: dành cho item trong queue/list
- `Meta panel`: dành cho detail facts hoặc config helper

Không trộn 3 vai trò này vào cùng một kiểu card.

## 3. Template chuẩn cho từng loại màn

### 3.1 Template A: Hub / Overview screen

Áp dụng cho:

- `Tổng quan`
- `Module`
- `Logs` overview

Thứ tự:

1. Hero
2. Summary stat row
3. Signals row
4. Main insights block
5. Supporting actions

Không có tab nếu nội dung chưa tách thành workspace rõ ràng.

### 3.2 Template B: Module workspace screen

Áp dụng cho:

- `Chống scam`
- `Moderation`
- `Welcome`
- `Auto reply`
- `Share unlock`
- `Giveaway`

Thứ tự:

1. Hero
2. Goal strip nếu cần
3. Workspace block
4. Tabs bên trong workspace
5. Active tab content trong cùng block
6. Supporting panels ở dưới nếu cần

Rule quan trọng:

- tab và content phải cùng block
- không có thêm block trung gian chỉ để nhắc lại title module

### 3.3 Template C: Data management screen

Áp dụng cho:

- `scam_entities`
- `groups`
- `bots`
- `messages`
- `video_messages`

Thứ tự:

1. Hero
2. Filter bar
3. Main data workspace
4. List pane
5. Detail pane hoặc editor pane

Filter bar phải nằm trên chính vùng data, không nằm ở hero nếu chỉ lọc dataset.

### 3.4 Template D: Queue / Inbox screen

Áp dụng cho:

- `scam_reports`
- queue moderation hoặc channel nếu có

Thứ tự:

1. Hero
2. Queue summary stat row
3. Filter bar
4. Split workspace
5. Left: queue list
6. Right: detail / action panel
7. Optional helper or broadcast feed

Không được chèn block mô tả trung gian giữa filter và queue content.

### 3.5 Template E: Config / Editor screen

Áp dụng cho:

- `config`
- `module shared settings`
- `group editor`

Thứ tự:

1. Hero
2. Config section tabs nếu cần
3. Active config section
4. Editor groups
5. Sticky action row hoặc footer action panel

Không để editor field groups trông như dashboard card.

## 4. Mapping cụ thể: bỏ block nào, gộp block nào

### 4.1 Chống scam

Hiện trạng đang có các lớp dễ trùng:

- hero đầu màn
- `Tác vụ / Chống scam`
- `Phân khu chống scam`
- `Anti scam / Duyệt report`

Quy hoạch v2:

- Giữ 1 hero duy nhất cho `Quản lý hồ sơ scam`
- Bỏ block `Tác vụ / Chống scam`
- Gộp `Phân khu chống scam` với nội dung tab bên dưới thành 1 `workspace block`
- `Anti scam / Duyệt report` trở thành nội dung của tab `Duyệt báo cáo scam`, không đứng như một section ngang hàng với tab selector
- Filter `Tất cả / Chạy / Tắt` nằm trên `Scan mode` hoặc list mà nó điều khiển, không đứng như một block độc lập trôi giữa màn

### 4.2 Moderation

Hiện trạng thường gặp:

- summary block
- quick action block
- config block
- policy block

Quy hoạch v2:

- Giữ 1 hero
- `Trạng thái bảo vệ` + `policy summary` có thể ở cùng `overview strip`
- `Thiết lập dùng chung`, `Preset từ khóa`, `Spam & ban`, `Bio/link`, `Mẫu tin` phải chuyển thành `workspace tabs`
- Nội dung của tab active phải nằm cùng container
- Bỏ các block trung gian lặp lại `Moderation`

### 4.3 Welcome

Quy hoạch v2:

- Giữ 1 hero
- Gộp `Bật module`, `Tin chào`, `Kiểm tra runtime` thành một workspace theo 3 section dọc
- Không tách popup/config summary thành một block ngang hàng với workspace nếu nó chỉ là phần con của Welcome

### 4.4 Auto reply

Quy hoạch v2:

- Giữ 1 hero
- Summary stats + CTA tạo rule nằm trong cùng workspace header
- `Danh sách rule` là content chính
- `Editor popup` hoặc `detail editor` là flow riêng, không cần thêm block mô tả trung gian

### 4.5 Group

Quy hoạch v2:

- Giữ 1 hero
- Tabs `Thông tin`, `Quyền`, `Nội dung`, `Kỹ thuật` là screen navigation nội bộ
- Không thêm block lặp title `Group` giữa hero và editor
- Warning/info helper nằm trong cùng editor workspace, không đứng thành section độc lập nếu không có nội dung riêng

### 4.6 Bot

Quy hoạch v2:

- Giữ 1 hero
- Summary về runtime/health là stat strip
- CRUD hoặc config nằm trong workspace
- Nếu có log liên quan, log là section phụ, không lặp lại hero domain

### 4.7 Logs

Quy hoạch v2:

- Giữ 1 hero
- Không cần tab nếu chỉ khác filter
- `Hôm nay`, `Severity`, `Action`, `Bot`, `Scope` là filter hoặc segmented sections, không tạo thêm block kể lại cùng title

### 4.8 Module screen

Quy hoạch v2:

- `Module control` là một hub riêng
- Mỗi module card chỉ cần:
  - tên
  - mô tả
  - trạng thái
  - CTA `Mở` hoặc `Cài đặt`
- Không cần nhúng quá nhiều chip nếu không giúp ra quyết định

## 5. Rule thực thi cho codebase hiện tại

### 5.1 Không thêm block mới nếu block đó chỉ lặp title/subtitle/context

Nếu một block mới chỉ lặp:

- tên màn
- mô tả
- bot/scope

thì phải gộp vào hero hiện có.

### 5.2 Tab selector phải ở cùng file/component với content wrapper của nó

Ví dụ:

- `ScamInbox` hoặc `module workspace` phải là nơi sở hữu luôn `TabsBar` nếu tab đó điều khiển nội dung bên trong

Không để `app/page.tsx` render tab, còn child component lại render content như một section độc lập không gắn semantic.

### 5.3 Mỗi màn tối đa 1 primary CTA trong hero

CTA thứ hai nếu có phải bị hạ xuống `outlined` hoặc đưa vào workspace.

### 5.4 Chỉ 1 nơi hiển thị filter dataset chính

Ví dụ:

- `Tất cả / Chạy / Tắt`
- `Pending / Confirmed / Rejected`

chỉ được xuất hiện một lần duy nhất trong flow người dùng.

### 5.5 Mỗi module chỉ có 1 accent, không được tự phát sinh palette riêng

Mapping đề xuất:

- `main`: teal
- `content`: indigo
- `security`: blue
- `scam`: rose/red nhẹ
- `fun`: magenta
- `analytics`: sky

Accent chỉ dùng cho:

- hero eyebrow/icon tint
- active tab underline hoặc tonal background
- section overline nhẹ

Không dùng accent module để tô viền đỏ/hồng mọi block trong màn.

## 6. Thứ tự refactor đề xuất

### Phase 1: IA cleanup

- bỏ block trùng vai trò
- gộp hero
- gộp tab với content
- chỉ giữ 1 filter instance cho mỗi dataset

### Phase 2: Visual cleanup

- chuẩn hóa surface A/B/C
- giảm số biến thể border/tint
- gom chip/status/button về semantic role rõ ràng

### Phase 3: Component cleanup

- tạo shared workspace shell cho module screens
- tạo shared filter bar pattern
- tạo shared queue/list/detail template

## 7. Definition of done

Một màn được xem là đạt chuẩn v2 khi:

- người dùng nhìn 3 giây đầu phân biệt được hero, tab, filter và content
- không có 2 block liên tiếp cùng nhắc lại title/subtitle/domain
- tab active và content active nằm cùng một vùng semantic
- màu sắc không còn tranh vai giữa accent module và trạng thái
- list filter chỉ xuất hiện 1 lần
- empty state, stat card, detail card và config card dùng pattern nhất quán

