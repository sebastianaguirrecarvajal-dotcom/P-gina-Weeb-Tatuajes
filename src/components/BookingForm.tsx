"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toDateKey, formatTime, formatDate } from "@/lib/format";

interface Slot {
  start: string;
  end: string;
  available: boolean;
}

const DURATIONS = [
  { value: 60, label: "± 1 hora" },
  { value: 90, label: "± 1,5 horas" },
  { value: 120, label: "± 2 horas" },
  { value: 180, label: "± 3 horas" },
  { value: 240, label: "Media jornada" },
];

export function BookingForm({
  defaultName,
  defaultStyle,
  bookingPolicy,
}: {
  defaultName?: string;
  defaultStyle?: string;
  bookingPolicy?: string;
}) {
  const router = useRouter();

  const [duration, setDuration] = useState(90);
  const [dateKey, setDateKey] = useState(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return toDateKey(t);
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const [form, setForm] = useState({
    clientName: defaultName ?? "",
    clientPhone: "",
    style: defaultStyle ?? "",
    bodyZone: "",
    sizeApprox: "",
    idea: "",
    notes: "",
    references: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carga de huecos al cambiar fecha o duración.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingSlots(true);
      setSelected(null);
      try {
        const res = await fetch(`/api/availability?date=${dateKey}&duration=${duration}`);
        const data = await res.json();
        if (!cancelled) setSlots(data.slots ?? []);
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [dateKey, duration]);

  const availableSlots = slots.filter((s) => s.available);

  const minDate = toDateKey(new Date());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selected) {
      setError("Selecciona una fecha y hora disponibles.");
      return;
    }
    if (form.clientName.trim().length < 3) {
      setError("Introduce tu nombre completo.");
      return;
    }
    setSubmitting(true);
    try {
      const references = form.references
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter((s) => /^https?:\/\//.test(s))
        .slice(0, 5);

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: selected,
          durationMin: duration,
          clientName: form.clientName,
          clientPhone: form.clientPhone || undefined,
          style: form.style || undefined,
          bodyZone: form.bodyZone || undefined,
          sizeApprox: form.sizeApprox || undefined,
          idea: form.idea || undefined,
          notes: form.notes || undefined,
          referenceImages: references,
          contactSource: "RESERVA",
        }),
      });

      if (res.status === 409) {
        setError("Ese horario acaba de ocuparse. Elige otro, por favor.");
        // Recargar huecos.
        const r = await fetch(`/api/availability?date=${dateKey}&duration=${duration}`);
        const d = await r.json();
        setSlots(d.slots ?? []);
        setSelected(null);
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "No se pudo enviar la solicitud.");
        return;
      }

      router.push("/reservar/gracias");
    } finally {
      setSubmitting(false);
    }
  }

  function upd(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      {/* Paso 1: disponibilidad */}
      <div className="space-y-5">
        <div className="card">
          <h3 className="font-display text-lg text-bone-50">1 · Elige fecha y hora</h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Duración estimada</label>
              <select className="input" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                {DURATIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Día</label>
              <input type="date" className="input" min={minDate} value={dateKey} onChange={(e) => setDateKey(e.target.value)} />
            </div>
          </div>

          <div className="mt-5">
            <p className="label">Horarios disponibles — {formatDate(new Date(dateKey + "T00:00:00"))}</p>
            {loadingSlots ? (
              <p className="text-sm text-bone-200/60">Consultando disponibilidad…</p>
            ) : availableSlots.length === 0 ? (
              <p className="rounded-lg border border-bone-200/10 bg-ink-800 p-4 text-sm text-bone-200/60">
                No hay huecos disponibles este día. Prueba con otra fecha.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {availableSlots.map((s) => {
                  const active = selected === s.start;
                  return (
                    <button
                      key={s.start}
                      type="button"
                      onClick={() => setSelected(s.start)}
                      className={`rounded-lg border px-2 py-2 text-sm transition-colors ${
                        active
                          ? "border-accent bg-accent text-ink-950"
                          : "border-bone-200/15 text-bone-100 hover:border-accent"
                      }`}
                    >
                      {formatTime(s.start)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {bookingPolicy && (
          <div className="rounded-xl2 border border-bone-200/10 bg-ink-900 p-4 text-sm text-bone-200/70">
            <p className="mb-1 font-medium text-bone-100">Política de reserva</p>
            {bookingPolicy}
          </div>
        )}
      </div>

      {/* Paso 2: datos del proyecto */}
      <div className="card space-y-4">
        <h3 className="font-display text-lg text-bone-50">2 · Cuéntame tu proyecto</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nombre completo *</label>
            <input className="input" value={form.clientName} onChange={(e) => upd("clientName", e.target.value)} required minLength={3} placeholder="Ana López" />
          </div>
          <div>
            <label className="label">WhatsApp (opcional)</label>
            <input className="input" value={form.clientPhone} onChange={(e) => upd("clientPhone", e.target.value)} placeholder="+34 600 000 000" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Estilo</label>
            <select className="input" value={form.style} onChange={(e) => upd("style", e.target.value)}>
              <option value="">Sin preferencia</option>
              <option value="BLANCO_Y_NEGRO">Blanco y Negro</option>
              <option value="COLOR">Color</option>
            </select>
          </div>
          <div>
            <label className="label">Zona del cuerpo</label>
            <input className="input" value={form.bodyZone} onChange={(e) => upd("bodyZone", e.target.value)} placeholder="Antebrazo, hombro…" />
          </div>
        </div>

        <div>
          <label className="label">Tamaño aproximado</label>
          <input className="input" value={form.sizeApprox} onChange={(e) => upd("sizeApprox", e.target.value)} placeholder="Ej: 15 cm" />
        </div>

        <div>
          <label className="label">Tu idea</label>
          <textarea className="input min-h-[90px]" value={form.idea} onChange={(e) => upd("idea", e.target.value)} placeholder="Describe qué te gustaría tatuarte…" />
        </div>

        <div>
          <label className="label">Referencias (enlaces, opcional)</label>
          <textarea className="input min-h-[60px]" value={form.references} onChange={(e) => upd("references", e.target.value)} placeholder="Pega enlaces a imágenes de referencia (uno por línea)" />
          <p className="mt-1 text-xs text-bone-200/50">También podrás enviar imágenes por WhatsApp.</p>
        </div>

        <div>
          <label className="label">Comentarios adicionales</label>
          <textarea className="input min-h-[60px]" value={form.notes} onChange={(e) => upd("notes", e.target.value)} />
        </div>

        {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Enviando…" : "Enviar solicitud de reserva"}
        </button>
        <p className="text-center text-xs text-bone-200/50">
          Recibirás confirmación del estudio. No pedimos datos sensibles ni pagos online.
        </p>
      </div>
    </form>
  );
}
