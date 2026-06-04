import { readFileSync } from "node:fs";

const checks = [
  {
    file: "app/page.tsx",
    patterns: [
      "Hàng đợi vận hành",
      "Dữ liệu kỹ thuật",
      "task-outcome-strip",
      "task-workbench",
      "Thiết lập, kiểm thử và theo dõi bảo vệ",
      "Tạo câu trả lời đúng ngữ cảnh",
      "Duyệt báo cáo và xây hồ sơ scam",
      "scope-breadcrumb",
      "schedule-wizard",
      "scam-inbox",
      "channel-composer",
      "channelPostAction",
      "production-readiness",
      "writeAuditLog",
      "envStatus"
    ]
  },
  {
    file: "app/api/meta/route.ts",
    patterns: [
      "envStatus",
      "SUPABASE_SERVICE_ROLE_KEY",
      "CP_ADMIN_PASSWORD",
      "BOT_TOKEN"
    ]
  },
  {
    file: "app/globals.css",
    patterns: [
      ".ops-task-board",
      ".task-workbench",
      ".guided-flow",
      ".auto-reply-builder",
      ".review-queue-preview",
      ".group-editor-tabs",
      ".schedule-wizard",
      ".scam-inbox",
      ".channel-console",
      ".channel-composer",
      ".production-readiness"
    ]
  }
];

const failures = [];

for (const check of checks) {
  const content = readFileSync(check.file, "utf8");
  for (const pattern of check.patterns) {
    if (!content.includes(pattern)) {
      failures.push(`${check.file} missing "${pattern}"`);
    }
  }
}

if (failures.length) {
  console.error("Admin CP smoke test failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Admin CP smoke test passed.");
