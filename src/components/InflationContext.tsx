"use client";

import { formatNumber } from "@/components/Sankey/utils";
import React, { createContext, useContext, useState } from "react";

// ---------------------------------------------------------------------------
// Inflation (CPI real/nominal) client island.
//
// Each federal year's summary.json carries a CPI multiplier to base-year
// (2025) dollars (`inflation.multiplierToBase`). Rather than duplicating JSON,
// the site scales displayed values client-side when the user toggles to real
// dollars. Scope is intentionally contained (spec §10): the toggle affects the
// headline/department StatCards and the Sankey totals label — not every chart.
// ---------------------------------------------------------------------------

type InflationContextValue = {
  real: boolean;
  setReal: (real: boolean) => void;
  multiplierToBase: number;
  baseYear: number;
};

const InflationContext = createContext<InflationContextValue>({
  real: false,
  setReal: () => {},
  multiplierToBase: 1,
  baseYear: new Date().getFullYear(),
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
  const [real, setReal] = useState(false);
  return (
    <InflationContext.Provider
      value={{ real, setReal, multiplierToBase, baseYear }}
    >
      {children}
    </InflationContext.Provider>
  );
}

export function useInflation() {
  return useContext(InflationContext);
}

/**
 * Renders a nominal figure (in billions of CAD), scaling it to real base-year
 * dollars when the inflation toggle is active. A function formatter cannot be
 * passed from a server component to a client one, so formatting is done here.
 */
export function InflationValue({ nominal }: { nominal: number }) {
  const { real, multiplierToBase } = useInflation();
  const value = real ? nominal * multiplierToBase : nominal;
  // Values are in billions; formatNumber expects a scaling factor to dollars.
  return <>{formatNumber(value, 1e9)}</>;
}
