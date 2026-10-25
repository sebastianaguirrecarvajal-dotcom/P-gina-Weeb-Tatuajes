"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartIcon } from "./icons";

// Botón de favorito. Asociado a la sesión del cliente (cookie). Si no hay
// sesión, redirige al ingreso por nombre. Pensado para poder retirarse en el
// futuro sin afectar al resto de la app.
export function FavoriteButton({
  workId,
  initialFavorited,
  hasSession,
}: {
  workId: string;
  initialFavorited: boolean;
  hasSession: boolean;
}) {
  const router = useRouter();
  const [fav, setFav] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!hasSession) {
      router.push("/cliente?next=/catalogo");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workId }),
      });
      if (res.ok) {
        const data = await res.json();
        setFav(data.favorited);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-pressed={fav}
      aria-label={fav ? "Quitar de favoritos" : "Guardar en favoritos"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full backdrop-blur transition ${
        fav ? "bg-rose-500/20 text-rose-400" : "bg-ink-950/60 text-bone-100 hover:text-rose-400"
      }`}
    >
      <HeartIcon filled={fav} className="h-5 w-5" />
    </button>
  );
}
