import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['supabase.co'], // Para las fotos de las recetas
  },// 1. Le decimos a Next.js que ignore pdf-parse al compilar
  serverExternalPackages: ['pdf-parse'],
  
  // 2. Mantenemos el límite de tamaño para poder subir varios PDFs
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  }
  // Configuración estándar para App Router
};

export default nextConfig;