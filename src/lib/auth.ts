import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const ADMIN_COOKIE = "estudio_admin";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 días

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET no está definido");
  return new TextEncoder().encode(secret);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/// Valida credenciales del tatuador contra el Studio singleton.
export async function authenticateArtist(email: string, password: string) {
  const studio = await prisma.studio.findUnique({ where: { email: email.toLowerCase() } });
  if (!studio) return null;
  const ok = await verifyPassword(password, studio.passwordHash);
  if (!ok) return null;
  return studio;
}

export async function createAdminSession(studioId: string) {
  const token = await new SignJWT({ sid: studioId, role: "artist" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSecret());

  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}

export function destroyAdminSession() {
  cookies().set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/// Devuelve el Studio autenticado o null. Usar en páginas/handlers del panel.
export async function getCurrentArtist() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const sid = payload.sid as string | undefined;
    if (!sid) return null;
    return prisma.studio.findUnique({ where: { id: sid } });
  } catch {
    return null;
  }
}

export { ADMIN_COOKIE };
