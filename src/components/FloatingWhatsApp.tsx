import Link from "next/link";
import { buildWhatsAppUrl, type WhatsAppContext } from "@/lib/whatsapp";
import { WhatsAppIcon } from "./icons";

// Botón flotante de acceso rápido. Permanece disponible sin resultar invasivo
// (esquina inferior derecha, con texto sólo en pantallas medianas/grandes).
export function FloatingWhatsApp({
  number,
  context = "home",
}: {
  number: string;
  context?: WhatsAppContext;
}) {
  const url = buildWhatsAppUrl(number, context);
  if (!url) return null;

  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-ink-950 shadow-lg shadow-black/40 transition-transform hover:scale-105"
    >
      <WhatsAppIcon className="h-6 w-6" />
      <span className="hidden text-sm font-semibold sm:inline">WhatsApp</span>
    </Link>
  );
}
