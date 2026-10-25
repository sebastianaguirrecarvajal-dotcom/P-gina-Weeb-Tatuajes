import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireArtist } from "@/lib/admin";
import { formatDateTime, formatDate } from "@/lib/format";
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_COLOR } from "@/lib/constants";
import { PageHeader } from "@/components/admin/PageHeader";
import { updateClientNotesAction } from "../../admin-actions";

export const metadata: Metadata = { title: "Ficha de cliente", robots: { index: false } };

export default async function ClienteDetailPage({ params }: { params: { id: string } }) {
  await requireArtist();
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: { bookings: { orderBy: { start: "desc" } } },
  });
  if (!client) notFound();

  return (
    <div>
      <Link href="/admin/clientes" className="mb-4 inline-block text-sm text-bone-200/60 hover:text-accent">← Clientes</Link>
      <PageHeader title={client.fullName} description={`Cliente desde ${formatDate(client.createdAt)}`} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <h2 className="mb-3 font-display text-lg text-bone-50">Historial de reservas</h2>
          {client.bookings.length === 0 ? (
            <p className="text-sm text-bone-200/60">Sin reservas.</p>
          ) : (
            <div className="space-y-2">
              {client.bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-bone-200/10 bg-ink-900 px-4 py-3 text-sm">
                  <div>
                    <p className="text-bone-100">{formatDateTime(b.start)}</p>
                    <p className="text-xs text-bone-200/50">{b.bodyZone ?? "—"} · {b.idea ?? ""}</p>
                  </div>
                  <span className={`badge ${BOOKING_STATUS_COLOR[b.status]}`}>{BOOKING_STATUS_LABEL[b.status]}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-accent">Contacto</h3>
            <p className="mt-1 text-bone-100">{client.phone ?? "Sin teléfono"}</p>
          </div>

          <div className="card">
            <h3 className="mb-2 text-sm font-semibold text-accent">Notas internas</h3>
            <p className="mb-3 text-xs text-bone-200/50">Privadas. El cliente nunca las ve.</p>
            <form action={updateClientNotesAction}>
              <input type="hidden" name="id" value={client.id} />
              <textarea name="internalNotes" defaultValue={client.internalNotes} className="input min-h-[120px]" placeholder="Alergias, preferencias, acuerdos…" />
              <button className="btn-primary mt-3 w-full">Guardar notas</button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
