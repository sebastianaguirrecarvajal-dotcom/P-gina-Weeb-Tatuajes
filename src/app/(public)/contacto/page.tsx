import Link from "next/link";
import type { Metadata } from "next";
import { getStudioOrThrow, toPublicStudio } from "@/lib/studio";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SectionHeading } from "@/components/ui";
import { InstagramIcon, TikTokIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contacta con el estudio por WhatsApp o redes sociales.",
};

export default async function ContactoPage() {
  const studio = toPublicStudio(await getStudioOrThrow());

  return (
    <div className="container-page max-w-3xl py-16">
      <SectionHeading eyebrow="Contacto" title="Hablemos de tu tatuaje" subtitle="La forma más rápida de contactarme es por WhatsApp." center />

      <div className="mx-auto mt-10 max-w-md space-y-4">
        <div className="card text-center">
          <p className="text-bone-100">WhatsApp Business del estudio</p>
          <p className="mt-1 text-sm text-bone-200/60">Respondo consultas, presupuestos y reservas.</p>
          <div className="mt-5 flex justify-center">
            <WhatsAppButton number={studio.whatsappNumber} context="contacto" label="Abrir WhatsApp" />
          </div>
        </div>

        {(studio.location || studio.address) && (
          <div className="card">
            <h3 className="text-sm font-semibold text-accent">Estudio</h3>
            {studio.address && <p className="mt-1 text-bone-100">{studio.address}</p>}
            {studio.location && <p className="text-sm text-bone-200/70">{studio.location}</p>}
          </div>
        )}

        {studio.emailPublic && (
          <div className="card">
            <h3 className="text-sm font-semibold text-accent">Email</h3>
            <p className="mt-1 text-bone-100">{studio.emailPublic}</p>
          </div>
        )}

        {(studio.instagram || studio.tiktok) && (
          <div className="card">
            <h3 className="mb-3 text-sm font-semibold text-accent">Redes sociales</h3>
            <div className="flex gap-3">
              {studio.instagram && (
                <Link href={studio.instagram} target="_blank" rel="noopener noreferrer" className="btn-outline" aria-label="Instagram">
                  <InstagramIcon className="h-5 w-5" /> Instagram
                </Link>
              )}
              {studio.tiktok && (
                <Link href={studio.tiktok} target="_blank" rel="noopener noreferrer" className="btn-outline" aria-label="TikTok">
                  <TikTokIcon className="h-5 w-5" /> TikTok
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="text-center">
          <Link href="/reservar" className="btn-primary">O reserva una cita online</Link>
        </div>
      </div>
    </div>
  );
}
