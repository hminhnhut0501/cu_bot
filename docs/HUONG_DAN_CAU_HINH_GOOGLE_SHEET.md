# Hướng Dẫn Cấu Hình Google Sheet Cho Cu Bot

Tài liệu này giải thích chi tiết từng tab, từng cột và các giá trị hợp lệ trong file Google Sheet mẫu:

`outputs/cu_bot_google_sheet_template.xlsx`

Sau khi upload file mẫu lên Google Sheets, hãy giữ nguyên tên các tab để bot đọc đúng cấu hình.

## Nguyên Tắc Chung

- Dòng đầu tiên của mỗi tab là tên cột. Không đổi tên cột nếu không sửa code.
- Cột `enabled` dùng để bật/tắt từng dòng cấu hình.
- Giá trị bật/tắt nên ghi là `true` hoặc `false`.
- Giờ hẹn lịch dùng định dạng 24h: `HH:MM`, ví dụ `20:00`, `23:59`.
- `group_id`, `chat_id`, `from_chat_id` của Telegram group/supergroup thường có dạng `-100xxxxxxxxxx`.
- Nếu một cấu hình có ở cả tab `config` và tab `groups`, giá trị trong tab `groups` sẽ ưu tiên cho group đó.
- Bot chỉ xóa tin, ban user, xóa bot lạ nếu bot đã được cấp admin và có quyền tương ứng trong group.

## Biến Môi Trường Quan Trọng

### Cách đọc sheet khuyến nghị

Khuyến nghị dùng Google Sheets API để bot đọc trực tiếp dữ liệu dạng JSON. Cách này không cần publish từng tab thành CSV và hạn chế lỗi font tiếng Việt.

Trên Render, set:

```text
GOOGLE_SHEET_ID=id_cua_file_google_sheet
GOOGLE_SHEETS_API_KEY=api_key_cua_google
```

`GOOGLE_SHEET_ID` là đoạn nằm trong URL Google Sheet:

```text
https://docs.google.com/spreadsheets/d/GOOGLE_SHEET_ID/edit
```

Tên tab mặc định mà bot đọc:

```text
groups
config
messages
keywords
admins
bot_allowlist
video_messages
```

Nếu tab của bạn đặt tên khác, set thêm:

```text
GOOGLE_SHEET_TABS_JSON={"groups":"Groups","messages":"Messages","config":"Config"}
```

Nếu dùng cách API trực tiếp, bạn không cần set các biến `GROUPS_CSV_URL`, `MESSAGES_CSV_URL`, `CONFIG_CSV_URL`, ...

### Cách CSV cũ

Các biến CSV vẫn còn được hỗ trợ:

```text
GROUPS_CSV_URL
CONFIG_CSV_URL
MESSAGES_CSV_URL
KEYWORDS_CSV_URL
ADMINS_CSV_URL
BOT_ALLOWLIST_CSV_URL
VIDEO_MESSAGES_CSV_URL
```

Tuy nhiên nếu gặp lỗi font tiếng Việt, nên chuyển sang `GOOGLE_SHEET_ID` và `GOOGLE_SHEETS_API_KEY`.

### Tự sửa chữ đã bị lỗi font

Mặc định bot không tự sửa nội dung để tránh đụng vào text gốc của bạn.

Nếu sheet đã lỡ chứa chữ bị lỗi kiểu `Cháº³ng xÃ£...`, có thể bật:

```text
REPAIR_MOJIBAKE=true
```

Nếu sheet đang chứa tiếng Việt đúng, để:

```text
REPAIR_MOJIBAKE=false
```

Ngoài các link CSV, nên cấu hình thêm `OWNER_IDS` trên Render để tài khoản của bạn luôn có quyền chạy lệnh admin của bot.

Ví dụ:

```text
OWNER_IDS=123456789
```

Nếu có nhiều người quản trị bot:

```text
OWNER_IDS=123456789,987654321
```

