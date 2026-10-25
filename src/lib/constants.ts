// Valores de dominio y etiquetas legibles. Centralizados para que la interfaz y
// la validación compartan una única fuente de verdad.

export const BOOKING_STATUS = {
  SOLICITADA: "SOLICITADA",
  EN_REVISION: "EN_REVISION",
  ACEPTADA: "ACEPTADA",
  CONFIRMADA: "CONFIRMADA",
  COMPLETADA: "COMPLETADA",
  RECHAZADA: "RECHAZADA",
  CANCELADA: "CANCELADA",
  REPROGRAMADA: "REPROGRAMADA",
} as const;

export type BookingStatus = keyof typeof BOOKING_STATUS;

export const BOOKING_STATUS_LABEL: Record<string, string> = {
  SOLICITADA: "Solicitada",
  EN_REVISION: "En revisión",
  ACEPTADA: "Aceptada",
  CONFIRMADA: "Confirmada",
  COMPLETADA: "Completada",
  RECHAZADA: "Rechazada",
  CANCELADA: "Cancelada",
  REPROGRAMADA: "Reprogramada",
};

// Estados que ocupan tiempo en la agenda (bloquean disponibilidad).
export const OCCUPYING_STATUSES: string[] = [
  "SOLICITADA",
  "EN_REVISION",
  "ACEPTADA",
  "CONFIRMADA",
  "COMPLETADA",
  "REPROGRAMADA",
];

export const BOOKING_STATUS_COLOR: Record<string, string> = {
  SOLICITADA: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  EN_REVISION: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  ACEPTADA: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  CONFIRMADA: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  COMPLETADA: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  RECHAZADA: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  CANCELADA: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  REPROGRAMADA: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
};

export const CONTACT_SOURCE = {
  WEB: "WEB",
  CATALOGO: "CATALOGO",
  TRABAJO: "TRABAJO",
  PUBLICACION: "PUBLICACION",
  RESERVA: "RESERVA",
  ADMIN: "ADMIN",
} as const;

export const CONTACT_SOURCE_LABEL: Record<string, string> = {
  WEB: "Página web",
  CATALOGO: "Catálogo",
  TRABAJO: "Trabajo específico",
  PUBLICACION: "Publicación",
  RESERVA: "Reservas",
  ADMIN: "Creado por el estudio",
};

export const STYLE = {
  BLANCO_Y_NEGRO: "BLANCO_Y_NEGRO",
  COLOR: "COLOR",
} as const;

export const STYLE_LABEL: Record<string, string> = {
  BLANCO_Y_NEGRO: "Blanco y Negro",
  COLOR: "Color",
};

// Categorías iniciales del catálogo (slug estable para enlaces y filtros).
export const INITIAL_CATEGORIES = [
  { slug: "blanco-y-negro", name: "Blanco y Negro", order: 0 },
  { slug: "color", name: "Color", order: 1 },
];

export const POST_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  HIDDEN: "HIDDEN",
} as const;

export const POST_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  HIDDEN: "Oculto",
};

export const TESTIMONIAL_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  HIDDEN: "Oculto",
};

export const WEEKDAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
