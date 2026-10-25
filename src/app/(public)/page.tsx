import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { getStudioOrThrow, toPublicStudio } from "@/lib/studio";
import { getFavoriteContext } from "@/lib/favorites";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { WorkCard } from "@/components/WorkCard";
import { SectionHeading, Rating } from "@/components/ui";
import { ArrowIcon } from "@/components/icons";

export default async function HomePage() {
  const studioRecord = await getStudioOrThrow();
  const studio = toPublicStudio(studioRecord);
  const { hasSession, favoriteIds } = await getFavoriteContext();

  const [featured, posts, testimonials] = await Promise.all([
    prisma.work.findMany({
      where: { published: true },
      include: { category: true },
      orderBy: [{ featured: "desc" }, { order: "asc" }],
      take: 6,
    }),
    prisma.post.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    prisma.testimonial.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        {studio.heroImageUrl && (
          <div className="absolute inset-0">
            <Image
              src={studio.heroImageUrl}
              alt=""
              fill
              priority
              className="object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-950/85 to-ink-950" />
          </div>
        )}
        <div className="container-page relative py-24 sm:py-32">
          <div className="max-w-2xl animate-fade-up">
            <p className="eyebrow mb-4">{studio.location || "Estudio de tatuaje"}</p>
            <h1 className="font-display text-5xl font-semibold leading-tight tracking-tight text-bone-50 sm:text-6xl">
              {studio.artistName}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-bone-200/80">{studio.tagline}</p>

            {studio.specialties.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {studio.specialties.map((s) => (
                  <span key={s} className="badge border-bone-200/20 bg-ink-800/60 text-bone-100">
                    {s}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/reservar" className="btn-primary">
                Reservar cita <ArrowIcon className="h-4 w-4" />
              </Link>
              <Link href="/catalogo" className="btn-outline">Ver trabajos</Link>
              <WhatsAppButton number={studio.whatsappNumber} context="home" label="Quiero mi tatuaje" />
            </div>
          </div>
        </div>
      </section>

      {/* ACCESOS RÁPIDOS */}
      <section className="container-page grid gap-4 py-12 sm:grid-cols-3">
        {[
          { href: "/catalogo", title: "Catálogo", desc: "Explora mis trabajos en blanco y negro y color." },
          { href: "/blog", title: "Blog y novedades", desc: "Consejos, cuidados y nuevos trabajos." },
          { href: "/faq", title: "Preguntas frecuentes", desc: "Resuelve tus dudas antes de reservar." },
        ].map((c) => (
          <Link key={c.href} href={c.href} className="card group transition-colors hover:border-accent/40">
            <h3 className="font-display text-xl text-bone-50">{c.title}</h3>
            <p className="mt-2 text-sm text-bone-200/70">{c.desc}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm text-accent">
              Entrar <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </section>

      {/* PORTAFOLIO DESTACADO */}
      <section className="container-page py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <SectionHeading eyebrow="Portafolio" title="Trabajos recientes" />
          <Link href="/catalogo" className="hidden shrink-0 text-sm text-accent hover:underline sm:inline">
            Ver todo el catálogo →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
          {featured.map((w, i) => (
            <WorkCard
              key={w.id}
              priority={i < 2}
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
      </section>

      {/* SOBRE MÍ */}
      <section className="container-page grid items-center gap-10 py-16 md:grid-cols-2">
        {studio.avatarUrl && (
          <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-xl2 border border-bone-200/10">
            <Image src={studio.avatarUrl} alt={studio.artistName} fill className="object-cover" />
          </div>
        )}
        <div>
          <SectionHeading eyebrow="Sobre mí" title={`Hola, soy ${studio.artistName}`} />
          <p className="mt-4 text-bone-200/80">{studio.bio}</p>
          {studio.experience && <p className="mt-3 text-sm text-accent">{studio.experience}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/perfil" className="btn-outline">Conóceme</Link>
            <WhatsAppButton number={studio.whatsappNumber} context="home" />
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      {testimonials.length > 0 && (
        <section className="container-page py-12">
          <SectionHeading eyebrow="Opiniones" title="Lo que dicen mis clientes" center />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.id} className="card">
                <Rating value={t.rating} />
                <blockquote className="mt-3 text-bone-100">“{t.content}”</blockquote>
                <figcaption className="mt-4 text-sm text-bone-200/60">— {t.authorName}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* BLOG */}
      {posts.length > 0 && (
        <section className="container-page py-12">
          <div className="mb-8 flex items-end justify-between gap-4">
            <SectionHeading eyebrow="Blog" title="Últimas publicaciones" />
            <Link href="/blog" className="hidden shrink-0 text-sm text-accent hover:underline sm:inline">
              Ver todas →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="card group transition-colors hover:border-accent/40">
                {p.coverUrl && (
                  <div className="relative -mx-5 -mt-5 mb-4 aspect-video overflow-hidden rounded-t-xl2">
                    <Image src={p.coverUrl} alt={p.title} fill className="object-cover" />
                  </div>
                )}
                <h3 className="font-display text-lg text-bone-50">{p.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-bone-200/70">{p.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA FINAL */}
      <section className="container-page py-16">
        <div className="rounded-xl2 border border-accent/20 bg-gradient-to-br from-ink-900 to-ink-800 p-10 text-center">
          <h2 className="section-title">¿List@ para tu próximo tatuaje?</h2>
          <p className="mx-auto mt-3 max-w-xl text-bone-200/70">
            Cuéntame tu idea y reservemos una fecha. También puedes escribirme directamente por WhatsApp.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/reservar" className="btn-primary">Reservar ahora</Link>
            <WhatsAppButton number={studio.whatsappNumber} context="home" />
          </div>
        </div>
      </section>
    </>
  );
}
