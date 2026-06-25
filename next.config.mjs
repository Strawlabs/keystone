/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['10.155.183.56'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
