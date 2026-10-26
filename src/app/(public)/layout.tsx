import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { getStudioOrThrow, toPublicStudio } from "@/lib/studio";
import { getCurrentClient } from "@/lib/client-session";

// Las páginas públicas dependen de datos de la BD (perfil del estudio) y de la
// sesión del cliente (cookies). Las marcamos como dinámicas para que Next NO
// intente pre-renderizarlas durante el build: así un despliegue nunca falla por
// tener la base de datos vacía, y el contenido se sirve siempre actualizado.
export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const studioRecord = await getStudioOrThrow();
  const studio = toPublicStudio(studioRecord);
  const client = await getCurrentClient();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar studioName={studio.studioName} clientName={client?.fullName} />
      <main className="flex-1">{children}</main>
      <Footer studio={studio} />
      <FloatingWhatsApp number={studio.whatsappNumber} context="home" />
    </div>
  );
}
