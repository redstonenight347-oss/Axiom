import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "@google/genai",
      "better-auth",
      "drizzle-orm",
      "@neondatabase/serverless",
    ],
  },
};

export default nextConfig;
