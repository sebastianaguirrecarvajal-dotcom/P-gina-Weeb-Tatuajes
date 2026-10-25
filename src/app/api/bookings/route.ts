import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStudioOrThrow } from "@/lib/studio";
import { getCurrentClient, startClientSession } from "@/lib/client-session";
import { isIntervalBookable } from "@/lib/availability";
import { bookingRequestSchema } from "@/lib/validation";
import { stringifyArray } from "@/lib/json";
import { createNotification } from "@/lib/notifications";
import { formatDateTime } from "@/lib/format";

// POST /api/bookings — solicitud de reserva del cliente (estado SOLICITADA).
export async function POST(req: NextRequest) {
  const studio = await getStudioOrThrow();

  const json = await req.json().catch(() => null);
  const parsed = bookingRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const start = new Date(data.start);
  const end = new Date(start.getTime() + data.durationMin * 60000);

  // Revalidación en servidor: evita dobles reservas aunque el hueco se haya
  // ocupado entre que el cliente vio la disponibilidad y envió el formulario.
  const bookable = await isIntervalBookable(studio.id, start, end);
  if (!bookable) {
    return NextResponse.json(
      { error: "Ese horario ya no está disponible. Elige otro, por favor." },
      { status: 409 }
    );
  }

  // Vinculamos (o creamos) la sesión de cliente para que pueda ver su reserva.
  let client = await getCurrentClient();
  if (!client) {
    client = await startClientSession(data.clientName, data.clientPhone || undefined);
  }

  const booking = await prisma.booking.create({
    data: {
      studioId: studio.id,
      clientId: client.id,
      clientName: data.clientName.trim(),
      clientPhone: data.clientPhone || null,
      status: "SOLICITADA",
      start,
      end,
      style: data.style,
      bodyZone: data.bodyZone || null,
      sizeApprox: data.sizeApprox || null,
      idea: data.idea || null,
      notes: data.notes || null,
      referenceImages: stringifyArray(data.referenceImages ?? []),
      contactSource: data.contactSource ?? "RESERVA",
    },
  });

  // Notificación al tatuador (arquitectura preparada; canal INAPP en V1).
  await createNotification({
    type: "NEW_BOOKING",
    audience: "ARTIST",
    title: "Nueva solicitud de reserva",
    body: `${booking.clientName} · ${formatDateTime(start)}`,
    refType: "booking",
    refId: booking.id,
  });

  return NextResponse.json({ id: booking.id, status: booking.status });
}
