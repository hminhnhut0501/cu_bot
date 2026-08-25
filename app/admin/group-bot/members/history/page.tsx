import { SectionPage } from '../../_components/section-page';

export default function MembersHistoryPage() {
  return (
    <SectionPage title="Lịch sử" description="Timeline sự kiện của member, tách riêng khỏi danh sách hiện tại.">
      <p className="muted">Trang này sẽ hiển thị history theo event type và thời gian.</p>
    </SectionPage>
  );
}
