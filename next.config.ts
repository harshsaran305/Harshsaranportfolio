import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next 16 requires quality values used by <Image quality=…> to be allow-listed.
    // 75 is the default; 90 is used by the hero portrait.
    qualities: [75, 90],
  },
};

export default nextConfig;
