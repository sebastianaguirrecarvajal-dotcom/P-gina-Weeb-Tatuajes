"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/perfil", label: "Sobre mí" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "Preguntas" },
  { href: "/reservar", label: "Reservar" },
  { href: "/contacto", label: "Contacto" },
];

export function Navbar({
  studioName,
  clientName,
}: {
  studioName: string;
  clientName?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-bone-200/10 bg-ink-950/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight text-bone-50">
          {studioName}
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-3.5 py-2 text-sm transition-colors ${
                  active ? "text-accent" : "text-bone-200 hover:text-bone-50"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/cliente"
            className="hidden rounded-full border border-bone-200/20 px-3.5 py-2 text-sm text-bone-100 hover:border-accent hover:text-accent sm:inline-flex"
          >
            {clientName ? `Hola, ${clientName.split(" ")[0]}` : "Mi espacio"}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-bone-100 hover:bg-ink-800 md:hidden"
            aria-label="Abrir menú"
            aria-expanded={open}
          >
            <span className="relative block h-4 w-5">
              <span className={`absolute left-0 top-0 h-0.5 w-5 bg-current transition ${open ? "translate-y-1.5 rotate-45" : ""}`} />
              <span className={`absolute left-0 top-1.5 h-0.5 w-5 bg-current transition ${open ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 top-3 h-0.5 w-5 bg-current transition ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-bone-200/10 bg-ink-950 md:hidden">
          <div className="container-page flex flex-col py-2">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm text-bone-100 hover:bg-ink-800"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/cliente"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm text-accent hover:bg-ink-800"
            >
              {clientName ? `Mi espacio (${clientName.split(" ")[0]})` : "Mi espacio"}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
