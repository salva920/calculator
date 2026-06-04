/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'api.binance.com'],
  },
  webpack: (config, { isServer }) => {
    // Configurar para manejar archivos .mjs correctamente
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
      '.mjs': ['.mjs', '.js'],
    };
    return config;
  },
}

module.exports = nextConfig
