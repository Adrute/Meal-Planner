import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['supabase.co'], // Para las fotos de las recetas
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  }
  // Configuración estándar para App Router
};

export default nextConfig;