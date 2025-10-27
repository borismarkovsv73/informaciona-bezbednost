/** @type {import('next').NextConfig} */
const nextConfig = {
  // HTTPS configuration for development
  devIndicators: {
    buildActivity: true,
  },
  
  // Turbopack configuration for Next.js 16
  turbopack: {},
};

// Enable proper SSL verification (we have valid PKI certificates now!)
// if (process.env.NODE_ENV === 'development') {
//   process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// }

module.exports = nextConfig;