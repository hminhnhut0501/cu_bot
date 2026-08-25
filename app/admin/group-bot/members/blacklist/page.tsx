import { SectionPage } from '../../_components/section-page';

export default function MembersBlacklistPage() {
  return (
    <SectionPage title="Blacklist" description="Trang riêng cho thêm/sửa/xoá blacklist.">
      <p className="muted">Đây là submenu tách riêng để không bị gộp chung với danh sách thành viên.</p>
    </SectionPage>
  );
}
