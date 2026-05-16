"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ClipboardPaste,
  Check,
  Database,
  Edit3,
  Loader2,
  Plus,
  Power,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X
} from "lucide-react";

import { FieldConfig, TableConfig } from "@/lib/tables";

type Row = Record<string, any>;

type Meta = {
  tables: TableConfig[];
  passwordRequired: boolean;
};

const defaultBoolean = new Set(["enabled", "daily_enabled", "delete_system_messages", "delete_forwarded_messages"]);
const bulkTables = new Set(["messages", "keywords", "video_messages"]);

function emptyValues(table: TableConfig) {
  const values: Row = {};
  for (const field of table.fields) {
    if (field.type === "boolean") {
      values[field.key] = field.key === "enabled" || defaultBoolean.has(field.key);
    } else if (field.key === "pool" || field.key.endsWith("_pool")) {
      values[field.key] = "default";
    } else if (field.key === "weight") {
      values[field.key] = 1;
    } else {
      values[field.key] = "";
    }
  }
  return values;
}

function titleFor(row: Row, table: TableConfig) {
  return row[table.titleField] || row.key || row.message || row.keyword || row.group_id || `#${row.id}`;
}

function fieldByKey(table: TableConfig, key: string) {
  return table.fields.find((field) => field.key === key);
}

function displayValue(value: unknown) {
  if (value === true) {
    return "Bật";
  }
  if (value === false) {
    return "Tắt";
  }
  if (value === null || value === undefined || value === "") {
    return "Chưa đặt";
  }
  return String(value);
}

function previewText(row: Row, table: TableConfig) {
  const key = table.titleField;
  const raw = row[key] || row.value || row.reason || row.notes || "";
  return String(raw).replace(/\s+/g, " ").trim();
}

function groupedFields(table: TableConfig) {
  const groups: Record<string, FieldConfig[]> = {};
  for (const field of table.fields) {
    const section = field.section || "Thông tin";
    groups[section] = groups[section] || [];
    groups[section].push(field);
  }
  return Object.entries(groups);
}

function splitBulkLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseDelimited(line: string) {
  const delimiter = line.includes("|") ? "|" : line.includes("\t") ? "\t" : line.includes(",") ? "," : "";
  if (!delimiter) {
    return [line];
  }
  return line.split(delimiter).map((part) => part.trim()).filter(Boolean);
}

function parseBulkRows(tableKey: string, text: string) {
  const lines = splitBulkLines(text);
  if (tableKey === "messages") {
    return lines.map((line) => {
      const [message, pool = "default", weight = "1"] = parseDelimited(line);
      return { message, pool, weight: Number(weight) || 1, enabled: true };
    });
  }

  if (tableKey === "keywords") {
    return lines.map((line) => {
      const [keyword, actionOrMatch = "delete", reason = "Từ khóa cấm"] = parseDelimited(line);
      const isMatch = ["contains", "regex"].includes(actionOrMatch);
      return {
        keyword,
        match: isMatch ? actionOrMatch : "contains",
        action: isMatch ? "delete" : actionOrMatch || "delete",
        reason,
        enabled: true
      };
    });
  }

  if (tableKey === "video_messages") {
    return lines.map((line) => {
      const parts = parseDelimited(line);
      const numbers = line.match(/-?\d{5,}/g) || [];
      const fromChatId = parts[0]?.startsWith("-100") ? parts[0] : numbers[0] || "";
      const messageId = parts[1] && /^\d+$/.test(parts[1]) ? parts[1] : numbers[1] || "";
      const caption = parts.length >= 3 ? parts.slice(2).join(" ") : "";
      return {
        from_chat_id: fromChatId,
        message_id: messageId,
        caption,
        pool: "default",
        weight: 1,
        enabled: Boolean(fromChatId && messageId)
      };
    }).filter((row) => row.from_chat_id && row.message_id);
  }

  return [];
}

function bulkHint(tableKey: string) {
  if (tableKey === "messages") {
    return "Mỗi dòng là một tin nhắn. Có thể dùng: nội dung | nhóm nội dung | độ ưu tiên.";
  }
  if (tableKey === "keywords") {
    return "Mỗi dòng là một từ khóa. Có thể dùng: từ khóa | delete/warn/ban | lý do.";
  }
  if (tableKey === "video_messages") {
    return "Mỗi dòng gồm source chat ID và message ID. Ví dụ: -1001234567890 | 456 | caption.";
  }
  return "";
}

