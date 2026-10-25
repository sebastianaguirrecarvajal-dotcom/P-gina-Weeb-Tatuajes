/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Para V1 permitimos imágenes remotas de servicios de demostración y
    // archivos locales subidos al directorio /public/uploads.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
