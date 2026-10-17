import type { NextConfig } from "next";
console.log('hello');
console.log('[next.config] STRAPI_PROTOCOL:', process.env.STRAPI_PROTOCOL);
console.log('[next.config] STRAPI_HOSTNAME:', process.env.STRAPI_HOSTNAME);
console.log('[next.config] STRAPI_PORT:', process.env.STRAPI_PORT);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: process.env.STRAPI_PROTOCOL as 'http' | 'https',
        hostname: process.env.STRAPI_HOSTNAME!,
        port: process.env.STRAPI_PORT,
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
