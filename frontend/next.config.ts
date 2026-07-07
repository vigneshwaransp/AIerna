import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* ------------------------------------------------------------------ */
  /* React                                                                 */
  /* ------------------------------------------------------------------ */
  reactStrictMode: true,

  /* ------------------------------------------------------------------ */
  /* Images                                                                */
  /* ------------------------------------------------------------------ */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
