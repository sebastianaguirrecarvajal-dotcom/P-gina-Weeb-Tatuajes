import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireArtist } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import {
  BOOKING_STATUS_LABEL,
  BOOKING_STATUS_COLOR,
  CONTACT_SOURCE_LABEL,
  STYLE_LABEL,
} from "@/lib/constants";
import { parseStringArray } from "@/lib/json";
import { PageHeader } from "@/components/admin/PageHeader";
import { updateBookingStatusAction, updateBookingNotesAction } from "../admin-actions";

export const metadata: Metadata = { title: "Reservas", robots: { index: false } };

const FILTERS = [
  { key: "all", label: "Todas" },
  { key: "SOLICITADA", label: "Solicitadas" },
  { key: "EN_REVISION", label: "En revisión" },
  { key: "ACEPTADA", label: "Aceptadas" },
  { key: "CONFIRMADA", label: "Confirmadas" },
  { key: "COMPLETADA", label: "Completadas" },
  { key: "CANCELADA", label: "Canceladas" },
];

// Transiciones sugeridas desde cada estado.
const NEXT_ACTIONS: Record<string, { status: string; label: string }[]> = {
  SOLICITADA: [
    { status: "EN_REVISION", label: "Revisar" },
    { status: "ACEPTADA", label: "Aceptar" },
    { status: "RECHAZADA", label: "Rechazar" },
  ],
  EN_REVISION: [
    { status: "ACEPTADA", label: "Aceptar" },
    { status: "RECHAZADA", label: "Rechazar" },
  ],
  ACEPTADA: [
    { status: "CONFIRMADA", label: "Confirmar" },
    { status: "CANCELADA", label: "Cancelar" },
  ],
  CONFIRMADA: [
    { status: "COMPLETADA", label: "Marcar completada" },
    { status: "CANCELADA", label: "Cancelar" },
  ],
  REPROGRAMADA: [
    { status: "CONFIRMADA", label: "Confirmar" },
    { status: "CANCELADA", label: "Cancelar" },
  ],
};

export default async function ReservasPage({ searchParams }: { searchParams: { status?: string } }) {
  const studio = await requireArtist();
  const status = searchParams.status ?? "all";

  const bookings = await prisma.booking.findMany({
    where: { studioId: studio.id, ...(status !== "all" ? { status } : {}) },
    orderBy: { start: "desc" },
    include: { client: true },
  });

  return (
    <div>
      <PageHeader title="Reservas" description="Solicitudes y citas de tus clientes." />

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = status === f.key;
          return (
            <Link
              key={f.key}
              href={f.key === "all" ? "/admin/reservas" : `/admin/reservas?status=${f.key}`}
              className={`rounded-full border px-3.5 py-1.5 text-sm ${
                active ? "border-accent bg-accent text-ink-950" : "border-bone-200/15 text-bone-200 hover:border-accent"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {bookings.length === 0 ? (
        <p className="text-bone-200/60">No hay reservas en este filtro.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const refs = parseStringArray(b.referenceImages);
            const actions = NEXT_ACTIONS[b.status] ?? [];
            return (
              <div key={b.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {b.client ? (
                        <Link href={`/admin/clientes/${b.client.id}`} className="font-medium text-bone-50 hover:text-accent">
                          {b.clientName}
                        </Link>
                      ) : (
                        <span className="font-medium text-bone-50">{b.clientName}</span>
                      )}
                      <span className={`badge ${BOOKING_STATUS_COLOR[b.status]}`}>{BOOKING_STATUS_LABEL[b.status]}</span>
                    </div>
                    <p className="mt-1 text-sm text-bone-200/70">{formatDateTime(b.start)} → {formatDateTime(b.end)}</p>
                    <p className="text-xs text-bone-200/50">
                      Origen: {CONTACT_SOURCE_LABEL[b.contactSource]}
                      {b.clientPhone && ` · ${b.clientPhone}`}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {actions.map((a) => (
                      <form key={a.status} action={updateBookingStatusAction}>
                        <input type="hidden" name="id" value={b.id} />
                        <input type="hidden" name="status" value={a.status} />
                        <button type="submit" className="btn-outline px-3 py-1.5 text-xs">{a.label}</button>
                      </form>
                    ))}
                  </div>
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-accent">Detalles del proyecto</summary>
                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <Info label="Estilo" value={b.style ? STYLE_LABEL[b.style] : "—"} />
                    <Info label="Zona" value={b.bodyZone ?? "—"} />
                    <Info label="Tamaño" value={b.sizeApprox ?? "—"} />
                    <Info label="Idea" value={b.idea ?? "—"} />
                    {b.notes && <Info label="Comentarios" value={b.notes} />}
                    {refs.length > 0 && (
                      <div className="sm:col-span-2">
                        <p className="text-bone-200/50">Referencias</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {refs.map((r) => (
                            <a key={r} href={r} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                              Ver imagen ↗
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <form action={updateBookingNotesAction} className="mt-4">
                    <input type="hidden" name="id" value={b.id} />
                    <label className="label">Notas internas (no visibles para el cliente)</label>
                    <textarea name="internalNotes" defaultValue={b.internalNotes} className="input min-h-[60px]" />
                    <button type="submit" className="btn-ghost mt-2 text-xs">Guardar notas</button>
                  </form>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-bone-200/50">{label}</p>
      <p className="text-bone-100">{value}</p>
    </div>
  );
}
