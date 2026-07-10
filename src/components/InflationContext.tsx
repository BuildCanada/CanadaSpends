"use client";

import { formatNumber } from "@/components/Sankey/utils";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// ---------------------------------------------------------------------------
// Inflation (CPI real/nominal) client islands.
//
// Split into two contexts:
// - InflationModeProvider (mounted once in the [lang] layout): whether the
//   user wants nominal or real dollars. Persisted to localStorage so the
//   choice survives navigation between years/departments and full reloads.
// - InflationProvider (mounted once per federal page): that year's CPI
//   multiplier to base-year (2025) dollars, from summary.json
//   (`inflation.multiplierToBase`). Rather than duplicating JSON, the site
//   scales displayed values client-side.
//
// The toggle affects the whole page: StatCards, Sankey/miniSankey trees,
// entity bar lists, and line-item tables. Percentages are ratios and never
// scale.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "cs-inflation-mode";

type InflationModeValue = {
  real: boolean;
  setReal: (real: boolean) => void;
};

const InflationModeContext = createContext<InflationModeValue>({
  real: false,
  setReal: () => {},
});

export function InflationModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server and first client render are always nominal; localStorage is read
  // after mount so hydration never mismatches.
  const [real, setRealState] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "real") {
        setRealState(true);
      }
    } catch {
      // localStorage unavailable (private mode etc.) — stay nominal.
    }
  }, []);

  const value = useMemo(
    () => ({
      real,
      setReal: (next: boolean) => {
        setRealState(next);
        try {
          window.localStorage.setItem(STORAGE_KEY, next ? "real" : "nominal");
        } catch {
          // Best effort; the in-memory state still applies.
        }
      },
    }),
    [real],
  );

  return (
    <InflationModeContext.Provider value={value}>
      {children}
    </InflationModeContext.Provider>
  );
}

type InflationMultiplierValue = {
  multiplierToBase: number;
  baseYear: number;
};

const InflationMultiplierContext = createContext<InflationMultiplierValue>({
  multiplierToBase: 1,
  baseYear: 2025,
});

export function InflationProvider({
  multiplierToBase,
  baseYear,
  children,
}: {
  multiplierToBase: number;
  baseYear: number;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({ multiplierToBase, baseYear }),
    [multiplierToBase, baseYear],
  );
  return (
    <InflationMultiplierContext.Provider value={value}>
      {children}
    </InflationMultiplierContext.Provider>
  );
}

export function useInflation() {
  const { real, setReal } = useContext(InflationModeContext);
  const { multiplierToBase, baseYear } = useContext(InflationMultiplierContext);
  return { real, setReal, multiplierToBase, baseYear };
}

/** Effective scaling factor for displayed dollar values (1 when nominal). */
export function useInflationScale(): number {
  const { real, multiplierToBase } = useInflation();
  return real ? multiplierToBase : 1;
}

/**
 * Renders a nominal figure (in billions of CAD), scaling it to real base-year
 * dollars when the inflation toggle is active. A function formatter cannot be
 * passed from a server component to a client one, so formatting is done here.
 */
export function InflationValue({ nominal }: { nominal: number }) {
  const scale = useInflationScale();
  // Values are in billions; formatNumber expects a scaling factor to dollars.
  return <>{formatNumber(nominal * scale, 1e9)}</>;
}
