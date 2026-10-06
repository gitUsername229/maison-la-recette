import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Visuels des épisodes du podcast, servis par Ausha (?t=… dans l'URL, d'où search libre).
    remotePatterns: [{ protocol: 'https', hostname: 'image.ausha.co', pathname: '/**' }],
  },
};

export default nextConfig;
