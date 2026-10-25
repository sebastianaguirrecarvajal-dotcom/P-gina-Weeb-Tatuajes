import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireArtist } from "@/lib/admin";
import { parseStringArray } from "@/lib/json";
import { minutesToHHMM } from "@/lib/format";
import { WEEKDAYS } from "@/lib/constants";
import { PageHeader } from "@/components/admin/PageHeader";
import { saveSettingsAction, saveWorkingHoursAction } from "../admin-actions";

export const metadata: Metadata = { title: "Configuración", robots: { index: false } };

// Opciones de hora cada 30 min.
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => i * 30);

function TimeSelect({ name, value }: { name: string; value: number }) {
  return (
    <select name={name} defaultValue={value} className="input">
      {TIME_OPTIONS.map((m) => (
        <option key={m} value={m}>{minutesToHHMM(m)}</option>
      ))}
    </select>
  );
}

function BreakSelect({ name, value }: { name: string; value: number | null }) {
  return (
    <select name={name} defaultValue={value ?? ""} className="input">
      <option value="">—</option>
      {TIME_OPTIONS.map((m) => (
        <option key={m} value={m}>{minutesToHHMM(m)}</option>
      ))}
    </select>
  );
}

export default async function ConfiguracionPage() {
  const studio = await requireArtist();
  const hours = await prisma.workingHours.findMany({
    where: { studioId: studio.id },
    orderBy: { weekday: "asc" },
  });
  const byDay = new Map(hours.map((h) => [h.weekday, h]));

  // Orden de visualización: lunes → domingo.
  const displayOrder = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div className="max-w-3xl">
      <PageHeader title="Configuración" description="Información del estudio, contacto y horarios." />

      {/* Información del estudio */}
      <form action={saveSettingsAction} className="card space-y-4">
        <h2 className="font-display text-lg text-bone-50">Información del estudio</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Nombre artístico</label><input name="artistName" defaultValue={studio.artistName} className="input" /></div>
          <div><label className="label">Nombre del estudio</label><input name="studioName" defaultValue={studio.studioName} className="input" /></div>
        </div>
        <div><label className="label">Eslogan</label><input name="tagline" defaultValue={studio.tagline} className="input" /></div>
        <div><label className="label">Biografía</label><textarea name="bio" defaultValue={studio.bio} className="input min-h-[100px]" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Experiencia</label><input name="experience" defaultValue={studio.experience} className="input" /></div>
          <div><label className="label">Especialidades (coma)</label><input name="specialties" defaultValue={parseStringArray(studio.specialties).join(", ")} className="input" /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Ubicación</label><input name="location" defaultValue={studio.location} className="input" /></div>
          <div><label className="label">Dirección</label><input name="address" defaultValue={studio.address} className="input" /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Avatar (URL)</label><input name="avatarUrl" defaultValue={studio.avatarUrl ?? ""} className="input" /></div>
          <div><label className="label">Imagen principal / hero (URL)</label><input name="heroImageUrl" defaultValue={studio.heroImageUrl ?? ""} className="input" /></div>
        </div>

        <h3 className="pt-2 font-medium text-accent">Contacto y redes</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">WhatsApp Business (ej: 34600111222)</label><input name="whatsappNumber" defaultValue={studio.whatsappNumber} className="input" /></div>
          <div><label className="label">Email público</label><input name="emailPublic" defaultValue={studio.email_public} className="input" /></div>
          <div><label className="label">Instagram (URL)</label><input name="instagram" defaultValue={studio.instagram} className="input" /></div>
          <div><label className="label">TikTok (URL)</label><input name="tiktok" defaultValue={studio.tiktok} className="input" /></div>
          <div><label className="label">Facebook (URL)</label><input name="facebook" defaultValue={studio.facebook} className="input" /></div>
          <div><label className="label">Sitio web (URL)</label><input name="website" defaultValue={studio.website} className="input" /></div>
        </div>

        <div><label className="label">Política de reserva</label><textarea name="bookingPolicy" defaultValue={studio.bookingPolicy} className="input min-h-[80px]" /></div>
        <div className="w-40"><label className="label">Granularidad huecos (min)</label><input type="number" name="slotMinutes" defaultValue={studio.slotMinutes} min={15} step={15} className="input" /></div>

        <button className="btn-primary">Guardar configuración</button>
      </form>

      {/* Horarios */}
      <form action={saveWorkingHoursAction} className="card mt-8 space-y-3">
        <h2 className="font-display text-lg text-bone-50">Horario laboral y descansos</h2>
        <p className="text-sm text-bone-200/60">Define tu disponibilidad semanal. Los clientes sólo podrán reservar dentro de estas horas.</p>

        <div className="space-y-2">
          <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-2 text-xs text-bone-200/50 sm:grid">
            <span>Día</span><span>Apertura</span><span>Cierre</span><span>Descanso inicio</span><span>Descanso fin</span>
          </div>
          {displayOrder.map((weekday) => {
            const h = byDay.get(weekday);
            return (
              <div key={weekday} className="grid grid-cols-2 items-center gap-2 border-t border-bone-200/5 pt-2 sm:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
                <label className="flex items-center gap-2 text-sm text-bone-100">
                  <input type="checkbox" name={`active-${weekday}`} defaultChecked={h?.active ?? false} />
                  {WEEKDAYS[weekday]}
                </label>
                <TimeSelect name={`start-${weekday}`} value={h?.startMin ?? 600} />
                <TimeSelect name={`end-${weekday}`} value={h?.endMin ?? 1200} />
                <BreakSelect name={`breakStart-${weekday}`} value={h?.breakStartMin ?? null} />
                <BreakSelect name={`breakEnd-${weekday}`} value={h?.breakEndMin ?? null} />
              </div>
            );
          })}
        </div>

        <button className="btn-primary">Guardar horarios</button>
      </form>
    </div>
  );
}
