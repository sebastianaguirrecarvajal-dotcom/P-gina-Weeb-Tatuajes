import { NextRequest, NextResponse } from "next/server";
import { getCurrentArtist } from "@/lib/auth";
import { putImage, MAX_UPLOAD_BYTES, ALLOWED_MIME } from "@/lib/storage";

// POST /api/upload (multipart, campo "file") — subida de imágenes del tatuador.
//
// La ubicación real (disco local en dev, S3/R2/Supabase en producción) la
// decide `lib/storage.ts` según las variables de entorno. Aquí sólo validamos
// autorización y el archivo, y devolvemos la URL pública resultante.
//
// Sólo el tatuador autenticado puede subir imágenes.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const artist = await getCurrentArtist();
  if (!artist) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: "Formato no permitido" }, { status: 415 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Imagen demasiado grande (máx. 4 MB)" }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    const { url } = await putImage(bytes, file.type, file.name);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Error al subir imagen:", err);
    return NextResponse.json(
      { error: "No se pudo guardar la imagen. Revisa la configuración de almacenamiento." },
      { status: 500 }
    );
  }
}
