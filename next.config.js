/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["firebasestorage.googleapis.com", "storage.googleapis.com", "res.cloudinary.com"],
  },
  experimental: {
    serverComponentsExternalPackages: ["sqlite3"],
  },
}

module.exports = nextConfig
