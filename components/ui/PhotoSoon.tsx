import { cn } from "@/lib/cn";

/** Typographic stand-in when a product has no real photo yet. Never a fake picture. */
export function PhotoSoon({
  name,
  label,
  className,
}: {
  name: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-magenta-soft p-4 text-center",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute -top-6 -right-6 size-24 rounded-full border-[14px] border-sun/80"
      />
      <span
        aria-hidden
        className="absolute -bottom-8 -left-4 size-20 rounded-full border-[12px] border-magenta/30"
      />
      <span className="relative font-display text-xl leading-tight text-plum">{name}</span>
      <span className="relative mt-1 font-hand text-lg text-magenta-ink">{label}</span>
    </div>
  );
}