Các user ID trong `OWNER_IDS` có thể dùng `/reload`, `/checkbio`, `/warn`, `/ban`, `/unban` kể cả khi test trong private chat với bot.

## Tab `README`

Tab này chỉ để hướng dẫn nhanh trong file sheet. Bot không đọc tab này.

### Các Cột

| Cột | Ý nghĩa |
|---|---|
| A-D | Nội dung hướng dẫn cho người quản trị sheet |

Bạn có thể sửa hoặc xóa tab này mà không ảnh hưởng bot.

## Tab `groups`

Tab này chủ yếu quản lý các group cần gửi tin nhắn hẹn giờ hoặc gửi video hẹn giờ. Mỗi dòng tương ứng một group.

Các chức năng quản lý group như xóa tin hệ thống, chống spam, xóa từ khóa cấm, xóa bot lạ, xóa forward và quét bio sẽ tự chạy ở mọi group mà bot được thêm vào và có quyền admin. Bạn không cần khai báo group ID trong tab `groups` chỉ để dọn tin hệ thống.

Tab `groups` vẫn cần thiết cho các chức năng hẹn giờ:

- Gửi tin nhắn random hằng ngày.
- Gửi video random hằng ngày.
- Override cấu hình riêng cho từng group.

Nếu muốn tắt moderation cho một group cụ thể, thêm group đó vào tab `groups` và đặt:

```text
moderation_enabled=false
```

### Cột `group_id`

ID của group Telegram.

Giá trị hợp lệ:

```text
-1001234567890
```

Bắt buộc có nếu muốn gửi tin hẹn giờ vào group.

### Cột `group_name`

Tên gợi nhớ để người quản trị dễ nhìn trong sheet.

Bot không dùng cột này để xử lý logic.

Ví dụ:

```text
Group chính
Cộng đồng VIP
```

### Cột `enabled`

Bật/tắt dòng group trong sheet.

| Giá trị | Ý nghĩa |
|---|---|
| `true` | Bot áp dụng cấu hình dòng này |
| `false` | Bot bỏ qua dòng này |

Lưu ý: `enabled=false` làm bot bỏ qua dòng cấu hình đó, đặc biệt là lịch gửi tin/video. Các chức năng moderation mặc định vẫn có thể chạy theo cấu hình chung trong tab `config`, trừ khi bạn dùng `moderation_enabled=false` cho group đó.

### Cột `moderation_enabled`

Bật/tắt moderation riêng cho group này.

| Giá trị | Ý nghĩa |
|---|---|
| `true` | Bật xóa hệ thống, chống spam, keyword, forward, bio scan |
| `false` | Tắt moderation cho group này |

Nếu không có cột này hoặc để trống, bot xem như:

```text
true
```

### Cột `delete_system_messages`

Xóa các thông báo hệ thống của Telegram trong group.

Các loại thông báo gồm:

- Thành viên mới vào group.
- Thành viên rời group.
- Đổi tên group.
- Đổi ảnh group.
- Xóa ảnh group.
- Tạo group/supergroup.
- Ghim tin nhắn.
- Đổi timer tự xóa tin.

| Giá trị | Ý nghĩa |
|---|---|
| `true` | Xóa thông báo hệ thống |
| `false` | Không xóa |

Khuyến dùng:

```text
true
```

### Cột `delete_forwarded_messages`

Xóa tin nhắn được forward vào group.

| Giá trị | Ý nghĩa |
|---|---|
| `true` | Xóa tin forward |
| `false` | Cho phép tin forward |

Nếu bật, bot sẽ xóa các bài có dấu hiệu forward từ user, group, channel hoặc nguồn ẩn danh.

### Cột `delete_inline_keyboard_messages`

Xóa tin nhắn có nút bấm inline keyboard.

| Giá trị | Ý nghĩa |
|---|---|
| `true` | Xóa bài có nút bấm |
| `false` | Cho phép bài có nút bấm |

