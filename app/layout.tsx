import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Cu Bot CP",
  description: "Control panel for Cu Bot Supabase data"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
