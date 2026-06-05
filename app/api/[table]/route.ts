import { NextRequest, NextResponse } from "next/server";

import { isAuthorized } from "@/lib/apiAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { TABLE_MAP } from "@/lib/tables";

export const dynamic = "force-dynamic";

type Payload = Record<string, unknown>;

type BulkPayload = {
  rows?: Payload[];
};

type DynamicTable = {
  select: (columns?: string) => DynamicTable;
  order: (column: string, options?: { ascending?: boolean }) => DynamicTable;
  or: (filters: string) => DynamicTable;
  insert: (payload: Payload | Payload[]) => DynamicTable;
  update: (payload: Payload) => DynamicTable;
  delete: () => DynamicTable;
  eq: (column: string, value: unknown) => DynamicTable;
  single: () => DynamicTable;
  then: Promise<unknown>["then"];
};

type SeedSpec = {
  table: string;
  uniqueKeys?: string[];
};

const BOT_SEED_TABLES: SeedSpec[] = [
  { table: "config", uniqueKeys: ["key"] },
  { table: "module_settings", uniqueKeys: ["bot_key", "module_key"] },
  { table: "captcha_questions", uniqueKeys: ["question"] },
  { table: "reputation_rules", uniqueKeys: ["action_key"] },
  { table: "bot_metrics", uniqueKeys: ["metric_key", "period"] }
];

type Params = {
  params: {
    table: string;
  };
};

function tableConfig(table: string) {
  return TABLE_MAP[table as keyof typeof TABLE_MAP];
}

function dynamicTable(client: ReturnType<typeof getSupabaseAdmin>, table: string) {
  return client.from(table) as unknown as DynamicTable;
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function serverError(error: unknown) {
  const message = error instanceof Error ? error.message : "Server error.";
  const setupError = message.includes("SUPABASE_");
  return NextResponse.json(
    {
      error: setupError
        ? `${message} Kiểm tra Environment Variables trên Vercel trước khi dùng Admin CP.`
        : message
    },
    { status: 500 }
  );
}

function scopedField(config: ReturnType<typeof tableConfig>, candidates: string[]) {
  return candidates.find((candidate) => config?.fields.some((field) => field.key === candidate));
}

function applyScopeFilters(query: DynamicTable, config: ReturnType<typeof tableConfig>, request: NextRequest) {
  const botKey = request.nextUrl.searchParams.get("bot_key")?.trim();
  const groupId = request.nextUrl.searchParams.get("group_id")?.trim();

  if (botKey) {
    const field = scopedField(config, ["bot_key"]);
    if (field) {
      query = query.eq(field, botKey);
    }
  }

  if (groupId) {
    const field = scopedField(config, ["group_id", "chat_id"]);
    if (field) {
      query = query.eq(field, groupId);
    }
  }

  return query;
}

function cleanPayload(table: string, payload: Record<string, unknown>) {
  const config = tableConfig(table);
  const allowed = new Map(config.fields.map((field) => [field.key, field]));
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    const field = allowed.get(key);
    if (!field) {
      continue;
    }
    if (value === "") {
      cleaned[key] = null;
      continue;
    }
    if (field.type === "number") {
      cleaned[key] = value === null || value === undefined ? null : Number(value);
      continue;
    }
    if (key === "settings" && typeof value === "string") {
      cleaned[key] = value.trim() ? JSON.parse(value) : {};
      continue;
    }
    if (field.type === "boolean") {
      cleaned[key] = Boolean(value);
      continue;
    }
    cleaned[key] = value;
  }

  for (const field of config.fields) {
    if (field.required && !cleaned[field.key]) {
      throw new Error(`${field.label} is required.`);
    }
  }

  return cleaned;
}

function cloneSeedRow(row: Payload, botKey: string) {
  const cloned: Payload = {};
  for (const [key, value] of Object.entries(row)) {
    if (["id", "created_at", "updated_at"].includes(key)) {
      continue;
    }
    cloned[key] = key === "bot_key" ? botKey : value;
  }
  cloned.bot_key = botKey;
  return cloned;
}

function seedKey(row: Payload, keys: string[]) {
  return keys.map((key) => String(row[key] ?? "")).join("::");
}

