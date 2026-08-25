import { SectionPage } from '../../_components/section-page';

export default function ModerationSettingsPage() {
  return (
    <SectionPage title="Cài đặt kiểm duyệt" description="Trang riêng cho moderation policy và các preset an toàn.">
      <p className="muted">Đã tách khỏi welcome/spam/rules để giảm cảm giác nhồi chức năng.</p>
    </SectionPage>
  );
}
