/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: false, // 关键就这一行：关掉 turbopack
  },
};

module.exports = nextConfig;
