/** @type {import('next').NextConfig} */
const nextConfig = {
  // HTTPS configuration for development
  devIndicators: {
    buildActivity: true,
  },
  
  // Turbopack configuration for Next.js 16
  turbopack: {},
};


module.exports = nextConfig;