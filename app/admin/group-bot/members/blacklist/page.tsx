export const dynamic = 'force-dynamic';

import { SectionPage } from '../../_components/section-page';
import { listGroups, fetchGroupAdminBundle } from '@/lib/group-bot/admin-service';

export default async function MembersBlacklistPage() {
  const { data: groups } = await listGroups();
  const group = groups?.[0] ?? null;
  const bundle = group ? await fetchGroupAdminBundle(group.id) : null;
  const blacklist = bundle?.blacklist.data ?? [];

  return (
    <SectionPage title="Blacklist" description={group ? `Blacklist live của ${group.title}` : 'Chưa có group nào.'}>
      <div className="section-stack">
        <article className="overview-card">
          <h3>Items hiện có</h3>
          {blacklist.length ? blacklist.map((item) => (
            <p className="history" key={item.id}>
              <strong>{item.item_type}</strong> · {item.item_value}
              <small>{item.status}{item.reason ? ` · ${item.reason}` : ''}</small>
            </p>
          )) : <p className="muted">Blacklist đang trống.</p>}
        </article>
      </div>
    </SectionPage>
  );
}
