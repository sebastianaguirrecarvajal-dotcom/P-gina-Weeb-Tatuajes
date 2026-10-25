import Link from "next/link";
import Image from "next/image";
import { FavoriteButton } from "./FavoriteButton";

export interface WorkCardData {
  id: string;
  title: string;
  imageUrl: string;
  categoryName: string;
  bodyZone?: string | null;
  featured?: boolean;
}

export function WorkCard({
  work,
  favorited = false,
  hasSession = false,
  priority = false,
}: {
  work: WorkCardData;
  favorited?: boolean;
  hasSession?: boolean;
  priority?: boolean;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl2 border border-bone-200/10 bg-ink-900">
      <Link href={`/catalogo/${work.id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-ink-800">
          <Image
            src={work.imageUrl}
            alt={`Tatuaje: ${work.title}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={priority}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
        </div>
      </Link>

      <div className="absolute right-3 top-3">
        <FavoriteButton workId={work.id} initialFavorited={favorited} hasSession={hasSession} />
      </div>

      {work.featured && (
        <span className="badge absolute left-3 top-3 border-accent/40 bg-accent/15 text-accent">
          Destacado
        </span>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-xs uppercase tracking-wider text-accent">{work.categoryName}</p>
        <h3 className="font-display text-lg font-semibold text-bone-50">{work.title}</h3>
        {work.bodyZone && <p className="text-sm text-bone-200/70">{work.bodyZone}</p>}
      </div>
    </div>
  );
}
