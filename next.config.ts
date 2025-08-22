import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Configuración básica para desarrollo
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configuración para archivos grandes
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Configuración de API para archivos grandes
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: '50mb',
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
