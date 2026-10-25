import Link from "next/link";
import type { Metadata } from "next";
import { getStudioOrThrow } from "@/lib/studio";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CheckIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Solicitud enviada" };

export default async function GraciasPage() {
  const studio = await getStudioOrThrow();
  return (
    <div className="container-page flex min-h-[60vh] max-w-lg flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
        <CheckIcon className="h-8 w-8" />
      </div>
      <h1 className="mt-6 font-display text-3xl text-bone-50">¡Solicitud enviada!</h1>
      <p className="mt-3 text-bone-200/70">
        He recibido tu solicitud de reserva. La revisaré y te confirmaré la cita lo antes posible.
        Puedes seguir el estado en tu espacio de cliente.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/cliente" className="btn-primary">Ver mis reservas</Link>
        <WhatsAppButton number={studio.whatsappNumber} context="reserva" label="Añadir detalles por WhatsApp" />
      </div>
    </div>
  );
}
