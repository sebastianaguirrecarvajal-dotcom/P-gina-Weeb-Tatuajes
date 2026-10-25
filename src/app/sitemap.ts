import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const [works, posts] = await Promise.all([
    prisma.work.findMany({ where: { published: true }, select: { id: true, updatedAt: true } }),
    prisma.post.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
  ]);

  const staticPaths = ["", "/perfil", "/catalogo", "/blog", "/faq", "/reservar", "/contacto"];

  return [
    ...staticPaths.map((p) => ({ url: `${base}${p}`, lastModified: new Date() })),
    ...works.map((w) => ({ url: `${base}/catalogo/${w.id}`, lastModified: w.updatedAt })),
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
