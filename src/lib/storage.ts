import "server-only";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

// -----------------------------------------------------------------------------
// Almacenamiento de imágenes — capa de abstracción con driver seleccionable.
//
// La aplicación nunca sabe DÓNDE se guarda la imagen: sólo recibe una URL
// pública. Esto permite cambiar de proveedor sin tocar el catálogo, el blog ni
// el panel.
//
//   STORAGE_DRIVER = "local"  → disco local en /public/uploads (SOLO desarrollo;
//                               el filesystem de Vercel es efímero/solo lectura).
//   STORAGE_DRIVER = "s3"     → cualquier almacenamiento compatible con S3:
//                               AWS S3, Cloudflare R2, Supabase Storage (endpoint
//                               S3), MinIO… configurado por variables de entorno.
//
// Si no se define STORAGE_DRIVER pero existen las variables S3, se usa "s3".
// -----------------------------------------------------------------------------

// 4 MB: las funciones serverless de Vercel limitan el cuerpo de la petición a
// ~4,5 MB, así que un tope mayor sería inalcanzable (Vercel devolvería 413
// antes de llegar a la función). Para imágenes de más resolución, migrar a
// subida firmada directa cliente→storage (ver README / FUTURO).
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB
export const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export type StorageDriver = "local" | "s3";

export function activeDriver(): StorageDriver {
  const explicit = process.env.STORAGE_DRIVER?.toLowerCase();
  if (explicit === "s3" || explicit === "local") return explicit;
  // Autodetección: si hay bucket + credenciales, usamos S3.
  if (process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID) return "s3";
  return "local";
}

function buildKey(contentType: string, originalName?: string): string {
  const ext =
    EXT_BY_MIME[contentType] ||
    (originalName?.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "jpg";
  const stamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `uploads/${stamp}/${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
}

/// Guarda un objeto y devuelve su URL pública. Único punto de entrada.
export async function putImage(
  bytes: Buffer,
  contentType: string,
  originalName?: string
): Promise<{ url: string; key: string }> {
  const key = buildKey(contentType, originalName);
  if (activeDriver() === "s3") return putToS3(bytes, contentType, key);
  return putToLocal(bytes, key);
}

// --- Driver local (desarrollo) ---------------------------------------------
async function putToLocal(bytes: Buffer, key: string): Promise<{ url: string; key: string }> {
  // key = "uploads/2026-01-01/xxxx.jpg" → /public/uploads/...
  const rel = key.replace(/^uploads\//, "");
  const dir = path.join(process.cwd(), "public", "uploads", path.dirname(rel));
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(process.cwd(), "public", "uploads", rel), bytes);
  return { url: `/uploads/${rel}`, key };
}

// --- Driver S3-compatible (producción) -------------------------------------
async function putToS3(
  bytes: Buffer,
  contentType: string,
  key: string
): Promise<{ url: string; key: string }> {
  const bucket = requireEnv("S3_BUCKET");
  const region = process.env.S3_REGION || "auto";
  const endpoint = process.env.S3_ENDPOINT; // vacío para AWS S3 nativo
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

  // Importación perezosa: el SDK sólo se carga cuando realmente se usa S3.
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region,
    ...(endpoint ? { endpoint } : {}),
    forcePathStyle,
    credentials: {
      accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bytes,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  // URL pública: base explícita (CDN / dominio público del bucket) o, si no se
  // define, construida a partir del endpoint y el bucket.
  const base = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
  const url = base
    ? `${base}/${key}`
    : endpoint
    ? `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  return { url, key };
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta la variable de entorno ${name} para el almacenamiento S3`);
  return v;
}
