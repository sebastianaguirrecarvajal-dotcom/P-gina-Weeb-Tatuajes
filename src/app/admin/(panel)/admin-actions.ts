"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireArtist } from "@/lib/admin";
import { isIntervalBookable } from "@/lib/availability";
import { stringifyArray } from "@/lib/json";
import { createNotification } from "@/lib/notifications";
import { BOOKING_STATUS } from "@/lib/constants";

// -------------------------------------------------------------------------
// Todas las mutaciones del panel pasan por requireArtist() → sólo el tatuador
// autenticado puede ejecutarlas.
// -------------------------------------------------------------------------

function str(fd: FormData, k: string) {
  return String(fd.get(k) ?? "").trim();
}
function num(fd: FormData, k: string, def = 0) {
  const n = Number(fd.get(k));
  return Number.isFinite(n) ? n : def;
}
function bool(fd: FormData, k: string) {
  const v = fd.get(k);
  return v === "on" || v === "true" || v === "1";
}
function parseTags(raw: string) {
  return stringifyArray(raw.split(",").map((s) => s.trim()).filter(Boolean));
}

// ----------------------------- RESERVAS ----------------------------------

export async function updateBookingStatusAction(fd: FormData) {
  const studio = await requireArtist();
  const id = str(fd, "id");
  const status = str(fd, "status");
  if (!(status in BOOKING_STATUS)) throw new Error("Estado inválido");

  const booking = await prisma.booking.findFirst({ where: { id, studioId: studio.id } });
  if (!booking) throw new Error("Reserva no encontrada");

  await prisma.booking.update({ where: { id }, data: { status } });

  // Notificación al cliente según el nuevo estado (arquitectura preparada).
  const map: Record<string, { type: any; title: string }> = {
    ACEPTADA: { type: "BOOKING_ACCEPTED", title: "Tu reserva fue aceptada" },
    CONFIRMADA: { type: "BOOKING_ACCEPTED", title: "Tu reserva está confirmada" },
    RECHAZADA: { type: "BOOKING_REJECTED", title: "Tu reserva fue rechazada" },
    CANCELADA: { type: "BOOKING_CANCELLED", title: "Tu reserva fue cancelada" },
  };
  if (map[status]) {
    await createNotification({
      type: map[status].type,
      audience: "CLIENT",
      title: map[status].title,
      refType: "booking",
      refId: id,
    });
  }

  revalidatePath("/admin/reservas");
  revalidatePath("/admin/agenda");
  revalidatePath("/admin");
}

export async function updateBookingNotesAction(fd: FormData) {
  const studio = await requireArtist();
  const id = str(fd, "id");
  const booking = await prisma.booking.findFirst({ where: { id, studioId: studio.id } });
  if (!booking) throw new Error("Reserva no encontrada");
  await prisma.booking.update({ where: { id }, data: { internalNotes: str(fd, "internalNotes") } });
  revalidatePath("/admin/reservas");
}

// Crear cita manual (el tatuador) — también valida disponibilidad.
export async function createManualBookingAction(fd: FormData) {
  const studio = await requireArtist();
  const clientName = str(fd, "clientName");
  const startStr = str(fd, "start"); // datetime-local
  const durationMin = num(fd, "durationMin", 60);
  if (!clientName || !startStr) throw new Error("Faltan datos");

  const start = new Date(startStr);
  const end = new Date(start.getTime() + durationMin * 60000);

  // El tatuador puede forzar sobre su propio horario aunque esté fuera de las
  // horas laborales, pero NO sobre una franja ya ocupada.
  const busy = await prisma.booking.findFirst({
    where: {
      studioId: studio.id,
      status: { in: ["SOLICITADA", "EN_REVISION", "ACEPTADA", "CONFIRMADA", "COMPLETADA", "REPROGRAMADA"] },
      start: { lt: end },
      end: { gt: start },
    },
  });
  if (busy) throw new Error("Esa franja ya está ocupada");

  await prisma.booking.create({
    data: {
      studioId: studio.id,
      clientName,
      status: str(fd, "status") || "CONFIRMADA",
      start,
      end,
      style: str(fd, "style") || null,
      bodyZone: str(fd, "bodyZone") || null,
      idea: str(fd, "idea") || null,
      contactSource: "ADMIN",
    },
  });
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/reservas");
}

