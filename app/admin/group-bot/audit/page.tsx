export const dynamic = 'force-dynamic';

import { SectionPage } from '../_components/section-page';
import { listGroups, summarizeAudit } from '@/lib/group-bot/admin-service';

export default async function AuditPage() {
  const { data: groups } = await listGroups();
  const group = groups?.[0] ?? null;
  const sinceAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const summary = group ? await summarizeAudit(group.id, sinceAt) : { data: null };
  const audit = summary.data;

  return (
    <SectionPage title="Nhật ký" description={group ? `Audit live của ${group.title}` : 'Chưa có group nào.'}>
      <div className="section-stack">
        <article className="overview-card">
          <h3>Audit summary</h3>
          {audit ? (
            <div className="overview-metrics">
              <div><span>Tổng</span><strong>{audit.count}</strong><small>24h</small></div>
              <div><span>Families</span><strong>{audit.families.length}</strong><small>nhóm sự kiện</small></div>
              <div><span>Kinds</span><strong>{audit.kinds.length}</strong><small>kiểu sự kiện</small></div>
              <div><span>Actors</span><strong>{audit.top_actors.length}</strong><small>loại actor</small></div>
            </div>
          ) : <p className="muted">Chưa có audit.</p>}
        </article>
        <article className="overview-card">
          <h3>Điểm nhấn</h3>
          {audit?.top_actions?.length ? audit.top_actions.map((item) => (
            <p className="history" key={item.action}>
              <strong>{item.action}</strong>
              <small>{item.count}</small>
            </p>
          )) : <p className="muted">Chưa có action nổi bật.</p>}
        </article>
      </div>
    </SectionPage>
  );
}
