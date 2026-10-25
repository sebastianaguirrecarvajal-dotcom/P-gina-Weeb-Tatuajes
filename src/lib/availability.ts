import { prisma } from "./db";
import { OCCUPYING_STATUSES } from "./constants";

// Motor de disponibilidad — ÚNICA FUENTE DE VERDAD.
//
// La disponibilidad se calcula a partir de:
//   - horario laboral semanal (WorkingHours) + descanso del día,
//   - bloqueos manuales (TimeBlock),
//   - reservas/citas existentes en estados que ocupan tiempo (Booking),
//   - duración solicitada de la cita.
//
// El calendario del cliente y la agenda del tatuador consumen estas mismas
// funciones, de modo que nunca puede reservarse un hueco ya ocupado.
//
// Nota de V1 sobre zona horaria: se opera con la hora local del servidor. El
// campo Studio.timezone queda preparado para un cálculo con zona horaria
// explícita (p. ej. con date-fns-tz) sin cambiar las firmas.

export interface Interval {
  start: Date;
  end: Date;
}

/// Detecta la violación de la constraint EXCLUDE `booking_no_overlap` de
/// PostgreSQL (código SQLSTATE 23P01). Es la última línea de defensa frente a
/// dos reservas simultáneas sobre el mismo hueco.
export function isOverlapConstraintError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: string } | null)?.code;
  return code === "23P01" || msg.includes("booking_no_overlap") || msg.includes("23P01");
}

export interface Slot {
  start: Date;
  end: Date;
  available: boolean;
}

export function intervalsOverlap(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/// Construye una Date a partir del día `base` y minutos desde medianoche.
function atMinutes(base: Date, minutes: number): Date {
  const x = startOfDay(base);
  x.setMinutes(minutes);
  return x;
}

/// Calcula los huecos de un día concreto.
export function computeDaySlots(params: {
  date: Date;
  slotMinutes: number;
  durationMin: number;
  working: {
    startMin: number;
    endMin: number;
    breakStartMin: number | null;
    breakEndMin: number | null;
    active: boolean;
  } | null;
  busy: Interval[];
  now?: Date;
}): Slot[] {
  const { date, slotMinutes, durationMin, working, busy } = params;
  const now = params.now ?? new Date();
  if (!working || !working.active) return [];

  const slots: Slot[] = [];
  const step = Math.max(5, slotMinutes);

  for (let m = working.startMin; m + durationMin <= working.endMin; m += step) {
    const start = atMinutes(date, m);
    const end = atMinutes(date, m + durationMin);
    const candidate: Interval = { start, end };

    let available = true;

    // No permitir huecos en el pasado.
    if (start <= now) available = false;

    // Respetar el descanso del día.
    if (
      available &&
      working.breakStartMin != null &&
      working.breakEndMin != null &&
      intervalsOverlap(candidate, {
        start: atMinutes(date, working.breakStartMin),
        end: atMinutes(date, working.breakEndMin),
      })
    ) {
      available = false;
    }

    // No solapar con bloqueos ni reservas existentes.
    if (available) {
      for (const b of busy) {
        if (intervalsOverlap(candidate, b)) {
          available = false;
          break;
        }
      }
    }

    slots.push({ start, end, available });
  }

  return slots;
}

/// Trae los intervalos ocupados (reservas + bloqueos) que tocan un día.
export async function getBusyIntervals(
  studioId: string,
  dayStart: Date,
  dayEnd: Date
): Promise<Interval[]> {
  const [bookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: {
        studioId,
        status: { in: OCCUPYING_STATUSES },
        start: { lt: dayEnd },
        end: { gt: dayStart },
      },
      select: { start: true, end: true },
    }),
    prisma.timeBlock.findMany({
      where: { studioId, start: { lt: dayEnd }, end: { gt: dayStart } },
      select: { start: true, end: true },
    }),
  ]);
  return [...bookings, ...blocks].map((x) => ({ start: x.start, end: x.end }));
}

/// Disponibilidad de un día completo para una duración dada.
export async function getDayAvailability(
  studioId: string,
  date: Date,
  durationMin: number
): Promise<Slot[]> {
  const studio = await prisma.studio.findUnique({ where: { id: studioId } });
  if (!studio) return [];

  const dayStart = startOfDay(date);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const weekday = dayStart.getDay();
  const working = await prisma.workingHours.findUnique({
    where: { studioId_weekday: { studioId, weekday } },
  });

  const busy = await getBusyIntervals(studioId, dayStart, dayEnd);

  return computeDaySlots({
    date: dayStart,
    slotMinutes: studio.slotMinutes,
    durationMin,
    working,
    busy,
  });
}

/// Comprueba si un intervalo concreto puede reservarse (se usa al confirmar una
/// reserva para evitar condiciones de carrera / dobles reservas).
export async function isIntervalBookable(
  studioId: string,
  start: Date,
  end: Date
): Promise<boolean> {
  if (!(start < end)) return false;
  if (start <= new Date()) return false;

  const studio = await prisma.studio.findUnique({ where: { id: studioId } });
  if (!studio) return false;

  const weekday = start.getDay();
  const working = await prisma.workingHours.findUnique({
    where: { studioId_weekday: { studioId, weekday } },
  });
  if (!working || !working.active) return false;

  const dayStart = startOfDay(start);
  const startMin = (start.getTime() - dayStart.getTime()) / 60000;
  const endMin = (end.getTime() - dayStart.getTime()) / 60000;
  if (startMin < working.startMin || endMin > working.endMin) return false;

  if (working.breakStartMin != null && working.breakEndMin != null) {
    const brk = {
      start: atMinutes(dayStart, working.breakStartMin),
      end: atMinutes(dayStart, working.breakEndMin),
    };
    if (intervalsOverlap({ start, end }, brk)) return false;
  }

  const busy = await getBusyIntervals(studioId, start, end);
  return !busy.some((b) => intervalsOverlap({ start, end }, b));
}
