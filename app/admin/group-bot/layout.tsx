import Link from 'next/link';
import { ReactNode } from 'react';

const sections = [
  { href: '/admin/group-bot', label: 'Tổng quan' },
  { href: '/admin/group-bot/members', label: 'Thành viên' },
  { href: '/admin/group-bot/members/blacklist', label: 'Blacklist' },
  { href: '/admin/group-bot/members/settings', label: 'Cài đặt thành viên' },
  { href: '/admin/group-bot/members/history', label: 'Lịch sử' },
  { href: '/admin/group-bot/moderation/settings', label: 'Cài đặt kiểm duyệt' },
  { href: '/admin/group-bot/moderation/welcome', label: 'Welcome' },
  { href: '/admin/group-bot/moderation/spam', label: 'Chống spam' },
  { href: '/admin/group-bot/moderation/keyword-blacklist', label: 'Từ khóa cấm' },
  { href: '/admin/group-bot/moderation/link-rules', label: 'Chống bot/link' },
  { href: '/admin/group-bot/audit', label: 'Nhật ký' },
  { href: '/admin/group-bot/audit/events', label: 'Sự kiện' },
];

export default function GroupBotLayout({ children }: { children: ReactNode }) {
  return (
    <main className="admin-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">CU BOT / GROUP CONTROL</p>
          <h1>Group Bot Admin</h1>
          <p className="muted">Mỗi submenu là một trang riêng để tránh nhồi quá nhiều control vào cùng một màn hình.</p>
        </div>
        <div className="actions">
          <a className="secondary" href="/admin/group-bot">Dashboard</a>
          <a className="secondary" href="/admin/group-bot/overview">Overview</a>
          <a className="secondary" href="/">Trang chủ</a>
        </div>
      </header>
      <nav className="submenu-nav" aria-label="Group bot submenu">
        {sections.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </main>
  );
}
