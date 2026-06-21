export type TaskPriority = "critical" | "high" | "normal";

export type AdminTaskDefinition = {
  id: string;
  title: string;
  description: string;
  outcome: string;
  targetLayer: string;
  targetTable: string;
  priority: TaskPriority;
};

export const ADMIN_TASKS: AdminTaskDefinition[] = [
  {
    id: "connect-bot",
    title: "Kết nối bot và group",
    description: "Thêm bot, kiểm tra token, phát hiện phạm vi hoạt động và hoàn tất quyền cần thiết.",
    outcome: "Bot online và sẵn sàng thao tác trong group/channel.",
    targetLayer: "bot",
    targetTable: "bots",
    priority: "high"
  },
  {
    id: "protect-community",
    title: "Thiết lập bảo vệ cộng đồng",
    description: "Cấu hình spam, forward, link, bio và cách xử lý vi phạm trong một luồng.",
    outcome: "Các group được áp dụng chính sách bảo vệ đã kiểm thử.",
    targetLayer: "module:moderation",
    targetTable: "config",
    priority: "high"
  },
  {
    id: "publish-content",
    title: "Đăng bài lên channel",
    description: "Soạn, xem trước, gửi ngay hoặc hẹn giờ và theo dõi kết quả gửi.",
    outcome: "Bài đăng được gửi hoặc lên lịch thành công.",
    targetLayer: "module:channel_publisher",
    targetTable: "channel_posts",
    priority: "normal"
  },
  {
    id: "schedule-content",
    title: "Tạo lịch gửi tự động",
    description: "Chọn phạm vi, nội dung và thời gian để bot gửi đúng lịch.",
    outcome: "Lịch gửi có nội dung, phạm vi và giờ chạy hợp lệ.",
    targetLayer: "module:automation",
    targetTable: "groups",
    priority: "normal"
  },
  {
    id: "review-incidents",
    title: "Rà soát hành động kiểm duyệt",
    description: "Kiểm tra các lần xóa tin, cảnh báo, hạn chế và ban gần đây.",
    outcome: "Các hành động bất thường được xác minh và xử lý.",
    targetLayer: "logs",
    targetTable: "audit_logs",
    priority: "high"
  },
  {
    id: "review-member-activity",
    title: "Theo dõi thành viên ra vào nhóm",
    description: "Xem lịch sử join/out theo từng group để kiểm tra biến động thành viên.",
    outcome: "Nhật ký thành viên trong group được theo dõi tập trung theo bot và phạm vi.",
    targetLayer: "members",
    targetTable: "audit_logs",
    priority: "normal"
  },
  {
    id: "review-scam",
    title: "Duyệt báo cáo scam",
    description: "Xác nhận báo cáo hợp lệ hoặc từ chối dữ liệu sai.",
    outcome: "Hàng đợi báo cáo scam không còn mục chờ duyệt.",
    targetLayer: "module:anti_scam",
    targetTable: "scam_reports",
    priority: "high"
  },
  {
    id: "build-auto-reply",
    title: "Tạo câu trả lời tự động",
    description: "Tạo trigger, nhiều câu trả lời ngẫu nhiên và kiểm thử trước khi bật.",
    outcome: "Auto reply chỉ phản hồi đúng ngữ cảnh mong muốn.",
    targetLayer: "module:auto_reply",
    targetTable: "auto_replies",
    priority: "normal"
  },
  {
    id: "manage-modules",
    title: "Bật hoặc tắt chức năng",
    description: "Chọn các module bot cần dùng và mở thẳng phần thiết lập tương ứng.",
    outcome: "Sidebar chỉ hiển thị các module đang thực sự vận hành.",
    targetLayer: "modules",
    targetTable: "module_settings",
    priority: "normal"
  }
];

export const TABLE_TASK_LABELS: Record<string, string> = {
  bots: "Kết nối bot",
  groups: "Phạm vi hoạt động",
  module_settings: "Bật chức năng",
  config: "Thiết lập dùng chung",
  admins: "Phân quyền admin",
  member_roles: "Quản lý thành viên",
  audit_logs: "Rà soát sự cố",
  bot_metrics: "Theo dõi sức khỏe",
  keywords: "Quản lý từ khóa chặn",
  domain_blacklist: "Quản lý domain nguy hiểm",
  link_shorteners: "Kiểm soát link rút gọn",
  bot_allowlist: "Cho phép bot tin cậy",
  verification_settings: "Thiết lập xác minh",
  captcha_questions: "Soạn câu hỏi xác minh",
  messages: "Quản lý kho tin",
  video_messages: "Quản lý kho video",
  channel_posts: "Đăng bài lên channel",
  scheduled_posts: "Theo dõi lịch gửi",
  auto_replies: "Tạo câu trả lời tự động",
  scam_reports: "Duyệt báo cáo scam",
  scam_entities: "Quản lý hồ sơ scam",
  giveaway_campaigns: "Vận hành giveaway",
  giveaway_entries: "Xem người tham gia",
  entertainment_events: "Vận hành sự kiện",
  reputation_rules: "Thiết lập điểm thành viên"
};

export const TABLE_PRIMARY_ACTIONS: Record<string, string> = {
  bots: "Kết nối bot",
  groups: "Thêm phạm vi",
  admins: "Phân quyền",
  member_roles: "Thêm thành viên",
  keywords: "Thêm luật chặn",
  domain_blacklist: "Chặn domain",
  link_shorteners: "Chặn link rút gọn",
  bot_allowlist: "Cho phép bot",
  verification_settings: "Thiết lập xác minh",
  captcha_questions: "Thêm câu hỏi",
  messages: "Thêm nội dung",
  video_messages: "Thêm video",
  auto_replies: "Tạo auto reply",
  scam_entities: "Thêm hồ sơ scam",
  scam_reports: "Tạo báo cáo",
  giveaway_campaigns: "Tạo giveaway",
  entertainment_events: "Tạo sự kiện",
  reputation_rules: "Thêm luật điểm"
};
