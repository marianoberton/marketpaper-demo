import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Configuración básica para desarrollo
  async redirects() {
    return []
  },
  // Mejorar rendimiento en desarrollo
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'adouqsqyjasjucdgwqxv.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
