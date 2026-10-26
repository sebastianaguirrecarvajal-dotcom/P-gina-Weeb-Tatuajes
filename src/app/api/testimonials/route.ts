import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentClient } from "@/lib/client-session";
import { testimonialSchema } from "@/lib/validation";

// POST /api/testimonials — un cliente deja un testimonio tras una cita.
// Queda en estado PENDING hasta que el tatuador lo aprueba (moderación).
export async function POST(req: NextRequest) {
  // Exigir sesión de cliente: sin ella, la regla de "cita completada" sería
  // evadible y cualquiera podría crear testimonios con autor arbitrario.
  const client = await getCurrentClient();
  if (!client) {
    return NextResponse.json(
      { error: "Inicia tu sesión de cliente para dejar un testimonio." },
      { status: 401 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = testimonialSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  // Sólo se permite dejar testimonio si el cliente tiene una cita completada.
  const completed = await prisma.booking.count({
    where: { clientId: client.id, status: "COMPLETADA" },
  });
  if (completed === 0) {
    return NextResponse.json(
      { error: "Podrás dejar tu testimonio cuando tengas una cita completada." },
      { status: 403 }
    );
  }

  await prisma.testimonial.create({
    data: {
      clientId: client.id,
      // El autor se deriva de la sesión; no se confía en el campo enviado.
      authorName: client.fullName,
      rating: parsed.data.rating,
      content: parsed.data.content,
      status: "PENDING",
    },
  });

  return NextResponse.json({ ok: true });
}