Dùng để chặn các bài spam dạng có nút `Join`, `Open`, `Claim`, `Click`, ...

### Cột `delete_messages_from_bots`

Xóa tin nhắn được gửi bởi bot khác.

| Giá trị | Ý nghĩa |
|---|---|
| `true` | Xóa tin từ bot không nằm trong whitelist |
| `false` | Cho bot khác gửi tin |

Bot nằm trong tab `bot_allowlist` sẽ được phép gửi tin.

### Cột `remove_unknown_bots`

Tự động xóa/cấm bot lạ khi bot đó được thêm vào group.

| Giá trị | Ý nghĩa |
|---|---|
| `true` | Cấm bot lạ khi vừa vào group |
| `false` | Không can thiệp bot mới vào |

Bot hợp lệ cần được thêm vào tab `bot_allowlist`.

### Cột `scan_bio_links`

Bật/tắt chức năng quét bio của thành viên để tìm link Telegram.

Bot sẽ kiểm tra bio khi thành viên mới vào group hoặc khi thành viên gửi tin nhắn. Nếu bio có link dạng `t.me/...`, `telegram.me/...` hoặc `telegram.dog/...`, bot sẽ cấm user chat và gửi thông báo yêu cầu gỡ link.

| Giá trị | Ý nghĩa |
|---|---|
| `true` | Bật quét bio và cấm chat user có link Telegram |
| `false` | Tắt quét bio |

Khuyến dùng nếu muốn hạn chế seller kéo link:

```text
true
```

### Cột `bio_scan_cache_seconds`

Thời gian cache kết quả quét bio, đơn vị giây.

Ví dụ:

```text
3600
```

Nghĩa là trong 1 giờ, bot không gọi Telegram API để quét lại bio của cùng một user trong cùng một group. Giá trị này giúp tránh gọi API quá nhiều khi group đông.

Nếu muốn bot quét lại thường xuyên hơn, có thể giảm xuống:

```text
600
```

### Cột `bio_link_restrict_seconds`

Thời gian cấm chat khi bio có link Telegram, đơn vị giây.

| Giá trị | Ý nghĩa |
|---|---|
| `0` | Cấm chat vô thời hạn, admin cần dùng `/checkbio` để mở lại |
| `3600` | Cấm chat 1 giờ |
| `86400` | Cấm chat 1 ngày |

Khuyến dùng:

```text
0
```

Vì mục tiêu là user phải gỡ link rồi nhờ admin kiểm tra lại.

### Cột `bio_link_warning_text`

Mẫu thông báo gửi vào group khi user có link Telegram trong bio.

Có thể dùng các biến:

| Biến | Ý nghĩa |
|---|---|
| `{mention}` | Tên và user ID của người vi phạm |
| `{user_id}` | Telegram user ID |

Ví dụ:

```text
{mention} vui lòng gỡ link Telegram trong bio rồi liên hệ admin để mở chat lại.
```

### Cột `exempt_admins`

Miễn kiểm tra moderation cho admin.

| Giá trị | Ý nghĩa |
|---|---|
| `true` | Admin không bị check spam, keyword, forward |
| `false` | Admin cũng bị check như thành viên thường |

Khuyến dùng:

```text
true
```

### Cột `spam_max_messages`

Số tin nhắn tối đa một user được gửi trong khoảng thời gian `spam_window_seconds`.

Ví dụ:

```text
6
```

Nếu `spam_max_messages=6` và `spam_window_seconds=12`, user gửi tin thứ 7 trong 12 giây sẽ bị xử lý spam.

Đặt `0` nếu muốn tắt kiểm tra spam.

### Cột `spam_window_seconds`

Khoảng thời gian tính spam, đơn vị giây.

Ví dụ:

```text
12
```

Nên dùng trong khoảng:

```text
8 - 30
```

### Cột `spam_action`

