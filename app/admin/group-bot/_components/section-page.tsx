import Link from 'next/link';
import { ReactNode } from 'react';

export function SectionPage({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="overview-card">
      <div className="detail-head">
        <div>
          <h2>{title}</h2>
          <p className="muted">{description}</p>
        </div>
        <Link className="secondary" href="/admin/group-bot">Về dashboard</Link>
      </div>
      {children}
    </section>
  );
}
