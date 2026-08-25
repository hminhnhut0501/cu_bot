import { ReactNode } from 'react';
import { GroupBotSidebar } from './_components/sidebar';

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
      <GroupBotSidebar />
      {children}
    </main>
  );
}