Hành động khi user bị phát hiện spam.

Giá trị hợp lệ:

| Giá trị | Ý nghĩa |
|---|---|
| `delete` | Chỉ xóa tin vi phạm |
| `warn` | Xóa tin và cảnh báo user |
| `ban` | Xóa tin và ban user |

Khuyến dùng ban đầu:

```text
warn
```

### Cột `forward_action`

Hành động khi user gửi tin forward.

Giá trị hợp lệ:

```text
delete
warn
ban
```

Khuyến dùng:

```text
warn
```

### Cột `inline_keyboard_action`

Hành động khi user gửi bài có nút inline.

Giá trị hợp lệ:

```text
delete
warn
ban
```

Khuyến dùng:

```text
warn
```

### Cột `ban_after_warnings`

Số lần cảnh báo tối đa trước khi bot ban user.

Ví dụ:

```text
3
```

Nếu user bị warn lần thứ 3, bot sẽ ban user.

Đặt `0` nếu chỉ muốn cảnh báo, không tự động ban theo số lần warn.

### Cột `warning_text`

Mẫu tin nhắn cảnh báo.

Có thể dùng các biến:

| Biến | Ý nghĩa |
|---|---|
| `{reason}` | Lý do cảnh báo |
| `{count}` | Số lần user đã bị cảnh báo |
| `{limit}` | Giới hạn cảnh báo trước khi ban |

Ví dụ:

```text
Cảnh báo: {reason} ({count}/{limit})
```

Kết quả:

```text
Cảnh báo: Từ khóa cấm (1/3)
```

### Cột `daily_enabled`

Bật/tắt gửi tin nhắn hẹn giờ hằng ngày cho group.

| Giá trị | Ý nghĩa |
|---|---|
| `true` | Bật gửi tin random hằng ngày |
| `false` | Tắt gửi tin hằng ngày |

### Cột `daily_window_start`

Giờ bắt đầu khung random gửi tin hằng ngày.

Ví dụ:

```text
20:00
```

### Cột `daily_window_end`

Giờ kết thúc khung random gửi tin hằng ngày.

Ví dụ:

```text
23:59
```

Bot sẽ chọn ngẫu nhiên một thời điểm trong khoảng `daily_window_start` đến `daily_window_end`.

### Cột `send_if_silent`

Quyết định có gửi tin nếu group im lặng hay không.

| Giá trị | Ý nghĩa |
|---|---|
| `true` | Vẫn gửi kể cả group không có ai nhắn |
| `false` | Chỉ gửi nếu group có tương tác trước đó |

Khuyến dùng:

```text
false
```

Để tránh bot tự nói một mình trong group im lặng.

### Cột `message_pool`

Nhóm nội dung sẽ được lấy trong tab `messages`.

Ví dụ:

```text
default
sales
vip
```

Bot chỉ random các dòng trong tab `messages` có cột `pool` trùng với `message_pool` của group.

### Cột `video_enabled`

Bật/tắt gửi video random hằng ngày.

| Giá trị | Ý nghĩa |
|---|---|
| `true` | Bật gửi video random |
| `false` | Tắt gửi video |

### Cột `video_window_start`

Giờ bắt đầu khung random gửi video.

Ví dụ:

```text
21:00
```

### Cột `video_window_end`

Giờ kết thúc khung random gửi video.

Ví dụ:

```text
23:00
```

### Cột `video_pool`

Nhóm video sẽ được lấy trong tab `video_messages`.

Ví dụ:

```text
default
promo
funny
```

### Cột `policy_text`

Nội quy riêng cho group này.

Nếu cột này để trống, bot sẽ lấy `policy_text` từ tab `config`.

Ví dụ:

```text
Nội quy group VIP:
1. Không spam.
2. Không quảng cáo.
3. Tôn trọng thành viên.
```

### Cột `notes`

Ghi chú nội bộ cho người quản trị sheet.

