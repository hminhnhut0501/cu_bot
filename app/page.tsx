"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Check,
  Database,
  Edit3,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Search,
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
      setNotice("Da luu.");
      await loadRows(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Row) {
    if (!table || !window.confirm(`Xoa "${titleFor(row, table)}"?`)) {
      return;
    }
    setError("");
    try {
      await api(`/api/${table.key}?id=${row.id}`, { method: "DELETE" });
      await loadRows(search);
      setNotice("Da xoa.");
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
        Dang tai control panel
      </main>
    );
  }

  if (!meta || !table) {
    return <main className="loading">Khong doc duoc cau hinh control panel.</main>;
  }

  if (meta.passwordRequired && !savedPassword) {
    return (
      <main className="login-shell">
        <form className="login-panel" onSubmit={unlock}>
          <Database size={28} />
          <h1>Cu Bot CP</h1>
          <p>Nhap mat khau admin da cau hinh trong Vercel.</p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="CP_ADMIN_PASSWORD"
            autoFocus
          />
          <button type="submit">
            <Check size={17} />
            Dang nhap
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
            <span>Supabase control panel</span>
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
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tim kiem" />
            </form>
            <button type="button" className="icon-button" onClick={() => loadRows(search)} title="Tai lai">
              <RefreshCcw size={17} />
            </button>
            <button type="button" className="primary" onClick={startCreate}>
              <Plus size={17} />
              Them
            </button>
          </div>
        </header>

        {error ? <div className="alert error">{error}</div> : null}
        {notice ? <div className="alert success">{notice}</div> : null}

        <div className="content-grid">
          <section className="table-panel">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Noi dung</th>
                    <th>Enabled</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>
                        <button className="row-title" type="button" onClick={() => startEdit(row)}>
                          {titleFor(row, table)}
                        </button>
                      </td>
                      <td>{row.enabled === false ? "Off" : "On"}</td>
                      <td className="row-actions">
                        <button type="button" title="Sua" onClick={() => startEdit(row)}>
                          <Edit3 size={16} />
                        </button>
                        <button type="button" title="Xoa" onClick={() => remove(row)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!rows.length && !loading ? (
                    <tr>
                      <td colSpan={4} className="empty">
                        Chua co du lieu
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="editor-panel">
            {Object.keys(draft).length ? (
              <form onSubmit={save}>
                <div className="editor-title">
                  <h3>{selected ? "Sua dong" : "Them dong"}</h3>
                  <button type="button" className="icon-button" onClick={() => setDraft({})}>
                    <X size={17} />
                  </button>
                </div>
                <div className="fields">
                  {table.fields.map((field) => (
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
                          <option value="">Mac dinh</option>
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
                    </label>
                  ))}
                </div>
                <button className="primary save" disabled={saving} type="submit">
                  {saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
                  Luu
                </button>
              </form>
            ) : (
              <div className="placeholder">
                <Edit3 size={24} />
                Chon mot dong de sua hoac bam Them.
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
