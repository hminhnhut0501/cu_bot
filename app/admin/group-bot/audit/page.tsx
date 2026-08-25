import { SectionPage } from '../_components/section-page';

export default function AuditPage() {
  return (
    <SectionPage title="Nhật ký" description="Xem audit log và filter theo group / actor / resource.">
      <div className="section-stack">
        <article className="overview-card">
          <h3>Audit summary</h3>
          <p className="muted">Nhật ký thay đổi cấu hình, blacklist, welcome và moderation.</p>
        </article>
        <article className="overview-card">
          <h3>Điểm nhấn</h3>
          <p className="muted">Audit giữ cho kiểm tra thay đổi tách biệt với timeline sự kiện vận hành.</p>
        </article>
      </div>
    </SectionPage>
  );
}
