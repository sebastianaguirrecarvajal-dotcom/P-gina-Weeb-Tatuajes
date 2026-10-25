import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getStudioOrThrow, toPublicStudio } from "@/lib/studio";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SectionHeading } from "@/components/ui";
import { InstagramIcon, TikTokIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Sobre mí",
  description: "Conoce al tatuador: trayectoria, especialidades y estudio.",
};

export default async function PerfilPage() {
  const studio = toPublicStudio(await getStudioOrThrow());

  return (
    <div className="container-page py-16">
      <div className="grid gap-12 md:grid-cols-[1fr_1.4fr]">
        <div>
          {studio.avatarUrl && (
            <div className="relative aspect-square w-full overflow-hidden rounded-xl2 border border-bone-200/10">
              <Image src={studio.avatarUrl} alt={studio.artistName} fill className="object-cover" />
            </div>
          )}
          <div className="mt-6 flex gap-3">
            {studio.instagram && (
              <Link href={studio.instagram} target="_blank" rel="noopener noreferrer" className="btn-ghost" aria-label="Instagram">
                <InstagramIcon className="h-5 w-5" />
              </Link>
            )}
            {studio.tiktok && (
              <Link href={studio.tiktok} target="_blank" rel="noopener noreferrer" className="btn-ghost" aria-label="TikTok">
                <TikTokIcon className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>

        <div>
          <SectionHeading eyebrow={studio.studioName} title={studio.artistName} subtitle={studio.tagline} />

          {studio.bio && <p className="mt-6 whitespace-pre-line text-bone-200/85">{studio.bio}</p>}

          {studio.experience && (
            <div className="mt-6 rounded-xl2 border border-accent/20 bg-ink-900 p-5">
              <p className="text-accent">{studio.experience}</p>
            </div>
          )}

          {studio.specialties.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-3 font-semibold text-bone-100">Especialidades</h3>
              <div className="flex flex-wrap gap-2">
                {studio.specialties.map((s) => (
                  <span key={s} className="badge border-bone-200/20 bg-ink-800 text-bone-100">{s}</span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {studio.location && (
              <div className="card">
                <h4 className="text-sm font-semibold text-accent">Ubicación</h4>
                <p className="mt-1 text-bone-100">{studio.location}</p>
                {studio.address && <p className="text-sm text-bone-200/70">{studio.address}</p>}
              </div>
            )}
            {studio.emailPublic && (
              <div className="card">
                <h4 className="text-sm font-semibold text-accent">Contacto</h4>
                <p className="mt-1 text-bone-100">{studio.emailPublic}</p>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/reservar" className="btn-primary">Reservar cita</Link>
            <WhatsAppButton number={studio.whatsappNumber} context="contacto" label="Hablar con el tatuador" />
          </div>
        </div>
      </div>
    </div>
  );
}
