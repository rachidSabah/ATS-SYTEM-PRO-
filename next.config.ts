import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  
  // Mark CommonJS packages as external to prevent bundling issues
  serverExternalPackages: ['pdf-parse', 'mammoth'],
};

// Build version: 3.0 - Force Vercel cache clear

export default nextConfig;
