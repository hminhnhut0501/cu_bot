export const dynamic = 'force-dynamic';

import { SectionPage } from '../../_components/section-page';
import { listGroups, fetchGroupAdminBundle } from '@/lib/group-bot/admin-service';
import { GroupScope } from '../../_components/group-scope';

export default async function ModerationSpamPage({ searchParams }: { searchParams?: Promise<{ group_id?: string }> }) {
  const selectedGroupId = (await searchParams)?.group_id ?? '';
  const { data: groups } = await listGroups();
  const group = groups?.find((item) => item.id === selectedGroupId) ?? groups?.[0] ?? null;
  const bundle = group ? await fetchGroupAdminBundle(group.id) : null;
  const settings = bundle?.settings.data ?? null;

  return (
    <SectionPage title="Chống spam" description={group ? `Spam policy live của ${group.title}` : 'Chưa có group nào.'}>
      <div className="section-stack">
        <GroupScope groups={groups ?? []} selectedGroupId={group?.id ?? ''} actionPath="/admin/group-bot/moderation/spam" />
        <article className="overview-card">
          <h3>Thông số hiện tại</h3>
          <div className="overview-metrics">
            <div><span>Window</span><strong>{String(settings?.config_json?.burst_window_seconds ?? 0)}</strong><small>giây</small></div>
            <div><span>Limit</span><strong>{String(settings?.config_json?.burst_message_limit ?? 0)}</strong><small>tin</small></div>
            <div><span>Link limit</span><strong>{String(settings?.config_json?.link_message_limit ?? 0)}</strong><small>spam link</small></div>
            <div><span>Story action</span><strong>{String(settings?.config_json?.story_action ?? 'warn')}</strong><small>xử lý story</small></div>
          </div>
        </article>
      </div>
    </SectionPage>
  );
}
