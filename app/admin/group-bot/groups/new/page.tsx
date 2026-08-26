'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

export default function NewGroupPage() {
  const router = useRouter();
  const [telegramChatId, setTelegramChatId] = useState('');
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function authHeaders() {
    const { data } = await createBrowserSupabaseClient().auth.getSession();
    return { authorization: `Bearer ${data.session?.access_token ?? ''}` };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const response = await fetch('/api/admin/group-bot/groups', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ telegram_chat_id: telegramChatId, title, username: username || null }),
    });
    const result = await response.json();
    if (!response.ok) {
      setSaving(false);
      setError(result.error ?? 'Không tạo được group');
      return;
    }
    router.push('/admin/group-bot?created=1');
  }

  return (
    <section className="overview-card">
      <div className="detail-head">
        <div>
          <h2>Thêm group / bot</h2>
          <p className="muted">Tách riêng flow tạo mới để không lẫn với màn cấu hình.</p>
        </div>
        <a className="secondary" href="/admin/group-bot">Về dashboard</a>
      </div>
      <form className="stack-form" onSubmit={handleSubmit}>
        <label>Group / Channel ID<input value={telegramChatId} onChange={(e) => setTelegramChatId(e.target.value)} required /></label>
        <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
        <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} /></label>
        {error ? <p className="error">{error}</p> : null}
        <button disabled={saving}>{saving ? 'Đang tạo...' : 'Tạo group'}</button>
      </form>
    </section>
  );
}
