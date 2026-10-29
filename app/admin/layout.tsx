import type { Metadata } from "next";
import "../globals.css";
import { AdminLangProvider } from "@/components/admin/AdminLang";
import { fontVariables } from "@/lib/fonts";
import { adminLang } from "@/lib/admin-lang";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · YUM-YUM admin" },
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const lang = await adminLang();
  return (
    <html lang={lang} className={fontVariables}>
      <body className="min-h-dvh bg-blush">
        <AdminLangProvider lang={lang}>{children}</AdminLangProvider>
      </body>
    </html>
  );
}