export async function rescheduleBookingAction(fd: FormData) {
  const studio = await requireArtist();
  const id = str(fd, "id");
  const startStr = str(fd, "start");
  const durationMin = num(fd, "durationMin", 60);
  const booking = await prisma.booking.findFirst({ where: { id, studioId: studio.id } });
  if (!booking) throw new Error("Reserva no encontrada");

  const start = new Date(startStr);
  const end = new Date(start.getTime() + durationMin * 60000);

  const busy = await prisma.booking.findFirst({
    where: {
      studioId: studio.id,
      id: { not: id },
      status: { in: ["SOLICITADA", "EN_REVISION", "ACEPTADA", "CONFIRMADA", "COMPLETADA", "REPROGRAMADA"] },
      start: { lt: end },
      end: { gt: start },
    },
  });
  if (busy) throw new Error("Esa franja ya está ocupada");

  await prisma.booking.update({ where: { id }, data: { start, end, status: "REPROGRAMADA" } });
  await createNotification({
    type: "BOOKING_RESCHEDULED",
    audience: "CLIENT",
    title: "Tu cita fue reprogramada",
    refType: "booking",
    refId: id,
  });
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/reservas");
}

// ----------------------------- BLOQUEOS ----------------------------------

export async function createTimeBlockAction(fd: FormData) {
  const studio = await requireArtist();
  const start = new Date(str(fd, "start"));
  const end = new Date(str(fd, "end"));
  if (!(start < end)) throw new Error("Rango inválido");
  await prisma.timeBlock.create({
    data: { studioId: studio.id, start, end, reason: str(fd, "reason") },
  });
  revalidatePath("/admin/agenda");
}

export async function deleteTimeBlockAction(fd: FormData) {
  const studio = await requireArtist();
  const id = str(fd, "id");
  await prisma.timeBlock.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/admin/agenda");
}

// ------------------------------ CLIENTES ----------------------------------

export async function updateClientNotesAction(fd: FormData) {
  await requireArtist();
  const id = str(fd, "id");
  await prisma.client.update({ where: { id }, data: { internalNotes: str(fd, "internalNotes") } });
  revalidatePath(`/admin/clientes/${id}`);
  revalidatePath("/admin/clientes");
}

// ------------------------------ CATÁLOGO ----------------------------------

export async function saveWorkAction(fd: FormData) {
  await requireArtist();
  const id = str(fd, "id");
  const data = {
    title: str(fd, "title"),
    description: str(fd, "description"),
    imageUrl: str(fd, "imageUrl"),
    categoryId: str(fd, "categoryId"),
    bodyZone: str(fd, "bodyZone") || null,
    tags: parseTags(str(fd, "tags")),
    published: bool(fd, "published"),
    featured: bool(fd, "featured"),
    order: num(fd, "order", 0),
  };
  if (!data.title || !data.imageUrl || !data.categoryId) throw new Error("Faltan datos");

  if (id) await prisma.work.update({ where: { id }, data });
  else await prisma.work.create({ data });

  revalidatePath("/admin/catalogo");
  revalidatePath("/catalogo");
}

export async function deleteWorkAction(fd: FormData) {
  await requireArtist();
  const id = str(fd, "id");
  await prisma.favorite.deleteMany({ where: { workId: id } });
  await prisma.post.updateMany({ where: { workId: id }, data: { workId: null } });
  await prisma.work.delete({ where: { id } });
  revalidatePath("/admin/catalogo");
  revalidatePath("/catalogo");
}

