import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStudioOrThrow } from "@/lib/studio";
import { getCurrentClient, startClientSession } from "@/lib/client-session";
import { isIntervalBookable, isOverlapConstraintError } from "@/lib/availability";
import { bookingRequestSchema } from "@/lib/validation";
import { OCCUPYING_STATUSES } from "@/lib/constants";
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

  // Revalidación de restricciones estáticas (no concurrentes): horario laboral,
  // descanso y que no sea en el pasado.
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
  const clientId = client.id;

  // ATOMICIDAD: la comprobación de solapamiento con reservas/bloqueos y la
  // inserción ocurren dentro de una misma transacción. SQLite serializa las
  // escrituras, por lo que dos solicitudes simultáneas no pueden crear ambas
  // una reserva sobre el mismo hueco: la segunda ve la primera y se rechaza.
  let booking;
  try {
    booking = await prisma.$transaction(async (tx) => {
      const clash = await tx.booking.findFirst({
        where: {
          studioId: studio.id,
          status: { in: OCCUPYING_STATUSES },
          start: { lt: end },
          end: { gt: start },
        },
        select: { id: true },
      });
      if (clash) return null;
      const blockClash = await tx.timeBlock.findFirst({
        where: { studioId: studio.id, start: { lt: end }, end: { gt: start } },
        select: { id: true },
      });
      if (blockClash) return null;

      return tx.booking.create({
        data: {
          studioId: studio.id,
          clientId,
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
    });
  } catch (err) {
    // Backstop de la BD: si dos solicitudes idénticas corren a la vez, la
    // constraint EXCLUDE rechaza la segunda. La traducimos a un 409 limpio.
    if (isOverlapConstraintError(err)) {
      return NextResponse.json(
        { error: "Ese horario acaba de ocuparse. Elige otro, por favor." },
        { status: 409 }
      );
    }
    throw err;
  }

  if (!booking) {
    return NextResponse.json(
      { error: "Ese horario acaba de ocuparse. Elige otro, por favor." },
      { status: 409 }
    );
  }

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
