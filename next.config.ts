import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    swcPlugins: [["@lingui/swc-plugin", {}]],
    turbo: {
      rules: {
        "*.po": {
          loaders: ["@lingui/loader"],
          as: "*.js",
        },
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
    return [
      {
        source: "/:locale/tax-calculator",
        destination: "/:locale/tax-visualizer",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/:locale/api/:path*",
        destination: "/api/:path*",
      },
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

export default nextConfig;
