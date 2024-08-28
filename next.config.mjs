import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
const nextVersion = require('next/package.json').version;

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    console.log('Webpack building...');
    
    if (dev && config.watchOptions) {
      const originalIgnored = config.watchOptions.ignored;
      console.log('Original Watchpack ignored:', originalIgnored);
    }

    console.log('Entry points:', Object.keys(config.entry));
    console.log('Output path:', config.output.path);

    // Interceptar y manejar el error en setup-dev-bundler.js
    const originalPath = path.relative;
    path.relative = (from, to) => {
      if (typeof to === 'undefined') {
        console.error('path.relative called with undefined "to" argument');
        console.trace();
        return '.'; // Devolver un valor por defecto
      }
      return originalPath(from, to);
    };

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'smartbrokerpro.s3.sa-east-1.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Aumentar el límite de tamaño de solicitud a 10 MB
    },
  },
};

console.log('Next.js config loaded');
console.log('Current working directory:', process.cwd());
console.log('Node.js version:', process.version);
console.log('Next.js version:', nextVersion);

export default nextConfig;
