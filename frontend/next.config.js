/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for Docker
  output: 'standalone',
  // Configure API proxy/rewrites for backend (only used in local dev)
  // In production on Railway, API calls use NEXT_PUBLIC_API_URL directly
  async rewrites() {
    // Only use rewrites if NEXT_PUBLIC_API_URL is not set (local dev)
    if (process.env.NEXT_PUBLIC_API_URL) {
      return []
    }
    return [
      { source: "/api/v1/:path*", destination: "http://localhost:8000/api/v1/:path*" },
      { source: "/static/:path*", destination: "http://localhost:8000/static/:path*" },
    ]
  },
}

module.exports = nextConfig

