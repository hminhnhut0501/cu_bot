export const dynamic = 'force-dynamic';

import { SectionPage } from '../../_components/section-page';
import { listGroups, fetchGroupAdminBundle } from '@/lib/group-bot/admin-service';

export default async function ModerationWelcomePage() {
  const { data: groups } = await listGroups();
  const group = groups?.[0] ?? null;
  const bundle = group ? await fetchGroupAdminBundle(group.id) : null;
  const welcomes = bundle?.welcome.data ?? [];

  return (
    <SectionPage title="Welcome" description={group ? `Welcome live của ${group.title}` : 'Chưa có group nào.'}>
      <div className="section-stack">
        <article className="overview-card">
          <h3>Templates</h3>
          {welcomes.length ? welcomes.map((item) => (
            <p className="history" key={item.id}>
              <strong>{item.variant_name}</strong> · {item.message_text}
              <small>{item.enabled ? 'enabled' : 'disabled'}</small>
            </p>
          )) : <p className="muted">Chưa có welcome template.</p>}
        </article>
      </div>
    </SectionPage>
  );
}
