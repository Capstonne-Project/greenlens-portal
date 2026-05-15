// @ts-check

/** API host for `/proxy-api` rewrites (server). Falls back to public base when set. */
const API_BACKEND =
  process.env.API_BACKEND_URL?.replace(/\/$/, '') ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ||
  'http://localhost:5162';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  async rewrites() {
    return [
      {
        source: '/proxy-api/:path*',
        destination: `${API_BACKEND}/:path*`,
      },
    ];
  },

  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.example.com', pathname: '/**' },
      {
        protocol: 'https',
        hostname: 'pub-d1de759d41364ae7890b5d1273065f8c.r2.dev',
        pathname: '/**',
      },
    ],
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-icons'],
  },
};

export default nextConfig;
