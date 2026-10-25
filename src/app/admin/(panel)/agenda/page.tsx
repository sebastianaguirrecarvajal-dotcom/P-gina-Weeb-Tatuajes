import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireArtist } from "@/lib/admin";
import { formatTime, formatDate, toDateKey } from "@/lib/format";
import { BOOKING_STATUS_COLOR, WEEKDAYS } from "@/lib/constants";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  createManualBookingAction,
  createTimeBlockAction,
  deleteTimeBlockAction,
} from "../admin-actions";

export const metadata: Metadata = { title: "Agenda", robots: { index: false } };

type View = "day" | "week" | "month";

function parseDate(s?: string): Date {
  if (s && /^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { view?: View; date?: string };
}) {
  const studio = await requireArtist();
  const view: View = searchParams.view ?? "week";
  const anchor = parseDate(searchParams.date);

  // Rango según la vista.
  let rangeStart: Date;
  let rangeEnd: Date;
  if (view === "day") {
    rangeStart = new Date(anchor);
    rangeEnd = addDays(anchor, 1);
  } else if (view === "month") {
    rangeStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    rangeEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
  } else {
    // week: lunes a domingo
    const dow = (anchor.getDay() + 6) % 7; // 0 = lunes
    rangeStart = addDays(anchor, -dow);
    rangeEnd = addDays(rangeStart, 7);
  }

  const [bookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: { studioId: studio.id, start: { gte: rangeStart, lt: rangeEnd }, status: { notIn: ["CANCELADA", "RECHAZADA"] } },
      orderBy: { start: "asc" },
    }),
    prisma.timeBlock.findMany({
      where: { studioId: studio.id, start: { lt: rangeEnd }, end: { gt: rangeStart } },
      orderBy: { start: "asc" },
    }),
  ]);

  // Agrupar por día.
  const byDay = new Map<string, typeof bookings>();
  for (const b of bookings) {
    const k = toDateKey(b.start);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(b);
  }

  const navStep = view === "day" ? 1 : view === "week" ? 7 : 0;
  const prevDate = view === "month"
    ? toDateKey(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1))
    : toDateKey(addDays(anchor, -navStep));
  const nextDate = view === "month"
    ? toDateKey(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1))
    : toDateKey(addDays(anchor, navStep));

  // Días a renderizar.
  const days: Date[] = [];
  if (view === "day") days.push(new Date(anchor));
  else if (view === "week") for (let i = 0; i < 7; i++) days.push(addDays(rangeStart, i));
  else {
    const cur = new Date(rangeStart);
    while (cur < rangeEnd) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
  }

  const todayKey = toDateKey(new Date());

  return (
    <div>
      <PageHeader title="Agenda" description="Tu calendario: citas, reservas y bloqueos en una sola vista." />

      {/* Controles */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full border border-bone-200/15 p-1">
          {(["day", "week", "month"] as View[]).map((v) => (
            <Link
              key={v}
              href={`/admin/agenda?view=${v}&date=${toDateKey(anchor)}`}
              className={`rounded-full px-3 py-1 text-sm ${view === v ? "bg-accent text-ink-950" : "text-bone-200"}`}
            >
              {v === "day" ? "Día" : v === "week" ? "Semana" : "Mes"}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/agenda?view=${view}&date=${prevDate}`} className="btn-ghost px-3 py-1.5">←</Link>
          <span className="text-sm text-bone-100">
            {view === "month"
              ? anchor.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
              : view === "day"
              ? formatDate(anchor)
              : `${formatDate(rangeStart)} – ${formatDate(addDays(rangeStart, 6))}`}
          </span>
          <Link href={`/admin/agenda?view=${view}&date=${nextDate}`} className="btn-ghost px-3 py-1.5">→</Link>
          <Link href={`/admin/agenda?view=${view}&date=${todayKey}`} className="btn-outline px-3 py-1.5 text-sm">Hoy</Link>
        </div>
      </div>

      {/* Rejilla de días */}
      <div className={view === "month" ? "grid grid-cols-7 gap-2" : view === "week" ? "grid gap-3 md:grid-cols-7" : "grid gap-3"}>
        {days.map((day) => {
          const k = toDateKey(day);
          const items = byDay.get(k) ?? [];
          const isToday = k === todayKey;
          return (
            <div key={k} className={`rounded-xl border p-2 ${isToday ? "border-accent/40 bg-ink-800" : "border-bone-200/10 bg-ink-900"} ${view === "month" ? "min-h-[90px]" : "min-h-[120px]"}`}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-bone-200/70">
                  {view === "month" ? day.getDate() : `${WEEKDAYS[day.getDay()].slice(0, 3)} ${day.getDate()}`}
                </span>
                <Link href={`/admin/agenda?view=day&date=${k}`} className="text-xs text-accent hover:underline">+</Link>
              </div>
              <div className="space-y-1">
                {items.map((b) => (
                  <div key={b.id} className={`rounded border px-2 py-1 text-xs ${BOOKING_STATUS_COLOR[b.status]}`}>
                    <span className="block font-medium">{formatTime(b.start)}</span>
                    <span className="block truncate">{b.clientName}</span>
                  </div>
                ))}
                {items.length === 0 && view !== "month" && <p className="text-xs text-bone-200/30">Sin citas</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bloqueos en el rango */}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-display text-lg text-bone-50">Bloqueos</h2>
          {blocks.length === 0 ? (
            <p className="text-sm text-bone-200/60">No hay bloqueos en este rango.</p>
          ) : (
            <ul className="space-y-2">
              {blocks.map((bl) => (
                <li key={bl.id} className="flex items-center justify-between rounded-lg bg-ink-800 px-3 py-2 text-sm">
                  <span>
                    {formatDate(bl.start)} {formatTime(bl.start)}–{formatTime(bl.end)}
                    {bl.reason && <span className="text-bone-200/50"> · {bl.reason}</span>}
                  </span>
                  <form action={deleteTimeBlockAction}>
                    <input type="hidden" name="id" value={bl.id} />
                    <button className="text-rose-300 hover:underline">Quitar</button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <form action={createTimeBlockAction} className="mt-4 space-y-3 border-t border-bone-200/10 pt-4">
            <p className="label">Nuevo bloqueo</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label">Desde</label><input type="datetime-local" name="start" required className="input" /></div>
              <div><label className="label">Hasta</label><input type="datetime-local" name="end" required className="input" /></div>
            </div>
            <input name="reason" placeholder="Motivo (opcional)" className="input" />
            <button className="btn-outline">Bloquear franja</button>
          </form>
        </div>

        {/* Crear cita manual */}
        <div className="card">
          <h2 className="mb-3 font-display text-lg text-bone-50">Crear cita manual</h2>
          <form action={createManualBookingAction} className="space-y-3">
            <div><label className="label">Cliente</label><input name="clientName" required className="input" placeholder="Nombre" /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label">Inicio</label><input type="datetime-local" name="start" required className="input" /></div>
              <div>
                <label className="label">Duración (min)</label>
                <input type="number" name="durationMin" defaultValue={90} min={30} step={15} className="input" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Estilo</label>
                <select name="style" className="input">
                  <option value="">—</option>
                  <option value="BLANCO_Y_NEGRO">Blanco y Negro</option>
                  <option value="COLOR">Color</option>
                </select>
              </div>
              <div><label className="label">Zona</label><input name="bodyZone" className="input" /></div>
            </div>
            <div><label className="label">Idea</label><input name="idea" className="input" /></div>
            <input type="hidden" name="status" value="CONFIRMADA" />
            <button className="btn-primary">Crear cita</button>
          </form>
        </div>
      </section>
    </div>
  );
}
