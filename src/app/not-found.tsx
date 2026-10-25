import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-4 text-center">
      <p className="font-display text-6xl text-accent">404</p>
      <h1 className="mt-4 font-display text-2xl text-bone-50">Página no encontrada</h1>
      <p className="mt-2 text-bone-200/60">La página que buscas no existe o fue movida.</p>
      <Link href="/" className="btn-primary mt-6">Volver al inicio</Link>
    </div>
  );
}
