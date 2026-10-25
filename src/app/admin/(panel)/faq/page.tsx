import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireArtist } from "@/lib/admin";
import { PageHeader } from "@/components/admin/PageHeader";
import { saveFaqAction, deleteFaqAction } from "../admin-actions";

export const metadata: Metadata = { title: "Preguntas", robots: { index: false } };

function FaqForm({ faq }: { faq?: any }) {
  return (
    <form action={saveFaqAction} className="grid gap-3">
      {faq && <input type="hidden" name="id" value={faq.id} />}
      <div><label className="label">Pregunta *</label><input name="question" required defaultValue={faq?.question} className="input" /></div>
      <div><label className="label">Respuesta *</label><textarea name="answer" required defaultValue={faq?.answer} className="input min-h-[90px]" /></div>
      <div className="flex items-center gap-6">
        <div className="w-28"><label className="label">Orden</label><input type="number" name="order" defaultValue={faq?.order ?? 0} className="input" /></div>
        <label className="mt-6 flex items-center gap-2 text-sm text-bone-200"><input type="checkbox" name="published" defaultChecked={faq ? faq.published : true} /> Publicada</label>
      </div>
      <div><button className="btn-primary">{faq ? "Guardar" : "Añadir pregunta"}</button></div>
    </form>
  );
}

export default async function AdminFaqPage() {
  await requireArtist();
  const faqs = await prisma.faq.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <PageHeader title="Preguntas frecuentes" description="Administra las dudas más comunes de tus clientes." />

      <details className="card mb-8">
        <summary className="cursor-pointer font-medium text-accent">+ Nueva pregunta</summary>
        <div className="mt-4"><FaqForm /></div>
      </details>

      <div className="space-y-3">
        {faqs.map((f) => (
          <div key={f.id} className="card">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-medium text-bone-50">{f.question}</h3>
              <div className="flex items-center gap-3">
                {!f.published && <span className="badge border-bone-200/20 bg-ink-800 text-bone-200">Oculta</span>}
                <form action={deleteFaqAction}>
                  <input type="hidden" name="id" value={f.id} />
                  <button className="text-sm text-rose-300 hover:underline">Eliminar</button>
                </form>
              </div>
            </div>
            <p className="mt-1 text-sm text-bone-200/70">{f.answer}</p>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-accent">Editar</summary>
              <div className="mt-4"><FaqForm faq={f} /></div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
