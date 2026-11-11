"use client";

/*
 * Headline with a "negative mask": magenta shapes slide in behind the words of the second half and
 * the letters inside them turn light, as if the shape cut the text out in negative.
 * After "Design · Negative mask effect", a free template on Jitter
 * (https://jitter.video/template/design-negative-mask-effect/), rebuilt in CSS. Each word carries its
 * own shape (a light copy of the word revealed with clip-path), so it lines up on every screen and
 * wherever the line wraps. Plays once after load and again on hover; with reduced motion the shapes
 * are simply there.
 */
import { useState } from "react";

export function NegativeTitle({ a, b }: { a: string; b: string }) {
  // The CSS animation starts on first paint; hovering bumps the key so it plays again.
  const [run, setRun] = useState(1);
  const words = b.split(" ");
  return (
    <span className="nm" onMouseEnter={() => setRun((r) => r + 1)}>
      {a}{" "}
      {words.map((w, i) => (
        <span key={i}>
          <span className={i === 0 ? "nm-w ms-[0.2em]" : "nm-w"}>
            {w}
            <span
              key={run}
              aria-hidden
              className={run ? "nm-win is-on" : "nm-win"}
              style={{ animationDelay: `${250 + i * 120}ms` }}
            >
              {w}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}
