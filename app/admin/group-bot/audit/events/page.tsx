import { SectionPage } from '../../_components/section-page';

export default function AuditEventsPage() {
  return (
    <SectionPage title="Sự kiện" description="Timeline sự kiện vận hành, tách riêng khỏi audit log.">
      <div className="section-stack">
        <article className="overview-card">
          <h3>Sự kiện mới nhất</h3>
          <p className="muted">Sẽ hiển thị các lifecycle event như member join/leave, moderation hit, welcome send.</p>
        </article>
        <article className="overview-card">
          <h3>Lọc nhanh</h3>
          <p className="muted">Filter theo loại sự kiện, member, và khoảng thời gian.</p>
        </article>
      </div>
    </SectionPage>
  );
}
