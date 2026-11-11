"use client";

import { useState } from "react";

/**
 * Headline with a "negative mask": one magenta strip covers the whole second
 * part left to right, the letters under it turn cream, then it leaves the same
 * way. Pure CSS (see .nm-b in globals.css); hovering plays it again.
 */
export function NegativeTitle({ a, b }: { a: string; b: string }) {
  const [run, setRun] = useState(1);
  return (
    <span onMouseEnter={() => setRun((r) => r + 1)}>
      {a}{" "}
      <span key={run} className="nm-b is-on">
        <span className="nm-t">{b}</span>
      </span>
    </span>
  );
}
