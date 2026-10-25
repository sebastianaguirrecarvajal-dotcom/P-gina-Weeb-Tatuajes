// Utilidades de formato de fecha/hora en español (es-ES).

const DATE_FMT = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const DATETIME_FMT = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const TIME_FMT = new Intl.DateTimeFormat("es-ES", {
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
