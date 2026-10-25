import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentClient } from "@/lib/client-session";

// POST /api/favorites { workId }  → alterna favorito del cliente actual.
// El favorito se asocia SIEMPRE a la sesión (cookie), nunca al nombre, para no
// exponer datos entre clientes.
export async function POST(req: NextRequest) {
  const client = await getCurrentClient();
  if (!client) {
    return NextResponse.json({ error: "Inicia tu sesión de cliente" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const workId = body?.workId;
  if (typeof workId !== "string") {
    return NextResponse.json({ error: "workId requerido" }, { status: 400 });
  }

  const work = await prisma.work.findUnique({ where: { id: workId } });
  if (!work) return NextResponse.json({ error: "Trabajo no encontrado" }, { status: 404 });

  const existing = await prisma.favorite.findUnique({
    where: { clientId_workId: { clientId: client.id, workId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  await prisma.favorite.create({ data: { clientId: client.id, workId } });
  return NextResponse.json({ favorited: true });
}