Bot không dùng cột này để xử lý logic.

## Tab `config`

Tab này chứa cấu hình mặc định cho toàn bộ bot. Mỗi dòng là một cặp `key` và `value`.

### Cột `key`

Tên cấu hình.

Ví dụ:

```text
policy_text
delete_system_messages
spam_max_messages
```

Không nên đổi tên key nếu không sửa code.

### Cột `value`

Giá trị của cấu hình.

Kiểu giá trị tùy thuộc vào từng key:

- `true` / `false`
- Số, ví dụ `6`, `12`, `3`
- Giờ, ví dụ `20:00`
- Chuỗi nội dung, ví dụ nội quy group

### Cột `enabled`

Bật/tắt dòng cấu hình.

| Giá trị | Ý nghĩa |
|---|---|
| `true` | Bot sử dụng dòng cấu hình |
| `false` | Bot bỏ qua dòng cấu hình |

### Các Key Quan Trọng

| Key | Giá trị mẫu | Ý nghĩa |
|---|---|---|
| `policy_text` | Nội quy nhóm... | Nội quy mặc định |
| `delete_system_messages` | `true` | Xóa thông báo hệ thống |
| `delete_forwarded_messages` | `true` | Xóa tin forward |
| `delete_inline_keyboard_messages` | `true` | Xóa bài có nút inline |
| `delete_messages_from_bots` | `true` | Xóa tin từ bot không whitelist |
| `remove_unknown_bots` | `true` | Cấm bot lạ mới vào |
| `scan_bio_links` | `true` | Quét bio và cấm chat user có link Telegram |
| `bio_scan_cache_seconds` | `3600` | Thời gian cache kết quả quét bio |
| `bio_link_restrict_seconds` | `0` | Thời gian cấm chat khi bio có link |
| `bio_link_warning_text` | `{mention} vui lòng gỡ link Telegram trong bio rồi liên hệ admin để mở chat lại.` | Thông báo khi bio có link |
| `exempt_admins` | `true` | Miễn check cho admin |
| `spam_max_messages` | `6` | Số tin tối đa trong cửa sổ spam |
| `spam_window_seconds` | `12` | Số giây của cửa sổ spam |
| `spam_action` | `warn` | Hành động khi spam |
| `forward_warning_reason` | `Không được forward video/bài vào nhóm.` | Lý do cảnh báo khi user forward video/bài |
| `forward_warning_text` | `{mention} vui lòng không forward video/bài vào nhóm. ({count}/{limit})` | Nội dung cảnh báo forward, có tag người vi phạm |
| `forward_warning_delete_seconds` | `180` | Tự xóa cảnh báo forward sau số giây này. Đặt `0` để không tự xóa |
| `warning_notice_delete_seconds` | `180` | Tự xóa toàn bộ cảnh báo thường sau số giây này. Đặt `0` để không tự xóa |
| `media_spam_max_messages` | `3` | Số sticker/media tối đa trong cửa sổ spam |
| `media_spam_window_seconds` | `10` | Số giây của cửa sổ spam sticker/media |
| `media_spam_action` | `restrict` | Hành động khi spam sticker/media |
| `spam_restrict_seconds` | `300` | Thời gian tạm cấm chat khi spam |
| `bio_link_notice_delete_seconds` | `30` | Tự xóa thông báo bio sau số giây này |
| `spam_notice_delete_seconds` | `20` | Tự xóa thông báo spam sau số giây này |
| `forward_action` | `warn` | Hành động khi forward |
| `inline_keyboard_action` | `warn` | Hành động khi có nút inline |
| `ban_after_warnings` | `3` | Số lần warn trước khi ban |
| `daily_window_start` | `20:00` | Giờ bắt đầu gửi tin random |
| `daily_window_end` | `23:59` | Giờ kết thúc gửi tin random |
| `send_if_silent` | `false` | Có gửi khi group im lặng không |
| `send_on_boot` | `false` | Có gửi tin ngay khi bot khởi động không |

