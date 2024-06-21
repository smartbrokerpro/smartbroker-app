// next.config.mjs
import { i18n } from './next-i18next.config.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