async function seedBotDefaults(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>, botKey: unknown) {
  const targetBotKey = String(botKey || "").trim();
  if (!targetBotKey || targetBotKey === "main") {
    return;
  }

  for (const spec of BOT_SEED_TABLES) {
    const { data: sourceRows, error: sourceError } = (await dynamicTable(supabaseAdmin, spec.table)
      .select("*")
      .eq("bot_key", "main")) as { data: Payload[] | null; error: { message: string } | null };
    if (sourceError || !sourceRows?.length) {
      continue;
    }

    const { data: targetRows, error: targetError } = (await dynamicTable(supabaseAdmin, spec.table)
      .select("*")
      .eq("bot_key", targetBotKey)) as { data: Payload[] | null; error: { message: string } | null };
    if (targetError) {
      continue;
    }

    const targetKeys = new Set((targetRows || []).map((row) => seedKey(row, spec.uniqueKeys || [])));
    const rowsToInsert = sourceRows
      .filter((row) => !targetKeys.has(seedKey(row, spec.uniqueKeys || [])))
      .map((row) => cloneSeedRow(row, targetBotKey));

    if (rowsToInsert.length) {
      await dynamicTable(supabaseAdmin, spec.table).insert(rowsToInsert);
    }
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }
  const config = tableConfig(params.table);
  if (!config) {
    return badRequest("Unknown table.");
  }

  try {
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const supabaseAdmin = getSupabaseAdmin();
    let query = dynamicTable(supabaseAdmin, params.table)
      .select("*")
      .order(params.table === "audit_logs" ? "created_at" : "id", { ascending: params.table !== "audit_logs" });
    query = applyScopeFilters(query, config, request);
    if (search) {
      const searchFields = config.fields.filter((field) => field.type === "text" || field.type === "textarea").slice(0, 5);
      const filter = searchFields.map((field) => `${field.key}.ilike.%${search}%`).join(",");
      if (filter) {
        query = query.or(filter);
      }
    }

    const { data, error } = (await query) as { data: unknown[] | null; error: { message: string } | null };
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ rows: data || [] });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }
  if (!tableConfig(params.table)) {
    return badRequest("Unknown table.");
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = (await request.json()) as Payload & BulkPayload;
    if (Array.isArray(body.rows)) {
      const rows = body.rows.map((row: Payload) => cleanPayload(params.table, row));
      if (!rows.length) {
        return badRequest("No rows to insert.");
      }
      const { data, error } = (await dynamicTable(supabaseAdmin, params.table).insert(rows).select("*")) as {
        data: unknown[] | null;
        error: { message: string } | null;
      };
      if (error) {
        return serverError(new Error(error.message));
      }
      if (params.table === "bots") {
        for (const row of (data || []) as Payload[]) {
          await seedBotDefaults(supabaseAdmin, row.bot_key);
        }
      }
      return NextResponse.json({ rows: data || [] });
    }

    const payload = cleanPayload(params.table, body);
    const { data, error } = (await dynamicTable(supabaseAdmin, params.table).insert(payload).select("*").single()) as {
      data: unknown;
      error: { message: string } | null;
    };
    if (error) {
      return serverError(new Error(error.message));
    }
    if (params.table === "bots") {
      await seedBotDefaults(supabaseAdmin, (data as Payload)?.bot_key ?? payload.bot_key);
    }
    return NextResponse.json({ row: data });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Invalid payload.");
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }
  if (!tableConfig(params.table)) {
    return badRequest("Unknown table.");
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const id = Number(body.id);
    if (!id) {
      return badRequest("Missing id.");
    }
    const payload = cleanPayload(params.table, body.values || {});
    const { data, error } = (await dynamicTable(supabaseAdmin, params.table).update(payload).eq("id", id).select("*").single()) as {
      data: unknown;
      error: { message: string } | null;
    };
    if (error) {
      return serverError(new Error(error.message));
    }
    if (params.table === "bots") {
      await seedBotDefaults(supabaseAdmin, (data as Payload)?.bot_key ?? payload.bot_key);
    }
    return NextResponse.json({ row: data });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Invalid payload.");
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }
  if (!tableConfig(params.table)) {
    return badRequest("Unknown table.");
  }

  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!id) {
    return badRequest("Missing id.");
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = (await dynamicTable(supabaseAdmin, params.table).delete().eq("id", id)) as {
      error: { message: string } | null;
    };
    if (error) {
      return serverError(new Error(error.message));
    }
  } catch (error) {
    return serverError(error);
  }
  return NextResponse.json({ ok: true });
}
