import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { getCurrentArtist } from "@/lib/auth";

// POST /api/upload (multipart, campo "file") — subida de imágenes del tatuador.
//
// V1: almacenamiento LOCAL en /public/uploads (ideal para desarrollo y un único
// servidor). PREPARADO para sustituir por un almacenamiento de objetos
// (S3/R2/Cloudinary) cambiando sólo esta función: el resto de la app trabaja
// con la URL devuelta.
//
// Sólo el tatuador autenticado puede subir imágenes.
const MAX_BYTES = 6 * 1024 * 1024; // 6 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

export async function POST(req: NextRequest) {
  const artist = await getCurrentArtist();
  if (!artist) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Formato no permitido" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Imagen demasiado grande (máx. 6 MB)" }, { status: 413 });
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const name = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), bytes);

  return NextResponse.json({ url: `/uploads/${name}` });
}
