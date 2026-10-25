import { prisma } from "./db";
import { parseStringArray } from "./json";

// Acceso al Studio singleton (V1 = un único tatuador). Centralizado para poder
// cachear o ampliar a multi-estudio en el futuro sin tocar las páginas.

export async function getStudio() {
  // En V1 tomamos el primer (único) estudio.
  return prisma.studio.findFirst();
}

export async function getStudioOrThrow() {
  const studio = await getStudio();
  if (!studio) {
    throw new Error(
      "No existe un Studio. Ejecuta `npm run db:seed` para crear los datos iniciales."
    );
  }
  return studio;
}

/// Vista pública del estudio (sin datos sensibles como passwordHash).
export function toPublicStudio(studio: NonNullable<Awaited<ReturnType<typeof getStudio>>>) {
  return {
    artistName: studio.artistName,
    studioName: studio.studioName,
    tagline: studio.tagline,
    bio: studio.bio,
    experience: studio.experience,
    specialties: parseStringArray(studio.specialties),
    location: studio.location,
    address: studio.address,
    avatarUrl: studio.avatarUrl,
    heroImageUrl: studio.heroImageUrl,
    whatsappNumber: studio.whatsappNumber,
    emailPublic: studio.email_public,
    instagram: studio.instagram,
    tiktok: studio.tiktok,
    facebook: studio.facebook,
    website: studio.website,
    bookingPolicy: studio.bookingPolicy,
  };
}

export type PublicStudio = ReturnType<typeof toPublicStudio>;
