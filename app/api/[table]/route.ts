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

export async function GET(request: NextRequest, { params }: Params) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }
  const config = tableConfig(params.table);
  if (!config) {
    return badRequest("Unknown table.");
  }

  const search = request.nextUrl.searchParams.get("search")?.trim();
  const supabaseAdmin = getSupabaseAdmin();
  let query = dynamicTable(supabaseAdmin, params.table).select("*").order("id", { ascending: true });
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
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ rows: data || [] });
    }

    const payload = cleanPayload(params.table, body);
    const { data, error } = (await dynamicTable(supabaseAdmin, params.table).insert(payload).select("*").single()) as {
      data: unknown;
      error: { message: string } | null;
    };
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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
      return NextResponse.json({ error: error.message }, { status: 500 });
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

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = (await dynamicTable(supabaseAdmin, params.table).delete().eq("id", id)) as {
    error: { message: string } | null;
  };
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
