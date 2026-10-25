import { NextRequest, NextResponse } from "next/server";
import { getStudioOrThrow } from "@/lib/studio";
import { getDayAvailability } from "@/lib/availability";

// GET /api/availability?date=YYYY-MM-DD&duration=90
// Devuelve los huecos del día para la duración indicada. Fuente de verdad única.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const duration = Number(searchParams.get("duration") ?? "60");

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }
  if (!Number.isFinite(duration) || duration < 30 || duration > 360) {
    return NextResponse.json({ error: "Duración inválida" }, { status: 400 });
  }

  const studio = await getStudioOrThrow();
  // Interpretamos la fecha como día local.
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);

  const slots = await getDayAvailability(studio.id, date, duration);

  return NextResponse.json({
    date: dateStr,
    duration,
    slots: slots.map((s) => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
      available: s.available,
    })),
  });
}
