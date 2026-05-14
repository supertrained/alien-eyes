import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname
  },
  serverExternalPackages: ['playwright', 'bullmq', 'ioredis', 'wappalyzer-core', 'exa-js', 'resend']
};

export default nextConfig;
