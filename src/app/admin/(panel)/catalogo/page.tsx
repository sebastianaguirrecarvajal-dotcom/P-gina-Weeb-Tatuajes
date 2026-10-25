import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireArtist } from "@/lib/admin";
import { parseStringArray } from "@/lib/json";
import { PageHeader } from "@/components/admin/PageHeader";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { saveWorkAction, deleteWorkAction } from "../admin-actions";

export const metadata: Metadata = { title: "Catálogo", robots: { index: false } };

function WorkForm({
  categories,
  work,
}: {
  categories: { id: string; name: string }[];
  work?: any;
}) {
  return (
    <form action={saveWorkAction} className="grid gap-3 sm:grid-cols-2">
      {work && <input type="hidden" name="id" value={work.id} />}
      <div className="sm:col-span-2"><label className="label">Título *</label><input name="title" required defaultValue={work?.title} className="input" /></div>
      <div className="sm:col-span-2"><ImageUploader name="imageUrl" defaultValue={work?.imageUrl} label="Imagen *" /></div>
      <div className="sm:col-span-2"><label className="label">Descripción</label><textarea name="description" defaultValue={work?.description} className="input min-h-[70px]" /></div>
      <div>
        <label className="label">Categoría *</label>
        <select name="categoryId" defaultValue={work?.categoryId} className="input">
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div><label className="label">Zona del cuerpo</label><input name="bodyZone" defaultValue={work?.bodyZone ?? ""} className="input" /></div>
      <div><label className="label">Etiquetas (coma)</label><input name="tags" defaultValue={work ? parseStringArray(work.tags).join(", ") : ""} className="input" /></div>
      <div><label className="label">Orden</label><input type="number" name="order" defaultValue={work?.order ?? 0} className="input" /></div>
      <div className="flex items-center gap-6 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm text-bone-200"><input type="checkbox" name="published" defaultChecked={work ? work.published : true} /> Publicado</label>
        <label className="flex items-center gap-2 text-sm text-bone-200"><input type="checkbox" name="featured" defaultChecked={work?.featured ?? false} /> Destacado</label>
      </div>
      <div className="sm:col-span-2"><button className="btn-primary">{work ? "Guardar cambios" : "Añadir trabajo"}</button></div>
    </form>
  );
}

export default async function AdminCatalogoPage() {
  await requireArtist();
  const [categories, works] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.work.findMany({ include: { category: true }, orderBy: [{ order: "asc" }, { createdAt: "desc" }] }),
  ]);

  return (
    <div>
      <PageHeader title="Catálogo" description="Gestiona los trabajos de tu portafolio." />

      <details className="card mb-8">
        <summary className="cursor-pointer font-medium text-accent">+ Añadir nuevo trabajo</summary>
        <div className="mt-4"><WorkForm categories={categories} /></div>
      </details>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {works.map((w) => (
          <div key={w.id} className="overflow-hidden rounded-xl2 border border-bone-200/10 bg-ink-900">
            <div className="relative aspect-[4/3]">
              <Image src={w.imageUrl} alt={w.title} fill className="object-cover" sizes="33vw" />
              {!w.published && <span className="badge absolute left-2 top-2 border-0 bg-ink-950/80 text-bone-200">Oculto</span>}
              {w.featured && <span className="badge absolute right-2 top-2 border-accent/40 bg-accent/20 text-accent">Destacado</span>}
            </div>
            <div className="p-4">
              <p className="text-xs text-accent">{w.category.name}</p>
              <h3 className="font-medium text-bone-50">{w.title}</h3>
              <div className="mt-3 flex gap-2">
                <details className="flex-1">
                  <summary className="cursor-pointer text-sm text-bone-200 hover:text-accent">Editar</summary>
                  <div className="mt-3"><WorkForm categories={categories} work={w} /></div>
                </details>
                <form action={deleteWorkAction}>
                  <input type="hidden" name="id" value={w.id} />
                  <button className="text-sm text-rose-300 hover:underline">Eliminar</button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
