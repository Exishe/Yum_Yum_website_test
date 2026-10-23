import { getMessages } from "next-intl/server";

/** Plum band with the brand lines scrolling past. */
export async function Ticker({ shopsCount }: { shopsCount: number }) {
  const messages = (await getMessages()) as { ticker: string[] };
  const items = messages.ticker.map((s) => s.replace("{count}", String(shopsCount)));
  const row = (hidden: boolean) =>
    items.map((s, i) => (
      <li
        key={`${hidden}${i}`}
        aria-hidden={hidden || undefined}
        className="flex shrink-0 items-center gap-6"
      >
        <span className="font-display text-2xl whitespace-nowrap text-white sm:text-3xl">{s}</span>
        <span aria-hidden className="size-3 rounded-full bg-sun" />
      </li>
    ));
  return (
    <div className="overflow-hidden bg-plum py-4">
      <ul className="flex w-max animate-marquee gap-6 [animation-duration:36s] motion-reduce:animate-none">
        {row(false)}
        {row(true)}
      </ul>
    </div>
  );
}
