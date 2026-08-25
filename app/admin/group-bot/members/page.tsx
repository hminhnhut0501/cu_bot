import { SectionPage } from '../_components/section-page';

export default function MembersPage() {
  return (
    <SectionPage title="Thành viên" description="Trang tổng cho danh sách thành viên và điều hướng sang các submenu con.">
      <div className="overview-metrics">
        <div><span>Danh sách</span><strong>Live</strong><small>search / filter / paginate</small></div>
        <div><span>Blacklist</span><strong>CRUD</strong><small>thêm / sửa / xoá</small></div>
        <div><span>Cài đặt</span><strong>Profile</strong><small>policy thành viên</small></div>
        <div><span>Lịch sử</span><strong>Timeline</strong><small>lọc theo event</small></div>
      </div>
    </SectionPage>
  );
}
