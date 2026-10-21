/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only local, pre-sized WebP images (public/bots) are used; skip the runtime optimizer.
  images: { unoptimized: true },
};

export default nextConfig;
