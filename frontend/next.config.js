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
}

module.exports = nextConfig
