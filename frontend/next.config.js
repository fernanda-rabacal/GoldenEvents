/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['page.tsx', 'api.ts', 'api.tsx', 'page.ts'],
  transpilePackages: ['@mdxeditor/editor'],
}

module.exports = nextConfig
