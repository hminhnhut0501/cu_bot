export const dynamic = 'force-dynamic';

import { SectionPage } from '../../_components/section-page';
import { listGroups, fetchGroupAdminBundle } from '@/lib/group-bot/admin-service';
import { GroupScope } from '../../_components/group-scope';

export default async function MembersHistoryPage({ searchParams }: { searchParams?: Promise<{ group_id?: string }> }) {
  const selectedGroupId = (await searchParams)?.group_id ?? '';
  const { data: groups } = await listGroups();
  const group = groups?.find((item) => item.id === selectedGroupId) ?? groups?.[0] ?? null;
  const bundle = group ? await fetchGroupAdminBundle(group.id) : null;
  const events = bundle?.memberEvents.data ?? [];

  return (
    <SectionPage title="Sự kiện member" description={group ? `Timeline live của ${group.title}` : 'Chưa có group nào.'}>
      <div className="section-stack">
        <GroupScope groups={groups ?? []} selectedGroupId={group?.id ?? ''} actionPath="/admin/group-bot/members/history" />
        <article className="overview-card">
          <h3>Timeline member</h3>
          {events.length ? events.slice(0, 12).map((event) => (
            <p className="history" key={event.id}>
              <strong>{event.event_type}</strong> · {event.telegram_user_id}
              <small>{new Date(event.created_at).toLocaleString('vi-VN')}</small>
            </p>
          )) : <p className="muted">Chưa có sự kiện member.</p>}
        </article>
      </div>
    </SectionPage>
  );
}
