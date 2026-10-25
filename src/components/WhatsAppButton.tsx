import Link from "next/link";
import { buildWhatsAppUrl, type WhatsAppContext } from "@/lib/whatsapp";
import { WhatsAppIcon } from "./icons";

// Botón de WhatsApp con mensaje contextual preconfigurado. Server component:
// el enlace se genera en el servidor a partir del número del estudio.
export function WhatsAppButton({
  number,
  context,
  detail,
  label,
  className = "",
  variant = "whatsapp",
}: {
  number: string;
  context: WhatsAppContext;
  detail?: string;
  label?: string;
  className?: string;
  variant?: "whatsapp" | "outline";
}) {
  const url = buildWhatsAppUrl(number, context, detail);
  if (!url) return null;

  const cls = variant === "whatsapp" ? "btn-whatsapp" : "btn-outline";
  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${cls} ${className}`}
    >
      <WhatsAppIcon className="h-4 w-4" />
      {label ?? "Hablar por WhatsApp"}
    </Link>
  );
}
