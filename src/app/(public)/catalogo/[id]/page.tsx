import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getStudioOrThrow } from "@/lib/studio";
import { parseStringArray } from "@/lib/json";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ArrowIcon } from "@/components/icons";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const work = await prisma.work.findUnique({ where: { id: params.id } });
  if (!work) return { title: "Trabajo no encontrado" };
  return {
    title: work.title,
    description: work.description || `Tatuaje: ${work.title}`,
    openGraph: { images: [work.imageUrl] },
  };
}

export default async function WorkDetailPage({ params }: { params: { id: string } }) {
  const work = await prisma.work.findFirst({
    where: { id: params.id, published: true },
    include: { category: true, posts: { where: { status: "PUBLISHED" } } },
  });
  if (!work) notFound();

  const studio = await getStudioOrThrow();
  const tags = parseStringArray(work.tags);

  const related = await prisma.work.findMany({
    where: { published: true, categoryId: work.categoryId, id: { not: work.id } },
    include: { category: true },
    take: 4,
  });

  // Datos estructurados (SEO) para la obra.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: work.title,
    image: work.imageUrl,
    artform: "Tatuaje",
    creator: { "@type": "Person", name: studio.artistName },
    ...(work.description ? { description: work.description } : {}),
  };

  return (
    <div className="container-page py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/catalogo" className="mb-6 inline-flex items-center gap-1 text-sm text-bone-200/70 hover:text-accent">
        ← Volver al catálogo
      </Link>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl2 border border-bone-200/10 bg-ink-800">
          <Image src={work.imageUrl} alt={`Tatuaje: ${work.title}`} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
        </div>

        <div>
          <p className="eyebrow">{work.category.name}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-bone-50">{work.title}</h1>
          {work.description && <p className="mt-4 text-bone-200/80">{work.description}</p>}

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            {work.bodyZone && (
              <div><dt className="text-bone-200/50">Zona</dt><dd className="text-bone-100">{work.bodyZone}</dd></div>
            )}
            <div><dt className="text-bone-200/50">Estilo</dt><dd className="text-bone-100">{work.category.name}</dd></div>
          </dl>

          {tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="badge border-bone-200/20 bg-ink-800 text-bone-200">#{t}</span>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <WhatsAppButton number={studio.whatsappNumber} context="trabajo" detail={work.title} label="Consultar por WhatsApp" />
            <Link href={`/reservar?style=${work.category.slug === "color" ? "COLOR" : "BLANCO_Y_NEGRO"}`} className="btn-outline">
              Reservar algo similar <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>

          {work.posts.length > 0 && (
            <div className="mt-8 rounded-xl2 border border-bone-200/10 bg-ink-900 p-4">
              <p className="text-sm text-bone-200/60">Publicación relacionada</p>
              {work.posts.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="mt-1 block text-accent hover:underline">
                  {p.title} →
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl text-bone-50">Más en {work.category.name}</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((r) => (
              <Link key={r.id} href={`/catalogo/${r.id}`} className="group relative aspect-[4/5] overflow-hidden rounded-xl2 border border-bone-200/10">
                <Image src={r.imageUrl} alt={r.title} fill className="object-cover transition-transform group-hover:scale-105" sizes="25vw" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/80 to-transparent p-3">
                  <p className="text-sm text-bone-50">{r.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
