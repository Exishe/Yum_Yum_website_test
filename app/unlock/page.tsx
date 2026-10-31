import Image from "next/image";
import { safeNext } from "@/lib/site-gate";
import { UnlockForm } from "./UnlockForm";

export default async function UnlockPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="dot-grid grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-lift">
        <Image
          src="/images/brand/logo-240.png"
          alt="YUM-YUM Donuts"
          width={64}
          height={64}
          className="rounded-full"
          priority
        />
        <h1 className="mt-4 text-2xl">Փակ դիտում</h1>
        <p className="mt-1 text-sm text-muted">
          Կայքը դեռ պատրաստվում է։ Մուտքագրեք գաղտնաբառը։
          <span className="mt-1 block">Сайт ещё в работе. Введите пароль.</span>
          <span className="block">This site is a private preview. Enter the password.</span>
        </p>
        <UnlockForm next={safeNext(next)} />
      </div>
    </main>
  );
}
