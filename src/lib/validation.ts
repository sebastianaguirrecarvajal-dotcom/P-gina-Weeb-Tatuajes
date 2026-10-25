import { z } from "zod";
import { STYLE, CONTACT_SOURCE } from "./constants";

// Esquemas de validación compartidos (cliente envía → servidor valida).
// Minimización de datos: sólo lo necesario para gestionar el servicio.

export const clientLoginSchema = z.object({
  fullName: z.string().trim().min(3, "Introduce tu nombre completo").max(80),
});

export const bookingRequestSchema = z.object({
  // Franja elegida (ISO). El servidor revalida disponibilidad antes de crear.
  start: z.string().datetime(),
  durationMin: z.coerce.number().int().min(30).max(360),
  clientName: z.string().trim().min(3).max(80),
  clientPhone: z.string().trim().max(30).optional().or(z.literal("")),
  style: z.enum([STYLE.BLANCO_Y_NEGRO, STYLE.COLOR]).optional(),
  bodyZone: z.string().trim().max(60).optional().or(z.literal("")),
  sizeApprox: z.string().trim().max(40).optional().or(z.literal("")),
  idea: z.string().trim().max(1000).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  referenceImages: z.array(z.string().url()).max(5).optional(),
  contactSource: z
    .enum([
      CONTACT_SOURCE.WEB,
      CONTACT_SOURCE.CATALOGO,
      CONTACT_SOURCE.TRABAJO,
      CONTACT_SOURCE.PUBLICACION,
      CONTACT_SOURCE.RESERVA,
    ])
    .optional(),
});

export const testimonialSchema = z.object({
  authorName: z.string().trim().min(3).max(80),
  rating: z.coerce.number().int().min(1).max(5),
  content: z.string().trim().min(10).max(600),
});

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;
