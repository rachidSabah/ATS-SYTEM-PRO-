import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  
  // Mark packages as external to prevent bundling issues
  serverExternalPackages: ['pdfjs-dist', 'mammoth', 'canvas'],
  
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

// Build version: 4.0 - Switched to pdfjs-dist

export default nextConfig;
