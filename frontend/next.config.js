// next.config.js é CommonJS, então o require é necessário aqui
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path')

// Raiz do monorepo, onde ficam o bun.lock e o node_modules compartilhado
const monorepoRoot = path.join(__dirname, '..')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: monorepoRoot,
  },
  outputFileTracingRoot: monorepoRoot,
  pageExtensions: ['page.tsx', 'api.ts', 'api.tsx', 'page.ts'],
  transpilePackages: ['@mdxeditor/editor'],
  // Garante uma única instância do Emotion no servidor, para os estilos da MUI usarem o cache do _app/_document
  bundlePagesRouterDependencies: true,
}

module.exports = nextConfig
