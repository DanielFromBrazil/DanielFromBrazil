/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["firebasestorage.googleapis.com", "storage.googleapis.com", "res.cloudinary.com", "i.scdn.co"],
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["sqlite3"],
  },
}

module.exports = nextConfig
