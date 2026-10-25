import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getStudioOrThrow } from "@/lib/studio";
import { getFavoriteContext } from "@/lib/favorites";
import { WorkCard } from "@/components/WorkCard";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SectionHeading, EmptyState } from "@/components/ui";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Portafolio de tatuajes en blanco y negro y color.",
};

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: { cat?: string };
}) {
  const studio = await getStudioOrThrow();
  const { hasSession, favoriteIds } = await getFavoriteContext();
  const activeCat = searchParams.cat ?? "todos";

  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  const activeCategory = categories.find((c) => c.slug === activeCat);

  const works = await prisma.work.findMany({
    where: {
      published: true,
      ...(activeCategory ? { categoryId: activeCategory.id } : {}),
    },
    include: { category: true },
    orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
  });

  const filters = [{ slug: "todos", name: "Todos" }, ...categories];

  return (
    <div className="container-page py-16">
      <SectionHeading eyebrow="Portafolio" title="Catálogo de trabajos" subtitle="Filtra por estilo. ¿Te gusta una pieza? Consúltame por WhatsApp." />

      {/* Filtros (sólo Blanco y Negro / Color en la V1) */}
      <div className="mt-8 flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = activeCat === f.slug;
          return (
            <Link
              key={f.slug}
              href={f.slug === "todos" ? "/catalogo" : `/catalogo?cat=${f.slug}`}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                active
                  ? "border-accent bg-accent text-ink-950"
                  : "border-bone-200/20 text-bone-100 hover:border-accent"
              }`}
            >
              {f.name}
            </Link>
          );
        })}
      </div>

      {works.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="Aún no hay trabajos en esta categoría" hint="Vuelve pronto o escríbeme por WhatsApp." />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {works.map((w, i) => (
            <WorkCard
              key={w.id}
              priority={i < 4}
              hasSession={hasSession}
              favorited={favoriteIds.has(w.id)}
              work={{
                id: w.id,
                title: w.title,
                imageUrl: w.imageUrl,
                categoryName: w.category.name,
                bodyZone: w.bodyZone,
                featured: w.featured,
              }}
            />
          ))}
        </div>
      )}

      <div className="mt-14 rounded-xl2 border border-bone-200/10 bg-ink-900 p-8 text-center">
        <p className="text-bone-100">¿No ves lo que buscas?</p>
        <p className="mt-1 text-sm text-bone-200/60">Cuéntame tu idea y la diseñamos juntos.</p>
        <div className="mt-5 flex justify-center">
          <WhatsAppButton number={studio.whatsappNumber} context="catalogo" label="Consultar por WhatsApp" />
        </div>
      </div>
    </div>
  );
}
