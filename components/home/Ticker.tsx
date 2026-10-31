import { getMessages } from "next-intl/server";
import { TickerFlip } from "./TickerFlip";

/** Plum band with the brand lines, one at a time. */
export async function Ticker() {
  const { ticker: items } = (await getMessages()) as { ticker: string[] };
  return <TickerFlip items={items} />;
}
