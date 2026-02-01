import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import rehypeSlug from "rehype-slug";
import {
  getProvincialSlugs,
  getMunicipalitiesByProvince,
} from "./src/lib/jurisdictions";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
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
        source: "/:locale/budget",
        destination: "/:locale/federal/budget",
        permanent: true,
      },
    );

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
