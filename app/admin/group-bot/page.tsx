import Link from 'next/link';

const cards = [
  { href: '/admin/group-bot/members', title: 'Thành viên', desc: 'Danh sách, blacklist, cài đặt, lịch sử.' },
  { href: '/admin/group-bot/moderation/settings', title: 'Kiểm duyệt', desc: 'Cài đặt kiểm duyệt, welcome, spam, rules.' },
  { href: '/admin/group-bot/audit', title: 'Nhật ký', desc: 'Lọc sự kiện, truy vết thay đổi.' },
];

export default function GroupBotDashboardPage() {
  return (
    <section className="overview-grid">
      {cards.map((card) => (
        <article key={card.href} className="overview-card">
          <h3>{card.title}</h3>
          <p className="muted">{card.desc}</p>
          <Link className="secondary" href={card.href}>Mở submenu</Link>
        </article>
      ))}
    </section>
  );
}
