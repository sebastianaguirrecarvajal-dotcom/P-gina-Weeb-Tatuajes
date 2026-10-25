import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireArtist } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/admin/PageHeader";

export const metadata: Metadata = { title: "Clientes", robots: { index: false } };

export default async function ClientesPage({ searchParams }: { searchParams: { q?: string } }) {
  await requireArtist();
  const q = (searchParams.q ?? "").trim();

  const clients = await prisma.client.findMany({
    where: q ? { fullName: { contains: q } } : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bookings: true } } },
  });

  return (
    <div>
      <PageHeader title="Clientes" description="Base de clientes del estudio." />

      <form className="mb-6 max-w-sm">
        <input name="q" defaultValue={q} placeholder="Buscar por nombre…" className="input" />
      </form>

      {clients.length === 0 ? (
        <p className="text-bone-200/60">No se encontraron clientes.</p>
      ) : (
        <div className="overflow-hidden rounded-xl2 border border-bone-200/10">
          <table className="w-full text-sm">
            <thead className="bg-ink-900 text-left text-bone-200/60">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Reservas</th>
                <th className="px-4 py-3">Alta</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-t border-bone-200/5 hover:bg-ink-900">
                  <td className="px-4 py-3">
                    <Link href={`/admin/clientes/${c.id}`} className="text-bone-100 hover:text-accent">{c.fullName}</Link>
                  </td>
                  <td className="px-4 py-3 text-bone-200/70">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-bone-200/70">{c._count.bookings}</td>
                  <td className="px-4 py-3 text-bone-200/50">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
