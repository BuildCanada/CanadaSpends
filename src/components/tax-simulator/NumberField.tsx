"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export const inputClass =
  "w-full bg-input/50 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring";

/**
 * Numeric input that keeps the user's raw text while typing and only commits
 * a parsed number upstream. Thresholds commit on blur so rows don't re-sort
 * mid-keystroke. Values below `min` are rejected (the field resets on blur);
 * values above `max` are clamped. Blurring without a change commits nothing,
 * so tabbing through fields never creates overrides.
 */
export function NumberField({
  value,
  onCommit,
  commitOnChange = false,
  suffix,
  prefix,
  className,
  ariaLabel,
  disabled,
  id,
  min = 0,
  max = Infinity,
}: {
  value: number;
  onCommit: (value: number) => void;
  commitOnChange?: boolean;
  suffix?: string;
  prefix?: string;
  className?: string;
  ariaLabel: string;
  disabled?: boolean;
  id?: string;
  min?: number;
  max?: number;
}) {
  const format = (v: number) =>
    prefix === "$" ? Math.round(v).toLocaleString("en-CA") : String(v);
  const [text, setText] = useState(format(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(format(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, focused]);

  const parse = (raw: string) => {
    const n = Number(raw.replace(/[,\s$%]/g, ""));
    if (raw.trim() === "" || !Number.isFinite(n) || n < min) return null;
    return Math.min(n, max);
  };

  const commit = () => {
    const n = parse(text);
    if (n === null) setText(format(value));
    else if (n !== value) onCommit(n);
    else setText(format(value));
  };

  return (
    <div className={cn("relative", className)}>
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50 text-sm">
          {prefix}
        </span>
      )}
      <input
        id={id}
        type="text"
        inputMode="decimal"
        aria-label={ariaLabel}
        disabled={disabled}
        value={text}
        onFocus={() => setFocused(true)}
        onChange={(e) => {
          setText(e.target.value);
          if (commitOnChange) {
            const n = parse(e.target.value);
            if (n !== null) onCommit(n);
          }
        }}
        onBlur={() => {
          setFocused(false);
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className={cn(
          inputClass,
          "tabular-nums text-right disabled:opacity-60",
          prefix && "pl-7",
          suffix && "pr-8",
        )}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 text-sm">
          {suffix}
        </span>
      )}
    </div>
  );
}
