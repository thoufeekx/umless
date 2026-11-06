import type { NextConfig } from "next";

const config: NextConfig = {
  serverExternalPackages: [],
  experimental: { serverActions: { bodySizeLimit: "500mb" } },
};

export default config;
