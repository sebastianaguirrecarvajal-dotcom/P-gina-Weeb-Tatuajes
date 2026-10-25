import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getStudioOrThrow } from "@/lib/studio";
import { formatDate } from "@/lib/format";
import { parseStringArray } from "@/lib/json";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await prisma.post.findUnique({ where: { slug: params.slug } });
  if (!post) return { title: "Publicación no encontrada" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { type: "article", images: post.coverUrl ? [post.coverUrl] : [] },
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await prisma.post.findFirst({
    where: { slug: params.slug, status: "PUBLISHED" },
    include: { work: { include: { category: true } } },
  });
  if (!post) notFound();

  const studio = await getStudioOrThrow();
  const tags = parseStringArray(post.tags);

  return (
    <article className="container-page max-w-3xl py-12">
      <Link href="/blog" className="mb-6 inline-flex text-sm text-bone-200/70 hover:text-accent">← Volver al blog</Link>

      {post.publishedAt && <p className="text-sm text-accent">{formatDate(post.publishedAt)}</p>}
      <h1 className="mt-2 font-display text-4xl font-semibold text-bone-50">{post.title}</h1>
      <p className="mt-2 text-sm text-bone-200/60">por {studio.artistName}</p>

      {post.coverUrl && (
        <div className="relative mt-8 aspect-video overflow-hidden rounded-xl2 border border-bone-200/10">
          <Image src={post.coverUrl} alt={post.title} fill priority className="object-cover" sizes="(max-width:768px) 100vw, 768px" />
        </div>
      )}

      <div className="prose prose-invert mt-8 max-w-none">
        {post.content.split("\n").map((line, i) =>
          line.trim() === "" ? <br key={i} /> : <p key={i} className="mb-4 text-bone-200/85">{line}</p>
        )}
      </div>

      {tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {tags.map((t) => <span key={t} className="badge border-bone-200/20 bg-ink-800 text-bone-200">#{t}</span>)}
        </div>
      )}

      {post.work && (
        <div className="mt-8 flex items-center gap-4 rounded-xl2 border border-bone-200/10 bg-ink-900 p-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
            <Image src={post.work.imageUrl} alt={post.work.title} fill className="object-cover" sizes="80px" />
          </div>
          <div>
            <p className="text-sm text-bone-200/60">Trabajo relacionado</p>
            <Link href={`/catalogo/${post.work.id}`} className="font-display text-lg text-accent hover:underline">
              {post.work.title}
            </Link>
            <p className="text-sm text-bone-200/60">{post.work.category.name}</p>
          </div>
        </div>
      )}

      <div className="mt-10 rounded-xl2 border border-accent/20 bg-ink-900 p-6 text-center">
        <p className="text-bone-100">¿Tienes dudas sobre este tema?</p>
        <div className="mt-4 flex justify-center">
          <WhatsAppButton number={studio.whatsappNumber} context="publicacion" detail={post.title} label="Escríbeme por WhatsApp" />
        </div>
      </div>
    </article>
  );
}
