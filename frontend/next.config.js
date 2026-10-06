/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['page.tsx', 'api.ts', 'api.tsx', 'page.ts'],
  transpilePackages: ['@mdxeditor/editor'],
  // Garante uma única instância do Emotion no servidor, para os estilos da MUI usarem o cache do _app/_document
  bundlePagesRouterDependencies: true,
}

module.exports = nextConfig
