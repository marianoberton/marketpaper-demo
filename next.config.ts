import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Configuración básica para desarrollo
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return []
  },
  // Configuración de indicadores de desarrollo
  devIndicators: {
    position: 'bottom-right',
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
