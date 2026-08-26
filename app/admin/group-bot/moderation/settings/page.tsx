export const dynamic = 'force-dynamic';

import { SectionPage } from '../../_components/section-page';
import { listGroups, fetchGroupAdminBundle } from '@/lib/group-bot/admin-service';
import { GroupScope } from '../../_components/group-scope';

export default async function ModerationSettingsPage({ searchParams }: { searchParams?: Promise<{ group_id?: string }> }) {
  const selectedGroupId = (await searchParams)?.group_id ?? '';
  const { data: groups } = await listGroups();
  const group = groups?.find((item) => item.id === selectedGroupId) ?? groups?.[0] ?? null;
  const bundle = group ? await fetchGroupAdminBundle(group.id) : null;
  const settings = bundle?.settings.data ?? null;

  return (
    <SectionPage title="Cài đặt kiểm duyệt" description={group ? `Policy live của ${group.title}` : 'Chưa có group nào.'}>
      <div className="section-stack">
        <GroupScope groups={groups ?? []} selectedGroupId={group?.id ?? ''} actionPath="/admin/group-bot/moderation/settings" />
        <article className="overview-card">
          <h3>Moderation live</h3>
          <div className="overview-metrics">
            <div><span>Moderation</span><strong>{settings?.moderation_enabled ? 'On' : 'Off'}</strong><small>core policy</small></div>
            <div><span>Delete link</span><strong>{settings?.delete_link_enabled ? 'On' : 'Off'}</strong><small>lọc link</small></div>
            <div><span>Delete keyword</span><strong>{settings?.delete_keyword_enabled ? 'On' : 'Off'}</strong><small>lọc keyword</small></div>
            <div><span>Welcome</span><strong>{settings?.welcome_enabled ? 'On' : 'Off'}</strong><small>flow chào</small></div>
          </div>
        </article>
      </div>
    </SectionPage>
  );
}
