export const dynamic = 'force-dynamic';

import { SectionPage } from '../../_components/section-page';
import { listGroups, fetchGroupAdminBundle } from '@/lib/group-bot/admin-service';

export default async function MembersSettingsPage() {
  const { data: groups } = await listGroups();
  const group = groups?.[0] ?? null;
  const bundle = group ? await fetchGroupAdminBundle(group.id) : null;
  const settings = bundle?.settings.data ?? null;

  return (
    <SectionPage title="Cài đặt thành viên" description={group ? `Thiết lập live của ${group.title}` : 'Chưa có group nào.'}>
      <div className="section-stack">
        <article className="overview-card">
          <h3>Trạng thái</h3>
          <div className="overview-metrics">
            <div><span>Moderation</span><strong>{settings?.moderation_enabled ? 'On' : 'Off'}</strong><small>member policy</small></div>
            <div><span>Welcome</span><strong>{settings?.welcome_enabled ? 'On' : 'Off'}</strong><small>chào thành viên</small></div>
            <div><span>Join gate</span><strong>{settings?.join_gate_enabled ? 'On' : 'Off'}</strong><small>chặn vào nhóm</small></div>
            <div><span>Auto restrict</span><strong>{settings?.auto_restrict_enabled ? 'On' : 'Off'}</strong><small>phản ứng rule</small></div>
          </div>
        </article>
      </div>
    </SectionPage>
  );
}
