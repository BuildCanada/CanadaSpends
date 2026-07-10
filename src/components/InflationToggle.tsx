"use client";

import { cn } from "@/lib/utils";
import { Trans } from "@lingui/react/macro";
import { useInflation } from "./InflationContext";

/**
 * Nominal / real (base-year dollars) toggle. Must be rendered inside an
 * <InflationProvider />. When no CPI multiplier is available for the year
 * (multiplierToBase === 1 and baseYear matches), the toggle still renders but
 * has no visible effect.
 */
export function InflationToggle() {
  const { real, setReal, baseYear } = useInflation();

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-card p-1 text-sm">
      <button
        type="button"
        onClick={() => setReal(false)}
        aria-pressed={!real}
        className={cn(
          "rounded-md px-3 py-1 font-medium transition-colors",
          !real
            ? "bg-auburn-800 text-white"
            : "text-foreground/60 hover:text-foreground",
        )}
      >
        <Trans>Nominal</Trans>
      </button>
      <button
        type="button"
        onClick={() => setReal(true)}
        aria-pressed={real}
        className={cn(
          "rounded-md px-3 py-1 font-medium transition-colors",
          real
            ? "bg-auburn-800 text-white"
            : "text-foreground/60 hover:text-foreground",
        )}
      >
        <Trans>Real ({baseYear} $)</Trans>
      </button>
    </div>
  );
}
