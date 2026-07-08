/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Pretty URL for the standalone marketing entry page (public/landing.html)
      { source: '/landing', destination: '/landing.html' },
    ];
  },
};

export default nextConfig;
