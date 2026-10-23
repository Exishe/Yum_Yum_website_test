import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  return (
    <main className="dot-grid grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-lift">
        <Image src="/images/brand/logo-240.png" alt="YUM-YUM Donuts" width={64} height={64} className="rounded-full" />
        <h1 className="mt-4 text-3xl">Staff sign-in</h1>
        <p className="mt-1 text-sm text-muted">Orders, menu and prices.</p>
        <LoginForm />
      </div>
    </main>
  );
}
