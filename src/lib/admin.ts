import "server-only";
import { getCurrentArtist } from "./auth";

/// Obtiene el Studio autenticado o lanza. Usar en server actions del panel para
/// garantizar que ningún no-tatuador ejecuta mutaciones administrativas.
export async function requireArtist() {
  const studio = await getCurrentArtist();
  if (!studio) throw new Error("No autorizado");
  return studio;
}