// --------------------------- PUBLICACIONES --------------------------------

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function savePostAction(fd: FormData) {
  await requireArtist();
  const id = str(fd, "id");
  const title = str(fd, "title");
  if (!title) throw new Error("El título es obligatorio");
  const status = str(fd, "status") || "DRAFT";

  const base = {
    title,
    excerpt: str(fd, "excerpt"),
    content: str(fd, "content"),
    coverUrl: str(fd, "coverUrl") || null,
    tags: parseTags(str(fd, "tags")),
    status,
    workId: str(fd, "workId") || null,
    publishedAt: status === "PUBLISHED" ? new Date() : null,
  };

  if (id) {
    const existing = await prisma.post.findUnique({ where: { id } });
    await prisma.post.update({
      where: { id },
      data: {
        ...base,
        // Conservar publishedAt si ya estaba publicado.
        publishedAt: status === "PUBLISHED" ? existing?.publishedAt ?? new Date() : null,
      },
    });
  } else {
    let slug = slugify(title) || `post-${Date.now()}`;
    // Garantizar unicidad del slug.
    const clash = await prisma.post.findUnique({ where: { slug } });
    if (clash) slug = `${slug}-${Date.now().toString().slice(-4)}`;
    await prisma.post.create({ data: { ...base, slug } });
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function deletePostAction(fd: FormData) {
  await requireArtist();
  await prisma.post.delete({ where: { id: str(fd, "id") } });
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

// ------------------------------- FAQ --------------------------------------

export async function saveFaqAction(fd: FormData) {
  await requireArtist();
  const id = str(fd, "id");
  const data = {
    question: str(fd, "question"),
    answer: str(fd, "answer"),
    order: num(fd, "order", 0),
    published: bool(fd, "published"),
  };
  if (!data.question || !data.answer) throw new Error("Faltan datos");
  if (id) await prisma.faq.update({ where: { id }, data });
  else await prisma.faq.create({ data });
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
}

export async function deleteFaqAction(fd: FormData) {
  await requireArtist();
  await prisma.faq.delete({ where: { id: str(fd, "id") } });
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
}

// --------------------------- TESTIMONIOS ----------------------------------

export async function setTestimonialStatusAction(fd: FormData) {
  await requireArtist();
  await prisma.testimonial.update({
    where: { id: str(fd, "id") },
    data: { status: str(fd, "status") },
  });
  revalidatePath("/admin/testimonios");
}

export async function deleteTestimonialAction(fd: FormData) {
  await requireArtist();
  await prisma.testimonial.delete({ where: { id: str(fd, "id") } });
  revalidatePath("/admin/testimonios");
}

// --------------------------- CONFIGURACIÓN --------------------------------

export async function saveSettingsAction(fd: FormData) {
  const studio = await requireArtist();
  await prisma.studio.update({
    where: { id: studio.id },
    data: {
      artistName: str(fd, "artistName"),
      studioName: str(fd, "studioName"),
      tagline: str(fd, "tagline"),
      bio: str(fd, "bio"),
      experience: str(fd, "experience"),
      specialties: parseTags(str(fd, "specialties")),
      location: str(fd, "location"),
      address: str(fd, "address"),
      avatarUrl: str(fd, "avatarUrl") || null,
      heroImageUrl: str(fd, "heroImageUrl") || null,
      whatsappNumber: str(fd, "whatsappNumber"),
      email_public: str(fd, "emailPublic"),
      instagram: str(fd, "instagram"),
      tiktok: str(fd, "tiktok"),
      facebook: str(fd, "facebook"),
      website: str(fd, "website"),
      bookingPolicy: str(fd, "bookingPolicy"),
      slotMinutes: num(fd, "slotMinutes", 30),
    },
  });
  revalidatePath("/", "layout");
  revalidatePath("/admin/configuracion");
}

export async function saveWorkingHoursAction(fd: FormData) {
  const studio = await requireArtist();
  // Recibe 7 días. Para cada uno: active, start, end, break.
  for (let weekday = 0; weekday <= 6; weekday++) {
    const active = bool(fd, `active-${weekday}`);
    const startMin = num(fd, `start-${weekday}`, 600);
    const endMin = num(fd, `end-${weekday}`, 1200);
    const bs = str(fd, `breakStart-${weekday}`);
    const be = str(fd, `breakEnd-${weekday}`);
    const breakStartMin = bs ? Number(bs) : null;
    const breakEndMin = be ? Number(be) : null;

    await prisma.workingHours.upsert({
      where: { studioId_weekday: { studioId: studio.id, weekday } },
      create: { studioId: studio.id, weekday, startMin, endMin, breakStartMin, breakEndMin, active },
      update: { startMin, endMin, breakStartMin, breakEndMin, active },
    });
  }
  revalidatePath("/admin/configuracion");
  revalidatePath("/reservar");
}
