import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Semak Pencapaian: sijil PDF/gambar sehingga 10MB dihantar sebagai base64 (~13.4MB)
    proxyClientMaxBodySize: "16mb",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
