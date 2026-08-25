export const dynamic = 'force-dynamic';

import { SectionPage } from '../_components/section-page';
import { listGroups, fetchGroupAdminBundle } from '@/lib/group-bot/admin-service';

export default async function MembersPage() {
  const { data: groups } = await listGroups();
  const group = groups?.[0] ?? null;
  const bundle = group ? await fetchGroupAdminBundle(group.id) : null;
  const members = bundle?.members.data ?? [];

  return (
    <SectionPage title="Thành viên" description={group ? `Dữ liệu live từ group: ${group.title}` : 'Chưa có group nào.'}>
      <div className="section-stack">
        <article className="overview-card">
          <h3>Tổng số</h3>
          <div className="overview-metrics">
            <div><span>Members</span><strong>{members.length}</strong><small>đang có trong group</small></div>
            <div><span>Active</span><strong>{members.filter((item) => item.status === 'member').length}</strong><small>member</small></div>
            <div><span>Restricted</span><strong>{members.filter((item) => item.status === 'restricted').length}</strong><small>tạm hạn chế</small></div>
            <div><span>Banned</span><strong>{members.filter((item) => item.status === 'banned').length}</strong><small>đã khóa</small></div>
          </div>
        </article>
        <article className="overview-card">
          <h3>Danh sách gần nhất</h3>
          {members.slice(0, 8).length ? members.slice(0, 8).map((member) => (
            <p className="history" key={member.telegram_user_id}>
              <strong>{member.display_name ?? member.username ?? member.telegram_user_id}</strong>
              <small>{member.status}{member.last_seen_at ? ` · ${new Date(member.last_seen_at).toLocaleString('vi-VN')}` : ''}</small>
            </p>
          )) : <p className="muted">Chưa có member nào.</p>}
        </article>
      </div>
    </SectionPage>
  );
}
