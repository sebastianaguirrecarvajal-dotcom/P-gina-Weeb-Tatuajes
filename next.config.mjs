/** @type {import('next').NextConfig} */

// Construimos la lista de hosts permitidos para el optimizador de imágenes de
// Next a partir de hosts conocidos + el del almacenamiento configurado. Evitamos
// el comodín "**" (que convertiría /_next/image en un proxy abierto con riesgo
// de abuso de cuota y SSRF).
const remotePatterns = [
  { protocol: "https", hostname: "images.unsplash.com" },
  // Supabase Storage (buckets públicos): <ref>.supabase.co
  { protocol: "https", hostname: "*.supabase.co" },
];

// Añade el host del almacenamiento de objetos configurado (CDN/bucket), si existe.
for (const envVar of ["S3_PUBLIC_BASE_URL", "S3_ENDPOINT"]) {
  const value = process.env[envVar];
  if (value) {
    try {
      remotePatterns.push({ protocol: "https", hostname: new URL(value).hostname });
    } catch {
      // URL inválida: se ignora.
    }
  }
}

const nextConfig = {
  reactStrictMode: true,
  images: { remotePatterns },
};

export default nextConfig;
