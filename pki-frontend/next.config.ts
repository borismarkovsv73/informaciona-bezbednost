import type { NextConfig } from "next";
import fs from 'fs';
import path from 'path';

const nextConfig: NextConfig = {
  // Enable HTTPS for development
  experimental: {
    // Configure HTTPS for dev server when certificates are available
  },
  
  // API configuration for HTTPS backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://localhost:8443/api/:path*'
      }
    ];
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
