"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SelectOption = { value: string; label: string; disabled?: boolean; prefix?: string };

/**
 * A dropdown in the site's own style, replacing the browser's native list.
 * Follows the WAI-ARIA "select-only combobox" pattern: the button is a
 * combobox, the list a listbox. Keys: ↑ ↓ Home End move, Enter/Space choose,
 * Esc closes, typing letters jumps to a match. Opens upward when there is no
 * room below.
 */
export function Select({
  id,
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  invalid,
  describedBy,
  label,
  autoComplete,
  className,
  trigger,
  listClassName,
  bare,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: SelectOption[];
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
  /** Accessible name when no <label for> points at the button. */
  label?: string;
  autoComplete?: string;
  className?: string;
  /** Custom content for the closed button (default: the chosen label). */
  trigger?: ReactNode;
  listClassName?: string;
  /** No own border: for a picker that sits inside another field (the phone country). */
  bare?: boolean;
}) {
  const auto = useId();
  const listId = `${id ?? auto}-list`;
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const chosen = options.findIndex((o) => o.value === value);
  const enabled = (i: number) => i >= 0 && i < options.length && !options[i]!.disabled;

  function show(at = chosen) {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setUp(innerHeight - r.bottom < 280 && r.top > innerHeight - r.bottom);
    let i = at;
    if (!enabled(i)) i = options.findIndex((o) => !o.disabled);
    setActive(i);
    setOpen(true);
  }
  function close(focus = true) {
    setOpen(false);
    if (focus) btnRef.current?.focus();
  }
  function choose(i: number) {
    if (!enabled(i)) return;
    onChange(options[i]!.value);
    close();
  }
  function step(from: number, dir: 1 | -1) {
    let i = from;
    for (let n = 0; n < options.length; n++) {
      i = Math.min(options.length - 1, Math.max(0, i + dir));
      if (enabled(i)) return i;
    }
    return from;
  }

  // Close on a click or tap outside.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  // Keep the active option in view.
  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    const k = e.key;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(k)) {
        e.preventDefault();
        show();
      }
      return;
    }
    if (k === "ArrowDown") setActive((a) => step(a, 1));
    else if (k === "ArrowUp") setActive((a) => step(a, -1));
    else if (k === "Home") setActive(step(-1, 1));
    else if (k === "End") setActive(step(options.length, -1));
    else if (k === "Enter" || k === " ") choose(active);
    else if (k === "Escape") close();
    else if (k === "Tab") {
      choose(active);
      return;
    } else if (k.length === 1) {
      const now = Date.now();
      typed.current.text =
        (now - typed.current.at > 700 ? "" : typed.current.text) + k.toLowerCase();
      typed.current.at = now;
      const i = options.findIndex(
        (o, n) => enabled(n) && o.label.toLowerCase().startsWith(typed.current.text),
      );
      if (i >= 0) setActive(i);
      return;
    } else return;
    e.preventDefault();
  }

  const current = chosen >= 0 ? options[chosen]!.label : placeholder;

  return (
    <div ref={rootRef} className={cn("relative", !bare && "mt-1", className)}>
      <button
        ref={btnRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-label={label}
        data-autocomplete={autoComplete}
        onClick={() => (open ? close() : show())}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        className={cn(
          "yy-select flex w-full items-center justify-between text-left text-base font-normal focus-visible:outline-none",
          bare
            ? "h-full gap-1.5 rounded-l-[0.85rem] pr-2.5 pl-3 hover:bg-cream focus-visible:bg-cream"
            : cn(
                "h-12 gap-3 rounded-2xl border-2 bg-white px-4 transition-[border-color,box-shadow] duration-150 ease-out hover:border-plum/50 focus-visible:border-plum",
                invalid ? "border-magenta" : open ? "border-plum" : "border-line",
              ),
        )}
      >
        <span className={cn("min-w-0 truncate", chosen < 0 && "text-muted")}>
          {trigger ?? current}
        </span>
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className={cn(
            "size-4 shrink-0 text-plum transition-transform duration-200 ease-out",
            open && "rotate-180",
          )}
        >
          <path
            d="M3.5 6.2c1.6 1.9 2.9 3.2 4.5 4.3 1.6-1.1 2.9-2.4 4.5-4.3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-labelledby={id}
        hidden={!open}
        className={cn(
          "yy-select-list absolute inset-x-0 z-40 max-h-72 overflow-y-auto overscroll-contain rounded-2xl border-2 border-plum bg-white p-1.5 shadow-lift",
          up ? "bottom-full mb-1.5 origin-bottom" : "top-full mt-1.5 origin-top",
          listClassName,
        )}
      >
        {options.map((o, i) => {
          const selected = i === chosen;
          return (
            <li
              key={`${o.value}-${i}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={selected}
              aria-disabled={o.disabled || undefined}
              onPointerEnter={() => enabled(i) && setActive(i)}
              onClick={() => choose(i)}
              className={cn(
                "flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-[0.9375rem] leading-snug font-normal transition-colors duration-100 select-none",
                i === active && "bg-magenta-soft",
                selected && "font-semibold",
                o.disabled && "pointer-events-none min-h-0 cursor-default py-1 text-muted",
              )}
            >
              <span>
                {o.prefix ? (
                  <span aria-hidden className="me-2">
                    {o.prefix}
                  </span>
                ) : null}
                {o.label}
              </span>
              {selected ? (
                <svg aria-hidden viewBox="0 0 16 16" className="size-4 shrink-0 text-magenta">
                  <path
                    d="M3 8.6c1.2 1 2 1.9 2.8 3C7.6 8.3 9.6 6 13 3.8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
