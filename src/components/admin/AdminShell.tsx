"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/admin", label: "Resumen", exact: true },
  { href: "/admin/agenda", label: "Agenda" },
  { href: "/admin/reservas", label: "Reservas" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/catalogo", label: "Catálogo" },
  { href: "/admin/blog", label: "Publicaciones" },
  { href: "/admin/faq", label: "Preguntas" },
  { href: "/admin/testimonios", label: "Testimonios" },
  { href: "/admin/configuracion", label: "Configuración" },
];

export function AdminShell({
  artistName,
  pendingCount,
  children,
  logout,
}: {
  artistName: string;
  pendingCount: number;
  children: React.ReactNode;
  logout: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((n) => {
        const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setOpen(false)}
            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
              active ? "bg-accent text-ink-950" : "text-bone-200 hover:bg-ink-800"
            }`}
          >
            {n.label}
            {n.href === "/admin/reservas" && pendingCount > 0 && (
              <span className={`badge ${active ? "bg-ink-950/20 text-ink-950" : "bg-accent/20 text-accent"} border-0`}>
                {pendingCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-ink-950 lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar desktop */}
      <aside className="hidden flex-col border-r border-bone-200/10 bg-ink-900 p-4 lg:flex">
        <Link href="/admin" className="mb-6 block px-3 font-display text-lg text-bone-50">
          {artistName}
        </Link>
        {nav}
        <div className="mt-auto space-y-2 pt-6">
          <Link href="/" className="block px-3 text-sm text-bone-200/60 hover:text-accent">Ver sitio público ↗</Link>
          {logout}
        </div>
      </aside>

      {/* Topbar móvil */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between border-b border-bone-200/10 bg-ink-900 px-4 py-3">
          <Link href="/admin" className="font-display text-bone-50">{artistName}</Link>
          <button onClick={() => setOpen((o) => !o)} className="rounded-lg px-3 py-2 text-bone-100 hover:bg-ink-800">
            Menú
          </button>
        </div>
        {open && <div className="border-b border-bone-200/10 bg-ink-900 p-4">{nav}<div className="mt-4">{logout}</div></div>}
      </div>

      <div className="p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}
