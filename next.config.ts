import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard/automation",
        destination: "/dashboard/automations",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
