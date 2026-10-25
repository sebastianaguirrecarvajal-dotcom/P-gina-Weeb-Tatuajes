import { prisma } from "./db";
import { getCurrentClient } from "./client-session";

/// Conjunto de IDs de trabajos marcados como favoritos por el cliente actual.
/// Devuelve también si hay sesión de cliente activa.
export async function getFavoriteContext(): Promise<{
  hasSession: boolean;
  favoriteIds: Set<string>;
}> {
  const client = await getCurrentClient();
  if (!client) return { hasSession: false, favoriteIds: new Set() };
  const favs = await prisma.favorite.findMany({
    where: { clientId: client.id },
    select: { workId: true },
  });
  return { hasSession: true, favoriteIds: new Set(favs.map((f) => f.workId)) };
}
