// Utilidades de formato de fecha/hora en español (Colombia, es-CO).
// La zona horaria la toma del runtime (variable TZ, p. ej. America/Bogota en
// Vercel), de modo que fechas y horas se muestran en hora local del estudio.

const DATE_FMT = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const DATETIME_FMT = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const TIME_FMT = new Intl.DateTimeFormat("es-CO", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(d: Date | string): string {
  return DATE_FMT.format(new Date(d));
}

export function formatDateTime(d: Date | string): string {
  return DATETIME_FMT.format(new Date(d));
}

export function formatTime(d: Date | string): string {
  return TIME_FMT.format(new Date(d));
}

/// yyyy-mm-dd en hora local (para inputs date y claves de día).
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function minutesToHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
