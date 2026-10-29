import Image from "next/image";
import { redirect } from "next/navigation";
import { LangSwitch } from "@/components/admin/LangSwitch";
import { adminT } from "@/lib/admin-lang";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export async function generateMetadata() {
  return { title: (await adminT())("Sign in") };
}

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  const t = await adminT();
  return (
    <main className="dot-grid grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-lift">
        <div className="mb-4 flex justify-end">
          <LangSwitch lang={t.lang} />
        </div>
        <Image
          src="/images/brand/logo-240.png"
          alt="YUM-YUM Donuts"
          width={64}
          height={64}
          className="rounded-full"
        />
        <h1 className="mt-4 text-3xl">{t("Staff sign-in")}</h1>
        <p className="mt-1 text-sm text-muted">{t("Orders, menu and prices.")}</p>
        <LoginForm />
      </div>
    </main>
  );
}
