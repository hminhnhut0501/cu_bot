import Link from 'next/link';

type Group = { id: string; telegram_chat_id: string; title: string; username?: string | null; status: string };

export function GroupScope({
  groups,
  selectedGroupId,
  actionPath,
}: {
  groups: Group[];
  selectedGroupId: string;
  actionPath: string;
}) {
  const current = groups.find((group) => group.id === selectedGroupId) ?? null;

  return (
    <article className="overview-card">
      <div className="detail-head">
        <div>
          <h3>Chọn group</h3>
          <p className="muted">
            {current
              ? `Đang áp dụng cho: ${current.title} · ${current.telegram_chat_id}`
              : 'Chưa chọn group nào. Hãy chọn để xem và lưu cấu hình đúng scope.'}
          </p>
        </div>
        <Link className="secondary" href="/admin/group-bot/groups/new">Thêm group / bot</Link>
      </div>
      <form className="toolbar group-scope-form" action={actionPath} method="get">
        <label style={{ margin: 0, flex: 1 }}>
          Group / Channel
          <select name="group_id" defaultValue={selectedGroupId || groups[0]?.id || ''} required>
            <option value="" disabled>Chọn group...</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.title} · {group.telegram_chat_id}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Áp dụng</button>
      </form>
    </article>
  );
}
