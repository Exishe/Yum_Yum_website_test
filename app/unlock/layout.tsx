import type { Metadata } from "next";
import "../globals.css";
import { fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "YUM-YUM",
  robots: { index: false, follow: false },
};

export default function UnlockLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hy" className={fontVariables}>
      <body className="min-h-dvh bg-cream">{children}</body>
    </html>
  );
}
