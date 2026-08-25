'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const groups = [
  {
    label: 'Tổng quan',
    items: [{ href: '/admin/group-bot', label: 'Trang tổng quan' }],
  },
  {
    label: 'Thành viên',
    items: [
      { href: '/admin/group-bot/members', label: 'Danh sách' },
      { href: '/admin/group-bot/members/blacklist', label: 'Blacklist' },
      { href: '/admin/group-bot/members/settings', label: 'Cài đặt' },
      { href: '/admin/group-bot/members/history', label: 'Lịch sử' },
    ],
  },
  {
    label: 'Kiểm duyệt',
    items: [
      { href: '/admin/group-bot/moderation/settings', label: 'Cài đặt kiểm duyệt' },
      { href: '/admin/group-bot/moderation/welcome', label: 'Welcome' },
      { href: '/admin/group-bot/moderation/spam', label: 'Chống spam' },
      { href: '/admin/group-bot/moderation/keyword-blacklist', label: 'Từ khóa cấm' },
      { href: '/admin/group-bot/moderation/link-rules', label: 'Chống bot/link' },
    ],
  },
  {
    label: 'Nhật ký',
    items: [
      { href: '/admin/group-bot/audit', label: 'Audit' },
      { href: '/admin/group-bot/audit/events', label: 'Sự kiện' },
    ],
  },
];

export function GroupBotSidebar() {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string>('');

  useEffect(() => {
    const current = groups.find((group) => group.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)));
    if (current) setOpenGroup(current.label);
  }, [pathname]);

  return (
    <nav className="group-sidebar" aria-label="Group bot submenu">
      {groups.map((group) => {
        const isCurrent = group.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
        const expanded = openGroup === group.label || (isCurrent && !openGroup);
        return (
          <section key={group.label} className={`sidebar-group ${expanded ? 'open' : ''}`}>
            <button
              type="button"
              className="sidebar-group-title"
              aria-expanded={expanded}
              onClick={() => setOpenGroup((current) => (current === group.label ? '' : group.label))}
            >
              {group.label}
              <span className="sidebar-group-chevron">{expanded ? '−' : '+'}</span>
            </button>
            <div className="sidebar-group-items" hidden={!expanded}>
              {group.items.map((item) => (
                <Link key={item.href} className={pathname === item.href ? 'active' : ''} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </nav>
  );
}
