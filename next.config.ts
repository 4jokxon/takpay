import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      accounts: "./stubs/accounts/index.js",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      accounts: require.resolve("./stubs/accounts/index.js"),
    };
    return config;
  },
};

export default nextConfig;
