import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "@neondatabase/serverless",
    "ws",
  ],
};

export default nextConfig;