## Tab `messages`

Tab này chứa danh sách tin nhắn để bot random gửi hằng ngày hoặc trả lời `/start`.

### Cột `message`

Nội dung tin nhắn.

Ví dụ:

```text
Chào cả nhà, chúc mọi người một ngày vui vẻ.
```

Có thể viết nhiều dòng trong một ô nếu Google Sheets cho phép xuống dòng.

### Cột `pool`

Nhóm nội dung.

Ví dụ:

```text
default
sales
vip
```

Group nào có `message_pool=default` thì chỉ lấy tin có `pool=default`.

Nếu để trống, bot xem như:

```text
default
```

### Cột `weight`

Trọng số random.

Giá trị càng cao, tin đó càng dễ được chọn.

Ví dụ:

| message | weight |
|---|---|
| Tin A | 1 |
| Tin B | 3 |

Tin B có khả năng được chọn cao hơn Tin A.

Nếu để trống, bot xem như:

```text
1
```

### Cột `enabled`

Bật/tắt tin nhắn.

| Giá trị | Ý nghĩa |
|---|---|
| `true` | Tin được đưa vào danh sách random |
| `false` | Tin bị bỏ qua |

## Tab `keywords`

Tab này chứa danh sách từ khóa cấm.

### Cột `keyword`

Từ khóa hoặc mẫu cần chặn.

Ví dụ:

```text
casino
t.me/spam
free money
```

Bot sẽ kiểm tra trong text và caption của tin nhắn.

### Cột `match`

Kiểu so khớp.

| Giá trị | Ý nghĩa |
|---|---|
| `contains` | Chỉ cần nội dung có chứa keyword |
| `regex` | Dùng biểu thức chính quy |

Khuyến dùng nếu không rành kỹ thuật:

```text
contains
```

### Cột `action`

Hành động khi phát hiện keyword.

| Giá trị | Ý nghĩa |
|---|---|
| `delete` | Xóa tin vi phạm |
| `warn` | Xóa tin và cảnh báo user |
| `ban` | Xóa tin và ban user |

### Cột `delete`

Quyết định có xóa tin chứa từ khóa cấm hay không.

| Giá trị | Ý nghĩa |
|---|---|
| `true` | Xóa tin vi phạm. Đây là mặc định nếu để trống |
| `false` | Không xóa tin, chỉ thực hiện action |

Khuyến dùng:

```text
true
```

### Cột `reason`

Lý do hiện trong tin cảnh báo.

Ví dụ:

```text
Từ khóa cấm
Link spam
Nội dung quảng cáo
```

Nếu để trống, bot dùng lý do mặc định:

```text
Từ khóa cấm.
```

### Cột `enabled`

Bật/tắt dòng keyword.

| Giá trị | Ý nghĩa |
|---|---|
| `true` | Keyword đang hoạt động |
| `false` | Keyword bị bỏ qua |

## Tab `admins`

Tab này khai báo admin bổ sung cho bot.

Bot vẫn tự nhận Telegram admin thật trong group. Tab này dùng khi bạn muốn cấp quyền dùng lệnh bot cho một user cụ thể.

### Cột `user_id`

Telegram user ID của admin.

Ví dụ:

```text
123456789
```

### Cột `chat_id`

Group mà admin này được cấp quyền.

Ví dụ:

```text
-1001234567890
```

Nếu để trống, dòng admin có thể áp dụng rộng hơn tùy cách code xử lý hiện tại. Khuyến dùng: luôn điền `chat_id`.

### Cột `enabled`

Bật/tắt quyền admin bổ sung.

| Giá trị | Ý nghĩa |
|---|---|
| `true` | User được dùng lệnh admin của bot |
| `false` | User không được tính là admin bổ sung |

## Tab `bot_allowlist`

Tab này khai báo bot được phép tồn tại hoặc gửi tin trong group.

