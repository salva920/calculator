/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'api.binance.com'],
  },
  // Evita que el file tracer de Next recorra el árbol nativo de sharp (stack overflow en Vercel)
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'tesseract.js'],
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
      '.mjs': ['.mjs', '.js'],
    }
    return config
  },
}

module.exports = nextConfig
