import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.useactora.com" }],
        destination: "https://useactora.com/:path*",
        permanent: true,
      },
      {
        source: "/dashboard/automation",
        destination: "/dashboard/automations",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
