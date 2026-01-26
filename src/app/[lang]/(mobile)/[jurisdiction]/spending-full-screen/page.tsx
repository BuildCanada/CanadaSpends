import { ExternalLink } from "@/components/Layout";
import { JurisdictionSankey } from "@/components/Sankey/JurisdictionSankey";
import { getJurisdictionData, getJurisdictionSlugs } from "@/lib/jurisdictions";

export function generateStaticParams() {
  const slugs = getJurisdictionSlugs();

  return slugs.map((slug) => ({ jurisdiction: slug }));
}

export default async function FullPageSpending({
  params,
}: {
  params: Promise<{ jurisdiction: string; lang: string }>;
}) {
  const { jurisdiction: slug, lang } = await params;
  const { jurisdiction, sankey } = getJurisdictionData(slug, lang);

  return (
    <div className="min-h-screen bg-white">
      <div className="sankey-chart-container relative overflow-hidden min-h-screen min-w-[1280px]">
        <JurisdictionSankey
          data={sankey}
          // jurisdictionSlug={jurisdiction.slug}
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
