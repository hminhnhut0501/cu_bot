import { SectionPage } from '../_components/section-page';

export default function AuditPage() {
  return (
    <SectionPage title="Nhật ký" description="Xem audit log và filter theo group / actor / resource.">
      <p className="muted">Đã tách riêng để không lẫn với member và moderation.</p>
    </SectionPage>
  );
}
