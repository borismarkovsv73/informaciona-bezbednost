/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow insecure HTTPS requests during development
  serverExternalPackages: [],
  
  // HTTPS configuration for development
  devIndicators: {
    buildActivity: true,
  },
  
  // Turbopack configuration for Next.js 16
  turbopack: {},
};

// Disable SSL verification for development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

module.exports = nextConfig;