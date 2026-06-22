import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "pub-cb9415de797a46c2b0ed95b68bd5dbca.r2.dev" },
    ],
  },
};

export default nextConfig;
