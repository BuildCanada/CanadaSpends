"use client";
import NoSSR from "@/components/NoSSR";
import { BudgetSankey } from "@/components/Sankey/BudgetSankey";
import { ExternalLink } from "@/components/Layout";

export default function BudgetFull() {
  return (
    <div className="min-h-screen bg-white">
      <div className="sankey-chart-container relative overflow-hidden min-h-screen min-w-[1280px]">
        <NoSSR>
          <BudgetSankey />
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
    </div>
  );
}
