/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for Docker
  output: 'standalone',
  // Configure API proxy/rewrites for backend
  // This allows frontend to make API calls to /api/* which will be proxied to the backend
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: "http://localhost:8000/api/v1/:path*" },
      { source: "/static/:path*", destination: "http://localhost:8000/static/:path*" },
    ]
  },
}

module.exports = nextConfig

