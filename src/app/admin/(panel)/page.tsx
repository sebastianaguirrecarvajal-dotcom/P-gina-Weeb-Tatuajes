import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireArtist } from "@/lib/admin";
import { formatDateTime, formatDate } from "@/lib/format";
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_COLOR, CONTACT_SOURCE_LABEL } from "@/lib/constants";
import { PageHeader } from "@/components/admin/PageHeader";

export const metadata: Metadata = { title: "Resumen", robots: { index: false } };

function Stat({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const inner = (
    <div className="card transition-colors hover:border-accent/40">
      <p className="text-sm text-bone-200/60">{label}</p>
      <p className="mt-1 font-display text-3xl text-bone-50">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function DashboardPage() {
  const studio = await requireArtist();
  const now = new Date();
  const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);

  const [todayCount, pending, confirmedUpcoming, clientsCount, recentClients, upcoming, recentPosts, recentNotifs] =
    await Promise.all([
      prisma.booking.count({ where: { studioId: studio.id, start: { gte: dayStart, lt: dayEnd }, status: { notIn: ["CANCELADA", "RECHAZADA"] } } }),
      prisma.booking.count({ where: { studioId: studio.id, status: { in: ["SOLICITADA", "EN_REVISION"] } } }),
      prisma.booking.count({ where: { studioId: studio.id, status: { in: ["ACEPTADA", "CONFIRMADA"] }, start: { gte: now } } }),
      prisma.client.count(),
      prisma.client.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.booking.findMany({
        where: { studioId: studio.id, start: { gte: now }, status: { notIn: ["CANCELADA", "RECHAZADA"] } },
        orderBy: { start: "asc" },
        take: 6,
      }),
      prisma.post.findMany({ orderBy: { updatedAt: "desc" }, take: 4 }),
      prisma.notification.findMany({ where: { audience: "ARTIST" }, orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

  return (
    <div>
      <PageHeader title={`Hola, ${studio.artistName}`} description="Resumen de tu estudio." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Citas hoy" value={todayCount} href="/admin/agenda" />
        <Stat label="Solicitudes pendientes" value={pending} href="/admin/reservas?status=SOLICITADA" />
        <Stat label="Próximas confirmadas" value={confirmedUpcoming} href="/admin/reservas" />
        <Stat label="Clientes" value={clientsCount} href="/admin/clientes" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-bone-50">Próximas citas</h2>
            <Link href="/admin/agenda" className="text-sm text-accent hover:underline">Ver agenda</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-bone-200/60">No hay citas próximas.</p>
          ) : (
            <ul className="divide-y divide-bone-200/5">
              {upcoming.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-bone-100">{b.clientName}</p>
                    <p className="text-xs text-bone-200/50">{formatDateTime(b.start)} · {CONTACT_SOURCE_LABEL[b.contactSource]}</p>
                  </div>
                  <span className={`badge ${BOOKING_STATUS_COLOR[b.status]}`}>{BOOKING_STATUS_LABEL[b.status]}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2 className="mb-4 font-display text-lg text-bone-50">Actividad reciente</h2>
          {recentNotifs.length === 0 ? (
            <p className="text-sm text-bone-200/60">Sin actividad.</p>
          ) : (
            <ul className="divide-y divide-bone-200/5">
              {recentNotifs.map((n) => (
                <li key={n.id} className="py-3">
                  <p className="text-sm text-bone-100">{n.title}</p>
                  {n.body && <p className="text-xs text-bone-200/50">{n.body}</p>}
                  <p className="text-xs text-bone-200/40">{formatDateTime(n.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-bone-50">Clientes recientes</h2>
            <Link href="/admin/clientes" className="text-sm text-accent hover:underline">Ver todos</Link>
          </div>
          {recentClients.length === 0 ? (
            <p className="text-sm text-bone-200/60">Aún no hay clientes.</p>
          ) : (
            <ul className="divide-y divide-bone-200/5">
              {recentClients.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-3">
                  <Link href={`/admin/clientes/${c.id}`} className="text-sm text-bone-100 hover:text-accent">{c.fullName}</Link>
                  <span className="text-xs text-bone-200/50">{formatDate(c.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-bone-50">Publicaciones</h2>
            <Link href="/admin/blog" className="text-sm text-accent hover:underline">Gestionar</Link>
          </div>
          {recentPosts.length === 0 ? (
            <p className="text-sm text-bone-200/60">Sin publicaciones.</p>
          ) : (
            <ul className="divide-y divide-bone-200/5">
              {recentPosts.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <span className="text-sm text-bone-100">{p.title}</span>
                  <span className="text-xs text-bone-200/50">{p.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
