import type { TableConfig } from "@/lib/tables";
import { TABLES } from "@/lib/tables";

export type Row = Record<string, any>;
export type BulkRow = Record<string, string | number | boolean | null>;
export type BulkDefaults = {
  bot_key: string;
  pool: string;
  weight: number;
  action: string;
  match: string;
  reason: string;
  risk: string;
  risk_level: string;
  status: string;
  source: string;
  enabled: boolean;
};

export type Meta = {
  tables: TableConfig[];
  passwordRequired: boolean;
  envStatus?: {
    supabaseUrl: boolean;
    serviceRoleKey: boolean;
    cpPassword: boolean;
    botToken: boolean;
    botKey: boolean;
    runtimeMode: string;
  };
};
export const FALLBACK_META: Meta = {
  tables: TABLES,
  passwordRequired: false,
  envStatus: {
    supabaseUrl: false,
    serviceRoleKey: false,
    cpPassword: false,
    botToken: false,
    botKey: false,
    runtimeMode: "fallback"
  }
};
export type Lookups = {
  bots: Row[];
  groups: Row[];
  messages: Row[];
  videos: Row[];
  moduleSettings: Row[];
  scamReports: Row[];
  scamBroadcasts: Row[];
  auditLogs: Row[];
  channelPosts: Row[];
  giveawayEntries: Row[];
  shareUnlockCampaigns: Row[];
  shareUnlockInvites: Row[];
  shareUnlockReferrals: Row[];
};
export type CommandInsight = {
  severity: "critical" | "high" | "warning" | "info" | "healthy";
  title: string;
  body: string;
  impact: string;
  action: string;
  targetLayer: string;
  targetTable: string;
};
export type WorkMode = "overview" | "operate" | "edit";
export type RuleTestResult = {
  label: string;
  detail: string;
  matched: boolean;
};
export type EmptyStateConfig = {
  title: string;
  body: string;
  action: string;
  steps: string[];
};

export type ToastState = {
  type: "success" | "error" | "info";
  message: string;
};

export type DeleteFailureAlert = {
  recentCount: number;
  latestAt: string;
  latestReason: string;
};

export type ChannelPostTab = "queue" | "scheduled" | "sent" | "deleted" | "failed";
export type ChannelButtonDraft = { label: string; url: string; row: number };
export type MemberWorkspaceTab = "observed" | "moderated" | "blacklist" | "left";
export type MemberActionType = "mute" | "ban" | "unmute" | "unban" | "blacklist" | "unblacklist" | "kick";
export type MemberOverview = {
  date?: string;
  filtersApplied?: {
    tab?: string;
    search?: string;
    status?: string;
    source?: string;
    reason?: string;
    sortBy?: string;
    sortDir?: string;
  };
  pagination?: {
    page?: number;
    pageSize?: number;
    total?: number;
    hasNextPage?: boolean;
    nextCursor?: string | null;
  };
  meta?: {
    lastUpdatedAt?: string;
    queryMode?: string;
    snapshotMode?: string;
  };
  summary?: {
    activeToday?: number;
    visibleMembers?: number;
    muted?: number;
    banned?: number;
    blacklisted?: number;
    normalTracked?: number;
  };
  members?: Row[];
  active?: Row[];
  muted?: Row[];
  banned?: Row[];
  blacklisted?: Row[];
  logs?: Row[];
};
export type MemberActionDraft = {
  user_id: string;
  username: string;
  display_name: string;
  action: MemberActionType;
  reason: string;
  duration_seconds: number;
};
export type MemberFilterState = {
  search: string;
  status: "all" | "normal" | "muted" | "banned" | "blacklisted";
  source: "all" | "activity" | "state" | "audit" | "activity+state";
  reason: "all" | "has_reason" | "missing_reason";
  sortBy: "last_seen_at" | "updated_at" | "display_name" | "status" | "reputation";
  sortDir: "asc" | "desc";
};