Nếu bot khác không nằm trong whitelist và cấu hình đang bật, Cu Bot có thể xóa tin của bot đó hoặc cấm bot đó khi vừa vào group.

### Cột `bot_id`

Telegram user ID của bot được phép.

Ví dụ:

```text
123456789
```

Có thể để trống nếu đã điền `username`.

### Cột `username`

Username của bot, không bắt buộc có dấu `@`.

Ví dụ:

```text
helpful_bot
@helpful_bot
```

### Cột `chat_id`

Group mà bot này được phép hoạt động.

Ví dụ:

```text
-1001234567890
```

Nếu để trống, bot có thể được phép ở mọi group. Khuyến dùng: điền rõ `chat_id`.

### Cột `enabled`

Bật/tắt dòng whitelist.

| Giá trị | Ý nghĩa |
|---|---|
| `true` | Bot trong dòng này được phép |
| `false` | Dòng whitelist bị bỏ qua |

## Tab `video_messages`

Tab này chứa danh sách video nguồn để bot copy ẩn danh vào group theo lịch.

Bot dùng `copy_message`, không dùng `forward_message`, nên group đích không thấy nguồn forward gốc.

### Cột `from_chat_id`

ID group/channel/chat nguồn đang chứa video.

Ví dụ:

```text
-1009876543210
```

Bot phải có quyền truy cập chat nguồn này.

### Cột `message_id`

ID của tin nhắn video trong chat nguồn.

Ví dụ:

```text
456
```

Cần lấy đúng `message_id` của tin video cần copy.

### Cột `caption`

Caption mới khi bot copy video sang group đích.

Ví dụ:

```text
Video hôm nay
```

Nếu để trống, bot giữ caption mặc định theo hành vi Telegram API/thư viện.

### Cột `pool`

Nhóm video.

Ví dụ:

```text
default
promo
vip
```

Group nào có `video_pool=default` thì chỉ lấy video có `pool=default`.

### Cột `weight`

Trọng số random video.

Giá trị càng cao, video càng dễ được chọn.

Ví dụ:

| video | weight |
|---|---|
| Video A | 1 |
| Video B | 3 |

Video B có khả năng được chọn cao hơn.

### Cột `enabled`

Bật/tắt video trong danh sách random.

| Giá trị | Ý nghĩa |
|---|---|
| `true` | Video được đưa vào danh sách random |
| `false` | Video bị bỏ qua |

## Bảng Giá Trị Hành Động

Những cột sau dùng chung bộ giá trị hành động:

- `spam_action`
- `forward_action`
- `inline_keyboard_action`
- `keywords.action`

| Giá trị | Bot sẽ làm gì |
|---|---|
| `delete` | Xóa tin nhắn vi phạm, không cảnh báo |
| `warn` | Xóa tin nhắn vi phạm và tăng số lần cảnh báo |
| `ban` | Xóa tin nhắn vi phạm và ban user |

## Bảng Giá Trị Boolean

Những giá trị sau được xem là bật:

```text
true
1
yes
on
enabled
y
x
```

Những giá trị khác nên xem như tắt. Để dễ quản lý, khuyến dùng chỉ ghi:

```text
true
false
```

## Cấu Hình Đề Xuất Ban Đầu

Với group mới, nên dùng cấu hình an toàn:

```text
delete_system_messages = true
delete_forwarded_messages = true
delete_inline_keyboard_messages = true
delete_messages_from_bots = true
remove_unknown_bots = true
exempt_admins = true
spam_max_messages = 6
spam_window_seconds = 12
spam_action = warn
forward_action = warn
inline_keyboard_action = warn
ban_after_warnings = 3
send_if_silent = false
send_on_boot = false
```

Nếu group có nhiều thành viên chat nhanh, tăng:

```text
spam_max_messages = 10
spam_window_seconds = 15
```

Nếu group bị spam nặng, dùng:

