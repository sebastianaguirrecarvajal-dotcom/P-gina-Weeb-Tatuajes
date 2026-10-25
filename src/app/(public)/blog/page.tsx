import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { SectionHeading, EmptyState } from "@/components/ui";

export const metadata: Metadata = {
  title: "Blog y novedades",
  description: "Consejos de cuidados, procesos, novedades y nuevos trabajos del estudio.",
};

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="container-page py-16">
      <SectionHeading eyebrow="Blog" title="Novedades y consejos" subtitle="Cuidados, procesos y las últimas piezas del estudio." />

      {posts.length === 0 ? (
        <div className="mt-10"><EmptyState title="Aún no hay publicaciones" /></div>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.id} href={`/blog/${p.slug}`} className="group flex flex-col overflow-hidden rounded-xl2 border border-bone-200/10 bg-ink-900 transition-colors hover:border-accent/40">
              {p.coverUrl && (
                <div className="relative aspect-video overflow-hidden">
                  <Image src={p.coverUrl} alt={p.title} fill className="object-cover transition-transform group-hover:scale-105" sizes="(max-width:768px) 100vw, 33vw" />
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                {p.publishedAt && <p className="text-xs text-bone-200/50">{formatDate(p.publishedAt)}</p>}
                <h2 className="mt-1 font-display text-xl text-bone-50">{p.title}</h2>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-bone-200/70">{p.excerpt}</p>
                <span className="mt-4 text-sm text-accent">Leer más →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
