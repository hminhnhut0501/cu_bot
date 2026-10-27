/**
 * Standardized Query Key Factory for TanStack Query.
 * Ensures consistent cache scoping and granular cache invalidation.
 */
export const queryKeys = {
  // Generic table rows
  table: (tableName: string, botKey?: string, groupId?: string, search?: string) =>
    ["table", tableName, { botKey: botKey || "", groupId: groupId || "", search: search || "" }] as const,

  // Config specific
  config: {
    all: ["config"] as const,
    byScope: (botKey: string, scope: string) => ["config", { botKey: botKey || "main", scope: scope || "all" }] as const,
  },

  // Members overview & actions
  members: {
    overview: (botKey?: string, groupId?: string) => ["members", "overview", { botKey, groupId }] as const,
    detail: (userId: string | number) => ["members", "detail", String(userId)] as const,
  },

  // Scam reports & entities
  scam: {
    inbox: (status?: string) => ["scam", "inbox", { status: status || "all" }] as const,
    entities: ["scam", "entities"] as const,
    broadcasts: ["scam", "broadcasts"] as const,
  },

  // Analytics
  analytics: {
    summary: (botKey?: string, period?: string) => ["analytics", "summary", { botKey, period }] as const,
  },

  // Metadata & health
  meta: ["meta"] as const,
  healthz: ["healthz"] as const,
};
