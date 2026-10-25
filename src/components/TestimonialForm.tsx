"use client";

import { useState } from "react";

export function TestimonialForm({ defaultName }: { defaultName: string }) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [name, setName] = useState(defaultName);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName: name, rating, content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error || "No se pudo enviar.");
        setState("error");
        return;
      }
      setState("done");
    } catch {
      setMsg("No se pudo enviar.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="card text-center">
        <p className="text-bone-100">¡Gracias por tu testimonio! 🙏</p>
        <p className="mt-1 text-sm text-bone-200/60">Lo revisaré antes de publicarlo.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <h3 className="font-display text-lg text-bone-50">Deja tu testimonio</h3>
      <div>
        <label className="label">Tu valoración</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} className={`text-2xl ${n <= rating ? "text-accent" : "text-ink-600"}`} aria-label={`${n} estrellas`}>
              ★
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Nombre</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="input" minLength={3} required />
      </div>
      <div>
        <label className="label">Tu experiencia</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} className="input min-h-[90px]" minLength={10} maxLength={600} required />
      </div>
      {state === "error" && <p className="text-sm text-rose-400">{msg}</p>}
      <button type="submit" disabled={state === "sending"} className="btn-primary">
        {state === "sending" ? "Enviando…" : "Enviar testimonio"}
      </button>
    </form>
  );
}
