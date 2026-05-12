import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname
  },
  serverExternalPackages: ['playwright', 'bullmq', 'ioredis', '@sparticuz/chromium-min']
};

export default nextConfig;
