import type { Row } from "./cp-types";

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status = 500, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMessage = `Yêu cầu thất bại với mã lỗi HTTP ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson.error) {
        errorMessage = errorJson.error;
      }
    } catch {
      // fallback to status text
      if (res.statusText) errorMessage = res.statusText;
    }
    throw new ApiError(errorMessage, res.status);
  }
  return res.json();
}

export type TableQueryParams = {
  botKey?: string;
  groupId?: string;
  search?: string;
};

export const apiClient = {
  /**
   * Fetch rows for any supported table
   */
  async getTableRows(table: string, params: TableQueryParams = {}): Promise<{ rows: Row[]; meta?: Record<string, any> }> {
    const searchParams = new URLSearchParams();
    if (params.botKey) searchParams.set("bot_key", params.botKey);
    if (params.groupId) searchParams.set("group_id", params.groupId);
    if (params.search) searchParams.set("search", params.search);

    const url = `/api/${encodeURIComponent(table)}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    return handleResponse(await fetch(url));
  },

  /**
   * Update a single row in any table via PATCH
   */
  async patchTableRow(table: string, id: string | number, values: Record<string, any>): Promise<{ row: Row }> {
    const res = await fetch(`/api/${encodeURIComponent(table)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: Number(id), values }),
    });
    return handleResponse(res);
  },

  /**
   * Insert a new row or multiple rows
   */
  async insertTableRow(table: string, payload: Record<string, any> | { rows: Record<string, any>[] }): Promise<{ row?: Row; rows?: Row[] }> {
    const res = await fetch(`/api/${encodeURIComponent(table)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  /**
   * Delete a row by ID
   */
  async deleteTableRow(table: string, id: string | number): Promise<{ success?: boolean }> {
    const res = await fetch(`/api/${encodeURIComponent(table)}?id=${encodeURIComponent(String(id))}`, {
      method: "DELETE",
    });
    return handleResponse(res);
  },

  /**
   * Fetch platform metadata (tables, bots, groups, roles, etc.)
   */
  async getMeta(): Promise<any> {
    return handleResponse(await fetch("/api/meta"));
  },

  /**
   * Member moderation action (mute, ban, unban, blacklist, etc.)
   */
  async executeMemberAction(payload: {
    action: "mute" | "unmute" | "ban" | "unban" | "blacklist" | "unblacklist";
    target_user_id: string | number;
    bot_key?: string;
    group_id?: string;
    duration_seconds?: number;
    reason?: string;
  }): Promise<{ success: boolean; message?: string }> {
    const res = await fetch("/api/members/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  /**
   * Scam report triage action (confirm, reject, duplicate, need-more-info)
   */
  async executeScamReportAction(
    id: string | number,
    action: "confirm" | "reject" | "duplicate" | "need-more-info",
    payload: { notes?: string; admin_name?: string } = {}
  ): Promise<{ success: boolean; report?: any }> {
    const res = await fetch(`/api/scam_reports/${encodeURIComponent(String(id))}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },
};
