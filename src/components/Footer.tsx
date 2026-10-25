import Link from "next/link";
import type { PublicStudio } from "@/lib/studio";
import { InstagramIcon, TikTokIcon } from "./icons";
import { WhatsAppButton } from "./WhatsAppButton";

export function Footer({ studio }: { studio: PublicStudio }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-bone-200/10 bg-ink-900">
      <div className="container-page grid gap-10 py-12 md:grid-cols-3">
        <div>
          <h3 className="font-display text-xl font-semibold text-bone-50">{studio.studioName}</h3>
          <p className="mt-2 max-w-xs text-sm text-bone-200/70">{studio.tagline}</p>
          <div className="mt-4 flex gap-3">
            {studio.instagram && (
              <Link href={studio.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-bone-200 hover:text-accent">
                <InstagramIcon className="h-5 w-5" />
              </Link>
            )}
            {studio.tiktok && (
              <Link href={studio.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-bone-200 hover:text-accent">
                <TikTokIcon className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>

        <div className="text-sm text-bone-200/80">
          <h4 className="mb-3 font-semibold text-bone-100">Navegación</h4>
          <ul className="space-y-2">
            <li><Link href="/catalogo" className="hover:text-accent">Catálogo</Link></li>
            <li><Link href="/blog" className="hover:text-accent">Blog</Link></li>
            <li><Link href="/faq" className="hover:text-accent">Preguntas frecuentes</Link></li>
            <li><Link href="/reservar" className="hover:text-accent">Reservar cita</Link></li>
            <li><Link href="/cliente" className="hover:text-accent">Mi espacio</Link></li>
          </ul>
        </div>

        <div className="text-sm text-bone-200/80">
          <h4 className="mb-3 font-semibold text-bone-100">Contacto</h4>
          {studio.address && <p className="mb-1">{studio.address}</p>}
          {studio.location && <p className="mb-1">{studio.location}</p>}
          {studio.emailPublic && <p className="mb-3">{studio.emailPublic}</p>}
          <WhatsAppButton number={studio.whatsappNumber} context="contacto" label="Escríbeme" />
        </div>
      </div>

      <div className="border-t border-bone-200/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-bone-200/50 sm:flex-row">
          <p>© {year} {studio.studioName}. Todos los derechos reservados.</p>
          <Link href="/admin/login" className="hover:text-bone-200">Acceso del estudio</Link>
        </div>
      </div>
    </footer>
  );
}
