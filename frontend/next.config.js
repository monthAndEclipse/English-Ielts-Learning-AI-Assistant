/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',           // ✅ 关键
  trailingSlash: false,
  reactStrictMode: true,
}

module.exports = nextConfig
