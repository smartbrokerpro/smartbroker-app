import { i18n } from './next-i18next.config.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,
  webpack: (config, { isServer }) => {
    // Agregar console.log para depurar
    // console.log('Webpack Config:', config);
    return config;
  },
};

export default nextConfig;
