import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentArtist } from "@/lib/auth";
import { loginArtistAction } from "./actions";

export const metadata: Metadata = { title: "Acceso del estudio", robots: { index: false } };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  // Si ya hay sesión, al panel.
  if (await getCurrentArtist()) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 block text-center text-sm text-bone-200/60 hover:text-accent">
          ← Volver al sitio
        </Link>
        <div className="card">
          <h1 className="font-display text-2xl text-bone-50">Acceso del estudio</h1>
          <p className="mt-1 text-sm text-bone-200/60">Área privada del tatuador.</p>

          <form action={loginArtistAction} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" name="email" type="email" required autoComplete="username" className="input" />
            </div>
            <div>
              <label htmlFor="password" className="label">Contraseña</label>
              <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
            </div>
            {searchParams.error && (
              <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                Credenciales incorrectas.
              </p>
            )}
            <button type="submit" className="btn-primary w-full">Entrar</button>
          </form>
        </div>
      </div>
    </div>
  );
}
