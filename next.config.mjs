/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Agregar console.log para depurar
    // console.log('Webpack Config:', config);
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
};

export default nextConfig;
