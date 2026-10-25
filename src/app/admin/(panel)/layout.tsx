import { redirect } from "next/navigation";
import { getCurrentArtist } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminShell } from "@/components/admin/AdminShell";
import { logoutArtistAction } from "./actions";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const studio = await getCurrentArtist();
  if (!studio) redirect("/admin/login");

  const pendingCount = await prisma.booking.count({
    where: { studioId: studio.id, status: { in: ["SOLICITADA", "EN_REVISION"] } },
  });

  const logout = (
    <form action={logoutArtistAction}>
      <button type="submit" className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-300 hover:bg-ink-800">
        Cerrar sesión
      </button>
    </form>
  );

  return (
    <AdminShell artistName={studio.artistName} pendingCount={pendingCount} logout={logout}>
      {children}
    </AdminShell>
  );
}
