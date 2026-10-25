import type { Metadata } from "next";
import { getStudioOrThrow } from "@/lib/studio";
import { getCurrentClient } from "@/lib/client-session";
import { BookingForm } from "@/components/BookingForm";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Reservar cita",
  description: "Consulta la disponibilidad real y solicita tu cita de tatuaje.",
};

export default async function ReservarPage({
  searchParams,
}: {
  searchParams: { style?: string };
}) {
  const studio = await getStudioOrThrow();
  const client = await getCurrentClient();

  const style = searchParams.style === "COLOR" || searchParams.style === "BLANCO_Y_NEGRO"
    ? searchParams.style
    : undefined;

  return (
    <div className="container-page py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Reservas"
          title="Solicita tu cita"
          subtitle="Elige un hueco disponible y cuéntame tu idea. La disponibilidad es real y en tiempo real."
        />
        <WhatsAppButton number={studio.whatsappNumber} context="reserva" label="Prefiero WhatsApp" variant="outline" />
      </div>

      <div className="mt-10">
        <BookingForm
          defaultName={client?.fullName}
          defaultStyle={style}
          bookingPolicy={studio.bookingPolicy}
        />
      </div>
    </div>
  );
}
