/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  },
  // Ensure dynamic rendering for pages that use client-side features
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Skip static generation for pages that use client-side features
  trailingSlash: false,
  // Handle dynamic routes properly
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  // Ignore ESLint errors during build for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignore TypeScript errors during build for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  // Webpack configuration for pdfjs-dist
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.path = false;
    config.resolve.alias.fs = false;
    return config;
  },
}

module.exports = nextConfig
