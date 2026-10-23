import { SignOut } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "../actions";

const NAV: Array<{ href: string; label: string; admin?: boolean }> = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products & prices" },
  { href: "/admin/categories", label: "Categories", admin: true },
  { href: "/admin/shops", label: "Shops", admin: true },
  { href: "/admin/zones", label: "Delivery zones", admin: true },
  { href: "/admin/reviews", label: "Reviews", admin: true },
  { href: "/admin/texts", label: "Site texts", admin: true },
  { href: "/admin/settings", label: "Settings", admin: true },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/users", label: "Users", admin: true },
  { href: "/admin/audit", label: "Audit log", admin: true },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="on-dark bg-plum text-white lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto">
        <div className="flex items-center gap-3 px-5 py-4">
          <Image
            src="/images/brand/logo-240.png"
            alt=""
            width={40}
            height={40}
            className="rounded-full"
          />
          <div className="min-w-0">
            <p className="font-display text-lg leading-none">YUM-YUM admin</p>
            <p className="truncate text-xs text-white/70">
              {user.name} · {user.role}
            </p>
          </div>
        </div>
        <nav
          aria-label="Admin"
          className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible"
        >
          {NAV.filter((n) => !n.admin || user.role === "admin").map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white"
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/admin/account"
            className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10"
          >
            My account
          </Link>
          <Link
            href="/hy"
            className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-medium text-sun hover:bg-white/10"
          >
            Open the website ↗
          </Link>
          <form action={logoutAction} className="shrink-0">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white/85 hover:bg-white/10"
            >
              <SignOut size={16} aria-hidden /> Sign out
            </button>
          </form>
        </nav>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}
