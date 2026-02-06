"use client";

import { ExternalLink } from "@/components/Layout";
import NoSSR from "@/components/NoSSR";
import { Sankey } from "@/components/Sankey";

export default function SankeyFull() {
  return (
    <div className="sankey-chart-container min-w-[1280px]">
      <NoSSR>
        <Sankey />
      </NoSSR>
      <div className="absolute bottom-3 left-6">
        <ExternalLink
          className="text-xs text-gray-400"
          href="https://www.canada.ca/en/public-services-procurement/services/payments-accounting/public-accounts/2024.html"
        >
          Source
        </ExternalLink>
      </div>
    </div>
  );
}
