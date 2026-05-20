import { readFileSync } from "node:fs";

const checks = [
  {
    file: "app/page.tsx",
    patterns: [
      "Operations console",
      "scope-breadcrumb",
      "GROUP_PRESETS",
      "schedule-wizard",
      "scam-inbox",
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
      ".group-editor-tabs",
      ".schedule-wizard",
      ".scam-inbox",
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
