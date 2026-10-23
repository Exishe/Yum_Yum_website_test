import type { Metadata } from "next";
import "../globals.css";
import { fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · YUM-YUM admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-dvh bg-blush">{children}</body>
    </html>
  );
}
