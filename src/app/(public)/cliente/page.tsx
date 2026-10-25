import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentClient } from "@/lib/client-session";
import { getStudioOrThrow } from "@/lib/studio";
import { formatDateTime } from "@/lib/format";
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_COLOR } from "@/lib/constants";
import { loginClientAction, logoutClientAction } from "./actions";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { TestimonialForm } from "@/components/TestimonialForm";

export const metadata: Metadata = { title: "Mi espacio" };

export default async function ClientePage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const client = await getCurrentClient();
  const studio = await getStudioOrThrow();

  // --- No hay sesión: ingreso por nombre ---
  if (!client) {
    const next = searchParams.next || "/cliente";
    return (
      <div className="container-page flex min-h-[70vh] max-w-md flex-col justify-center py-16">
        <div className="card">
          <h1 className="font-display text-2xl text-bone-50">Tu espacio de cliente</h1>
          <p className="mt-2 text-sm text-bone-200/70">
            Sin registros ni contraseñas. Introduce tu nombre completo para continuar.
          </p>
          <form action={loginClientAction} className="mt-6 space-y-4">
            <input type="hidden" name="next" value={next} />
            <div>
              <label htmlFor="fullName" className="label">Nombre completo</label>
              <input
                id="fullName"
                name="fullName"
                required
                minLength={3}
                autoComplete="name"
                placeholder="Ej: Ana López"
                className="input"
              />
              {searchParams.error && (
                <p className="mt-1 text-sm text-rose-400">Introduce un nombre válido.</p>
              )}
            </div>
            <button type="submit" className="btn-primary w-full">Continuar</button>
          </form>
          <p className="mt-4 text-center text-xs text-bone-200/50">
            Usaremos tu nombre sólo para asociar tus consultas y reservas durante esta sesión.
          </p>
        </div>
      </div>
    );
  }

  // --- Con sesión: panel del cliente ---
  const bookings = await prisma.booking.findMany({
    where: { clientId: client.id },
    orderBy: { start: "desc" },
  });
  const favorites = await prisma.favorite.findMany({
    where: { clientId: client.id },
    include: { work: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const upcoming = bookings.filter((b) => b.start >= now && !["CANCELADA", "RECHAZADA"].includes(b.status));
  const past = bookings.filter((b) => b.start < now || ["CANCELADA", "RECHAZADA"].includes(b.status));
  const hasCompleted = bookings.some((b) => b.status === "COMPLETADA");

  return (
    <div className="container-page py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Mi espacio</p>
          <h1 className="font-display text-3xl text-bone-50">Hola, {client.fullName.split(" ")[0]}</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/reservar" className="btn-primary">Nueva reserva</Link>
          <form action={logoutClientAction}>
            <button type="submit" className="btn-ghost">Salir</button>
          </form>
        </div>
      </div>

      {/* Próximas reservas */}
      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl text-bone-50">Próximas reservas</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-xl2 border border-dashed border-bone-200/15 p-8 text-center">
            <p className="text-bone-200/70">No tienes reservas próximas.</p>
            <Link href="/reservar" className="btn-outline mt-4">Solicitar una cita</Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {upcoming.map((b) => (
              <div key={b.id} className="card">
                <div className="flex items-center justify-between">
                  <span className={`badge ${BOOKING_STATUS_COLOR[b.status]}`}>{BOOKING_STATUS_LABEL[b.status]}</span>
                  {b.style && <span className="text-xs text-bone-200/50">{b.style === "COLOR" ? "Color" : "Blanco y Negro"}</span>}
                </div>
                <p className="mt-3 font-medium text-bone-50">{formatDateTime(b.start)}</p>
                {b.bodyZone && <p className="text-sm text-bone-200/70">Zona: {b.bodyZone}</p>}
                {b.idea && <p className="mt-2 line-clamp-2 text-sm text-bone-200/60">{b.idea}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Historial */}
      {past.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 font-display text-xl text-bone-50">Historial</h2>
          <div className="overflow-hidden rounded-xl2 border border-bone-200/10">
            <table className="w-full text-sm">
              <tbody>
                {past.map((b) => (
                  <tr key={b.id} className="border-b border-bone-200/5 last:border-0">
                    <td className="px-4 py-3 text-bone-100">{formatDateTime(b.start)}</td>
                    <td className="px-4 py-3 text-bone-200/60">{b.bodyZone ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`badge ${BOOKING_STATUS_COLOR[b.status]}`}>{BOOKING_STATUS_LABEL[b.status]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Favoritos */}
      {favorites.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 font-display text-xl text-bone-50">Tus favoritos</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {favorites.map((f) => (
              <Link key={f.id} href={`/catalogo/${f.work.id}`} className="group relative aspect-[4/5] overflow-hidden rounded-xl2 border border-bone-200/10">
                <Image src={f.work.imageUrl} alt={f.work.title} fill className="object-cover transition-transform group-hover:scale-105" sizes="25vw" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/80 to-transparent p-3">
                  <p className="text-sm text-bone-50">{f.work.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {hasCompleted && (
        <section className="mt-10 max-w-lg">
          <TestimonialForm defaultName={client.fullName} />
        </section>
      )}

      <div className="mt-12 rounded-xl2 border border-accent/20 bg-ink-900 p-6 text-center">
        <p className="text-bone-100">¿Alguna duda con tu reserva?</p>
        <div className="mt-4 flex justify-center">
          <WhatsAppButton number={studio.whatsappNumber} context="reserva" label="Consultar por WhatsApp" />
        </div>
      </div>
    </div>
  );
}
