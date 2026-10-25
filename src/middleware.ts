import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Defensa en profundidad: bloquea el acceso a /admin/* (salvo /admin/login) si
// no hay una cookie de sesión válida. La verificación completa (existencia del
// Studio) se hace además en el layout del panel.
const ADMIN_COOKIE = "estudio_admin";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    const secret = process.env.AUTH_SECRET;
    let valid = false;
    if (token && secret) {
      try {
        await jwtVerify(token, new TextEncoder().encode(secret));
        valid = true;
      } catch {
        valid = false;
      }
    }
    if (!valid) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
