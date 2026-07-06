import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import rehypeSlug from "rehype-slug";
import fs from "fs";
import path from "path";
import {
  getProvincialSlugs,
  getMunicipalitiesByProvince,
} from "./src/lib/jurisdictions";

// Read the federal default fiscal year from the committed data at config time.
// next.config redirects are static, so the destination year is baked in at
// build; reading index.json keeps it in sync with the data without a manual
// bump. Falls back to 2025 if the file is absent (e.g. before the pipeline runs).
function getFederalDefaultYearForConfig(): number {
  try {
    const indexPath = path.join(process.cwd(), "data/federal/index.json");
    const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    return index.defaultYear ?? index.latestYear ?? 2025;
  } catch {
    return 2025;
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // Transpile @buildcanada/charts which exports TypeScript source
  transpilePackages: ["@buildcanada/charts"],
  // Enable MDX Support For .mdx Files
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  experimental: {
    swcPlugins: [["@lingui/swc-plugin", {}]],
  },
  turbopack: {
    rules: {
      "*.po": {
        loaders: ["@lingui/loader"],
        as: "*.js",
      },
    },
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.po$/,
      use: {
        loader: "@lingui/loader",
      },
    });

    return config;
  },
  async redirects() {
    const redirects: Array<{
      source: string;
      destination: string;
      permanent: boolean;
    }> = [
      // Permanent redirects (keep these)
      {
        source: "/:locale/tax-calculator",
        destination: "/:locale/tax-visualizer",
        permanent: true,
      },
      {
        source: "/:locale/first_nations",
        destination: "/:locale/first-nations",
        permanent: true,
      },
      {
        source: "/:locale/first_nations/:path*",
        destination: "/:locale/first-nations/:path*",
        permanent: true,
      },
    ];

    // ========================================================================
    // TEMPORARY REDIRECTS FOR OLD URL STRUCTURE
    // TODO: REMOVE AFTER 2026-03-01
    // These redirects support backward compatibility for the old URL structure
    // that existed before the provincial/municipal/federal restructuring.
    // After March 1, 2026, these can be safely removed as users will have
    // had sufficient time to update bookmarks and external links.
    // ========================================================================

    // Load jurisdiction data (uses cached static-data.json internally)
    const provinces = getProvincialSlugs();
    const municipalitiesByProvince = getMunicipalitiesByProvince();

    // Redirect old federal spending/budget URLs to new structure
    redirects.push(
      {
        source: "/:locale/spending",
        destination: "/:locale/federal/spending",
        permanent: true,
      },
      {
        source: "/:locale/spending/:path*",
        destination: "/:locale/federal/spending/:path*",
        permanent: true,
      },
      {
        source: "/:locale/budget",
        destination: "/:locale/federal/budget",
        permanent: true,
      },
      {
        source: "/:locale/spending-full-screen",
        destination: "/:locale/federal/spending-full-screen",
        permanent: true,
      },
      {
        source: "/:locale/budget-full-screen",
        destination: "/:locale/federal/budget-full-screen",
        permanent: true,
      },
    );

    // ========================================================================
    // FEDERAL DATA-DRIVEN MIGRATION (spec §10)
    // ------------------------------------------------------------------------
    // The 14 hardcoded department folders under
    // src/app/[lang]/(main)/federal/spending/{slug}/ have been deleted in
    // favour of the data-driven /federal/spending/[year]/[department] route.
    // These redirects resolve the legacy yearless department URLs to the
    // default fiscal year's data-driven page. The destination year is read from
    // data/federal/index.json at config time (see getFederalDefaultYearForConfig
    // above); if you ever hardcode it instead, it MUST be bumped whenever the
    // defaultYear in index.json changes.
    // ========================================================================
    const federalDefaultYear = getFederalDefaultYearForConfig();
    const legacyFederalSlugs = [
      "canada-revenue-agency",
      "department-of-finance",
      "employment-and-social-development-canada",
      "global-affairs-canada",
      "health-canada",
      "housing-infrastructure-communities",
      "immigration-refugees-and-citizenship",
      "indigenous-services-and-northern-affairs",
      "innovation-science-and-industry",
      "national-defence",
      "public-safety-canada",
      "public-services-and-procurement-canada",
      "transport-canada",
      "veterans-affairs",
    ];
    for (const slug of legacyFederalSlugs) {
      redirects.push({
        source: `/:locale/federal/spending/${slug}`,
        destination: `/:locale/federal/spending/${federalDefaultYear}/${slug}`,
        permanent: true,
      });
    }

    // Add redirects for old provincial URLs
    for (const province of provinces) {
      redirects.push(
        {
          source: `/:locale/${province}`,
          destination: `/:locale/provincial/${province}`,
          permanent: true,
        },
        {
          source: `/:locale/${province}/:department*`,
          destination: `/:locale/provincial/${province}/:department*`,
          permanent: true,
        },
      );
    }

    // Add redirects for old municipal URLs
    for (const { province, municipalities } of municipalitiesByProvince) {
      for (const municipality of municipalities) {
        redirects.push(
          {
            source: `/:locale/${municipality.slug}`,
            destination: `/:locale/municipal/${province}/${municipality.slug}`,
            permanent: true,
          },
          {
            source: `/:locale/${municipality.slug}/:path*`,
            destination: `/:locale/municipal/${province}/${municipality.slug}/:path*`,
            permanent: true,
          },
        );
      }
    }

    // ========================================================================
    // END TEMPORARY REDIRECTS - REMOVE AFTER 2026-03-01
    // ========================================================================

    return redirects;
  },
  async rewrites() {
    return [
      {
        source: "/ph/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ph/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/ph/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

// MDX Configuration With Rehype Plugins
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [rehypeSlug],
  },
});

export default withMDX(nextConfig);
