import type { NextConfig } from "next";

const ONE_YEAR = 60 * 60 * 24 * 365;
const ONE_MONTH = 60 * 60 * 24 * 30;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    qualities: [50, 70, 75],
    deviceSizes: [384, 640, 750, 828, 1080],
    imageSizes: [96, 128, 160, 192, 256, 320, 384],
    minimumCacheTTL: ONE_MONTH,
  },
  headers: async () => [
    {
      source: "/_next/static/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: `public, max-age=${ONE_YEAR}, immutable`,
        },
      ],
    },
    {
      source: "/_next/image",
      headers: [
        {
          key: "Cache-Control",
          value: `public, max-age=${ONE_MONTH}, stale-while-revalidate=${ONE_YEAR}`,
        },
      ],
    },
    {
      source: "/:path*.svg",
      headers: [
        {
          key: "Cache-Control",
          value: `public, max-age=${ONE_YEAR}, immutable`,
        },
      ],
    },
  ],
  experimental: {
    cssChunking: "graph",
    inlineCss: true,
  },
  turbopack: {
    resolveAlias: {
      "../build/polyfills/polyfill-module": "./src/lib/modern-polyfill.ts",
      "next/dist/build/polyfills/polyfill-module": "./src/lib/modern-polyfill.ts",
    },
  },
};

export default nextConfig;