```text
spam_action = ban
forward_action = ban
```

## Quy Trình Cập Nhật Sheet

1. Sửa nội dung trong Google Sheets.
2. Chờ bot tự đọc lại theo cache, mặc định khoảng 120 giây.
3. Hoặc gõ lệnh trong group:

```text
/reload
```

4. Test lại bằng cách gửi tin mẫu vào group.

## Lệnh Admin Liên Quan Đến Bio

### `/checkbio`

Quét lại bio của một user.

Cách dùng bằng reply:

```text
/checkbio
```

Reply lệnh này vào tin nhắn của user cần kiểm tra.

Cách dùng bằng user ID:

```text
/checkbio 123456789
```

Nếu bio vẫn còn link Telegram, bot tiếp tục cấm chat user đó. Nếu bio đã sạch, bot mở quyền chat lại.

## Lệnh Kiểm Tra Group

### `/debuggroup`

Dùng trong từng group để kiểm tra bot đang có quyền gì và cấu hình moderation hiện tại là gì.

Lệnh:

```text
/debuggroup
```

Bot sẽ trả về các thông tin như:

- `chat_id`
- trạng thái admin của bot
- `can_delete_messages`
- `can_restrict_members`
- `delete_system_messages`
- `spam_max_messages`
- `spam_window_seconds`
- `scan_bio_links`

Nếu group nào xóa được, group nào không xóa được, hãy chạy `/debuggroup` trong cả hai group để so sánh quyền.

## Privacy Mode Của BotFather

Chức năng chống spam cần bot nhận được tin nhắn thường trong group. Nếu Privacy Mode của BotFather đang bật, bot có thể chỉ nhận lệnh, reply, mention và một số service message; khi đó chống spam sẽ lúc hoạt động lúc không.

Cách tắt:

1. Mở Telegram, vào `@BotFather`.
2. Gõ:

```text
/setprivacy
```

3. Chọn bot của bạn.
4. Chọn:

```text
Disable
```

5. Restart/redeploy bot trên Render.

## Lỗi Thường Gặp

### Bot không xóa được tin

Kiểm tra:

- Bot đã là admin chưa.
- Bot có quyền `Delete messages` chưa.
- `group_id` có đúng không.
- Dòng group có `enabled=true` không.

### Bot không ban được user

Kiểm tra:

- Bot có quyền `Ban users` chưa.
- User bị ban có phải admin không. Telegram không cho bot ban admin cấp cao hơn.

### Bot không gửi tin hẹn giờ

Kiểm tra:

- Tab `groups` có group_id đúng.
- `daily_enabled=true`.
- Tab `messages` có tin `enabled=true`.
- `message_pool` trong `groups` có trùng với `pool` trong `messages` không.
- Nếu `send_if_silent=false`, group phải có người thật nhắn tin trước đó.

### Bot không gửi video

Kiểm tra:

- `video_enabled=true`.
- `video_pool` trong `groups` trùng với `pool` trong `video_messages`.
- `from_chat_id` và `message_id` đúng.
- Bot có quyền đọc chat nguồn.

### Bot không quét được bio

Kiểm tra:

- Bot có nhìn thấy user đó trong group không.
- User có từng tương tác với bot/group chưa.
- Telegram API có trả được bio của user đó không. Một số trường hợp quyền riêng tư hoặc API có thể khiến bot không đọc được bio.
- `scan_bio_links=true` trong tab `groups` hoặc `config`.

### User đã gỡ link bio nhưng vẫn chưa chat được

Admin dùng lệnh:

```text
/checkbio
```

Reply vào user đó, hoặc dùng:

```text
/checkbio 123456789
```

Nếu bio đã sạch, bot sẽ mở chat lại.

### Sửa sheet nhưng bot chưa cập nhật

Dùng lệnh:

```text
/reload
```

Hoặc đợi bot tự đọc lại sau thời gian cache.