export default function HomePage() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [activeKey, setActiveKey] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const [draft, setDraft] = useState<Row>({});
  const [search, setSearch] = useState("");
  const [password, setPassword] = useState("");
  const [savedPassword, setSavedPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("cu_bot_cp_password") || "";
    setSavedPassword(stored);
    setPassword(stored);
    fetch("/api/meta")
      .then((response) => response.json())
      .then((payload: Meta) => {
        setMeta(payload);
        setActiveKey(payload.tables[0]?.key || "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const table = useMemo(() => meta?.tables.find((item) => item.key === activeKey), [activeKey, meta]);
  const parsedBulkRows = useMemo(() => (table ? parseBulkRows(table.key, bulkText) : []), [bulkText, table]);

  async function api(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    if (savedPassword) {
      headers.set("x-cp-password", savedPassword);
    }
    const response = await fetch(path, { ...init, headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        window.localStorage.removeItem("cu_bot_cp_password");
        setSavedPassword("");
      }
      throw new Error(payload.error || "Request failed.");
    }
    return payload;
  }

  async function loadRows(nextSearch = search) {
    if (!table) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const query = nextSearch ? `?search=${encodeURIComponent(nextSearch)}` : "";
      const payload = await api(`/api/${table.key}${query}`);
      setRows(payload.rows || []);
      setSelected(null);
      setDraft({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load rows.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (table && (!meta?.passwordRequired || savedPassword)) {
      void loadRows("");
      setSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, savedPassword, table?.key]);

  function startCreate() {
    if (!table) {
      return;
    }
    setSelected(null);
    setDraft(emptyValues(table));
    setNotice("");
  }

  async function saveBulk() {
    if (!table) {
      return;
    }
    const parsed = parseBulkRows(table.key, bulkText);
    if (!parsed.length) {
      setError("Không nhận diện được dữ liệu. Kiểm tra lại nội dung vừa paste.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api(`/api/${table.key}`, {
        method: "POST",
        body: JSON.stringify({ rows: parsed })
      });
      setNotice(`Đã thêm ${parsed.length} mục.`);
      setBulkText("");
      setBulkOpen(false);
      await loadRows(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể nhập hàng loạt.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(row: Row) {
    setSelected(row);
    setDraft({ ...row });
    setNotice("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!table) {
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (selected?.id) {
        await api(`/api/${table.key}`, {
          method: "PATCH",
          body: JSON.stringify({ id: selected.id, values: draft })
        });
      } else {
        await api(`/api/${table.key}`, {
          method: "POST",
          body: JSON.stringify(draft)
        });
      }
      setNotice("Đã lưu thay đổi.");
      await loadRows(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Row) {
    if (!table || !window.confirm(`Xóa "${titleFor(row, table)}"?`)) {
      return;
    }
    setError("");
    try {
      await api(`/api/${table.key}?id=${row.id}`, { method: "DELETE" });
      await loadRows(search);
      setNotice("Đã xóa.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot delete.");
    }
  }

  async function unlock(event: FormEvent) {
    event.preventDefault();
    window.localStorage.setItem("cu_bot_cp_password", password);
    setSavedPassword(password);
  }

  function updateField(field: FieldConfig, value: string | boolean) {
    setDraft((current) => ({
      ...current,
      [field.key]: field.type === "number" ? (value === "" ? "" : Number(value)) : value
    }));
  }

  if (loading && !meta) {
    return (
      <main className="loading">
        <Loader2 className="spin" size={22} />
        Đang tải control panel
      </main>
    );
  }

  if (!meta || !table) {
    return <main className="loading">Không đọc được cấu hình control panel.</main>;
  }

  if (meta.passwordRequired && !savedPassword) {
    return (
      <main className="login-shell">
        <form className="login-panel" onSubmit={unlock}>
          <Database size={28} />
          <h1>Cu Bot CP</h1>
          <p>Nhập mật khẩu admin đã cấu hình trong Vercel.</p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="CP_ADMIN_PASSWORD"
            autoFocus
          />
          <button type="submit">
            <Check size={17} />
            Đăng nhập
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Database size={24} />
          <div>
            <h1>Cu Bot CP</h1>
            <span>Quản trị Supabase</span>
          </div>
        </div>
        <nav>
          {meta.tables.map((item) => (
            <button
              key={item.key}
              className={item.key === activeKey ? "active" : ""}
              onClick={() => setActiveKey(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <section className="dashboard-strip">
          <div>
            <span>Tổng mục</span>
            <strong>{rows.length}</strong>
          </div>
          <div>
            <span>Đang bật</span>
            <strong>{rows.filter((row) => row.enabled !== false).length}</strong>
          </div>
          <div>
            <span>Màn hình</span>
            <strong>{table.label}</strong>
          </div>
        </section>

        <header className="topbar">
          <div>
            <h2>{table.label}</h2>
            <p>{table.description}</p>
          </div>
          <div className="actions">
            <form
              className="search"
              onSubmit={(event) => {
                event.preventDefault();
                void loadRows(search);
              }}
            >
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm" />
            </form>
            <button type="button" className="icon-button" onClick={() => loadRows(search)} title="Tải lại">
              <RefreshCcw size={17} />
            </button>
            <button type="button" className="primary" onClick={startCreate}>
              <Plus size={17} />
              Thêm
            </button>
            {bulkTables.has(table.key) ? (
              <button type="button" className="secondary" onClick={() => setBulkOpen((value) => !value)}>
                <ClipboardPaste size={17} />
                Nhập nhanh
              </button>
            ) : null}
          </div>
        </header>

        {error ? <div className="alert error">{error}</div> : null}
        {notice ? <div className="alert success">{notice}</div> : null}

        {bulkOpen && bulkTables.has(table.key) ? (
          <section className="bulk-panel">
            <div className="bulk-copy">
              <Sparkles size={20} />
              <div>
                <h3>Paste nhiều dữ liệu</h3>
                <p>{bulkHint(table.key)}</p>
              </div>
            </div>
            <textarea
              value={bulkText}
              onChange={(event) => setBulkText(event.target.value)}
              placeholder={bulkHint(table.key)}
              rows={6}
            />
            <div className="bulk-footer">
              <span>Nhận diện được {parsedBulkRows.length} mục</span>
              <div>
                <button type="button" className="ghost" onClick={() => setBulkText("")}>
                  Xóa nội dung
                </button>
                <button type="button" className="primary" disabled={saving || !parsedBulkRows.length} onClick={saveBulk}>
                  {saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
                  Lưu tất cả
                </button>
              </div>
            </div>
            {parsedBulkRows.length ? (
              <div className="bulk-preview">
                {parsedBulkRows.slice(0, 5).map((row, index) => (
                  <span key={`${index}-${JSON.stringify(row)}`}>
                    {index + 1}. {titleFor(row, table)}
                  </span>
                ))}
                {parsedBulkRows.length > 5 ? <span>... và {parsedBulkRows.length - 5} mục khác</span> : null}
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="content-grid">
          <section className="list-panel">
            <div className="list-header">
              <div>
                <strong>{rows.length}</strong>
                <span> mục</span>
              </div>
              <span>Chọn một mục để chỉnh sửa</span>
            </div>

            <div className="card-list">
              {rows.map((row) => (
                <article className={`data-card ${selected?.id === row.id ? "selected" : ""}`} key={row.id}>
                  <button className="card-main" type="button" onClick={() => startEdit(row)}>
                    <div className="card-title-row">
                      <h3>{titleFor(row, table)}</h3>
                      <span className={row.enabled === false ? "status off" : "status on"}>
                        <Power size={13} />
                        {row.enabled === false ? "Tắt" : "Bật"}
                      </span>
                    </div>
                    <p>{previewText(row, table) || "Chưa có nội dung mô tả."}</p>
                    <div className="meta-grid">
                      {table.summaryFields.map((key) => {
                        const field = fieldByKey(table, key);
                        return (
                          <span className="meta-pill" key={key}>
                            <b>{field?.label || key}</b>
                            {displayValue(row[key])}
                          </span>
                        );
                      })}
                    </div>
                  </button>
                  <div className="card-actions">
                    <button type="button" title="Sửa" onClick={() => startEdit(row)}>
                      <Edit3 size={16} />
                    </button>
                    <button type="button" title="Xóa" onClick={() => remove(row)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
              {!rows.length && !loading ? (
                <div className="empty-state">
                  <ShieldCheck size={28} />
                  <strong>Chưa có dữ liệu</strong>
                  <span>Bấm Thêm để tạo mục đầu tiên.</span>
                </div>
              ) : null}
            </div>
          </section>

          <section className="editor-panel">
            {Object.keys(draft).length ? (
              <form onSubmit={save}>
                <div className="editor-title">
                  <h3>{selected ? "Chỉnh sửa" : "Thêm mới"}</h3>
                  <button type="button" className="icon-button" onClick={() => setDraft({})}>
                    <X size={17} />
                  </button>
                </div>
                <div className="fields">
                  {groupedFields(table).map(([section, fields]) => (
                    <section className="field-section" key={section}>
                      <h4>{section}</h4>
                      {fields.map((field) => (
                        <label key={field.key} className={field.type === "boolean" ? "checkbox-field" : ""}>
                          <span>{field.label}</span>
                          {field.type === "textarea" ? (
                            <textarea
                              value={draft[field.key] ?? ""}
                              onChange={(event) => updateField(field, event.target.value)}
                              placeholder={field.placeholder}
                              rows={field.key === "message" || field.key === "policy_text" || field.key === "value" ? 6 : 3}
                            />
                          ) : field.type === "boolean" ? (
                            <input
                              type="checkbox"
                              checked={Boolean(draft[field.key])}
                              onChange={(event) => updateField(field, event.target.checked)}
                            />
                          ) : field.type === "select" ? (
                            <select value={draft[field.key] ?? ""} onChange={(event) => updateField(field, event.target.value)}>
                              <option value="">Mặc định</option>
                              {field.options?.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type === "number" ? "number" : "text"}
                              value={draft[field.key] ?? ""}
                              onChange={(event) => updateField(field, event.target.value)}
                              placeholder={field.placeholder}
                            />
                          )}
                          {field.helper ? <small>{field.helper}</small> : null}
                        </label>
                      ))}
                    </section>
                  ))}
                </div>
                <button className="primary save" disabled={saving} type="submit">
                  {saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
                  Lưu
                </button>
              </form>
            ) : (
              <div className="placeholder">
                <Edit3 size={24} />
                Chọn một mục để sửa hoặc bấm Thêm.
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
