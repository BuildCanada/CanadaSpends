import { ExternalLink } from "@/components/Layout";
import { JurisdictionSankey } from "@/components/Sankey/JurisdictionSankey";
import { Jurisdiction } from "@/lib/jurisdictions";
import { SankeyData } from "@/components/Sankey/SankeyChartD3";

interface SpendingFullScreenProps {
  jurisdiction: Jurisdiction;
  sankey: SankeyData;
}

export function SpendingFullScreen({
  jurisdiction,
  sankey,
}: SpendingFullScreenProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="sankey-chart-container relative overflow-hidden min-h-screen min-w-[1280px]">
        <JurisdictionSankey
          data={sankey}
          jurisdictionSlug={jurisdiction.slug}
        />
        <div className="absolute bottom-3 left-6">
          <ExternalLink
            className="text-xs text-gray-400"
            href={jurisdiction.source}
          >
            Source
          </ExternalLink>
        </div>
      </div>
    </div>
  );
}
