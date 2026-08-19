import type { NextConfig } from 'next'

const API_HOST = 'http://111.229.0.159:8009'

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_HOST}/api/:path*`,
      },
      {
        source: '/ws/:path*',
        destination: `${API_HOST}/ws/:path*`,
      },
    ]
  },
}

export default nextConfig
