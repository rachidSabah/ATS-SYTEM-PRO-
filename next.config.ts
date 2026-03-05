import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  
  // Add empty turbopack config to silence the warning
  turbopack: {},
  
  // Mark packages as external to prevent bundling issues
  serverExternalPackages: ['pdf-parse', 'mammoth', 'canvas'],
  
  // Webpack configuration for better compatibility
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle canvas module which may be used by pdf libraries
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }
    return config;
  },
};

export default nextConfig;
