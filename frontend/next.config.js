// next.config.js é CommonJS, então o require é necessário aqui
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

// Raiz do monorepo, onde ficam o bun.lock e o node_modules compartilhado
const monorepoRoot = path.join(__dirname, '..');

// Sem script-src: restringir os scripts do Next exigiria nonce e renderização dinâmica em todas as páginas
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value:
      "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  ...(process.env.NODE_ENV === 'production'
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains',
        },
      ]
    : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    root: monorepoRoot,
  },
  outputFileTracingRoot: monorepoRoot,
  pageExtensions: ['page.tsx', 'api.ts', 'api.tsx', 'page.ts'],
  transpilePackages: ['@mdxeditor/editor'],
  headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
