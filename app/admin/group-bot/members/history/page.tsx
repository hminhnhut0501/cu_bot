import { SectionPage } from '../../_components/section-page';

export default function MembersHistoryPage() {
  return (
    <SectionPage title="Sự kiện member" description="Timeline sự kiện của member, tách riêng khỏi danh sách và audit.">
      <div className="section-stack">
        <article className="overview-card">
          <h3>Timeline member</h3>
          <p className="muted">Join, leave, ban, restrict, unban và các event lifecycle khác.</p>
        </article>
        <article className="overview-card">
          <h3>Bộ lọc</h3>
          <p className="muted">Lọc theo loại event, member, và khung thời gian.</p>
        </article>
      </div>
    </SectionPage>
  );
}
