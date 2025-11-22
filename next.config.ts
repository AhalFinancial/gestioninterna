import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure proper localhost configuration
  async rewrites() {
    return [];
  },
};

export default nextConfig;
