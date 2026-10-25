import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { prisma } from "./db";

// Identidad del cliente SIN contraseña.
//
// El cliente sólo introduce su nombre completo. Generamos un token opaco en una
// cookie httpOnly que vincula el navegador con un registro Client. Así:
//   - La experiencia es inmediata (sin registro ni email).
//   - No exponemos datos de un cliente a otro que conozca su nombre: el acceso
//     a reservas/favoritos va por el token de sesión, nunca por el nombre.
//   - Está preparado para evolucionar a una identidad más robusta (OTP por
//     WhatsApp, por ejemplo) añadiendo verificación sobre ClientSession, sin
//     rehacer el resto del modelo.

const CLIENT_COOKIE = "estudio_cliente";
const CLIENT_DURATION = 60 * 60 * 24 * 90; // 90 días

function newToken(): string {
  return randomBytes(32).toString("hex");
}

/// Crea (o reutiliza) un Client por nombre y abre una sesión en cookie.
export async function startClientSession(fullName: string, phone?: string) {
  const name = fullName.trim().replace(/\s+/g, " ");

  // Reutilizamos un Client con el mismo nombre si existe; si no, lo creamos.
  // En V1 el nombre es el identificador de arranque de la experiencia.
  let client = await prisma.client.findFirst({ where: { fullName: name } });
  if (!client) {
    client = await prisma.client.create({ data: { fullName: name, phone: phone || null } });
  } else if (phone && !client.phone) {
    client = await prisma.client.update({ where: { id: client.id }, data: { phone } });
  }

  const token = newToken();
  await prisma.clientSession.create({ data: { token, clientId: client.id } });

  cookies().set(CLIENT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CLIENT_DURATION,
  });

  return client;
}

/// Cliente de la sesión actual, o null.
export async function getCurrentClient() {
  const token = cookies().get(CLIENT_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.clientSession.findUnique({
    where: { token },
    include: { client: true },
  });
  if (!session) return null;
  // Actualización ligera de "visto por última vez" (sin bloquear la respuesta).
  prisma.clientSession
    .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
    .catch(() => {});
  return session.client;
}

export function endClientSession() {
  cookies().set(CLIENT_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export { CLIENT_COOKIE };
