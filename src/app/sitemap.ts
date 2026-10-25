import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const staticPaths = ["", "/perfil", "/catalogo", "/blog", "/faq", "/reservar", "/contacto"];

  // Resiliencia: si la BD no está disponible en el momento del build, el
  // sitemap se genera igualmente con las rutas estáticas.
  let works: { id: string; updatedAt: Date }[] = [];
  let posts: { slug: string; updatedAt: Date }[] = [];
  try {
    [works, posts] = await Promise.all([
      prisma.work.findMany({ where: { published: true }, select: { id: true, updatedAt: true } }),
      prisma.post.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    ]);
  } catch {
    // Sin conexión a BD: devolvemos solo las rutas estáticas.
  }

  return [
    ...staticPaths.map((p) => ({ url: `${base}${p}`, lastModified: new Date() })),
    ...works.map((w) => ({ url: `${base}/catalogo/${w.id}`, lastModified: w.updatedAt })),
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
