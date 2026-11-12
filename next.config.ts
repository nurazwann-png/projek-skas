import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Imej kontena kecil untuk Cloud Run (.next/standalone)
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  // Pemacu pangkalan data dimuat terus oleh Node (tidak dibundel)
  serverExternalPackages: ["pg", "@electric-sql/pglite"],
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
