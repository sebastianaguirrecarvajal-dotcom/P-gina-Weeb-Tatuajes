import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireArtist } from "@/lib/admin";
import { parseStringArray } from "@/lib/json";
import { POST_STATUS_LABEL } from "@/lib/constants";
import { PageHeader } from "@/components/admin/PageHeader";
import { savePostAction, deletePostAction } from "../admin-actions";

export const metadata: Metadata = { title: "Publicaciones", robots: { index: false } };

function PostForm({ works, post }: { works: { id: string; title: string }[]; post?: any }) {
  return (
    <form action={savePostAction} className="grid gap-3">
      {post && <input type="hidden" name="id" value={post.id} />}
      <div><label className="label">Título *</label><input name="title" required defaultValue={post?.title} className="input" /></div>
      <div><label className="label">Resumen</label><input name="excerpt" defaultValue={post?.excerpt} className="input" /></div>
      <div><label className="label">Contenido</label><textarea name="content" defaultValue={post?.content} className="input min-h-[160px]" /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Imagen de portada (URL)</label><input name="coverUrl" defaultValue={post?.coverUrl ?? ""} className="input" /></div>
        <div><label className="label">Etiquetas (coma)</label><input name="tags" defaultValue={post ? parseStringArray(post.tags).join(", ") : ""} className="input" /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Estado</label>
          <select name="status" defaultValue={post?.status ?? "DRAFT"} className="input">
            <option value="DRAFT">Borrador</option>
            <option value="PUBLISHED">Publicado</option>
            <option value="HIDDEN">Oculto</option>
          </select>
        </div>
        <div>
          <label className="label">Trabajo relacionado</label>
          <select name="workId" defaultValue={post?.workId ?? ""} className="input">
            <option value="">— Ninguno —</option>
            {works.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}
          </select>
        </div>
      </div>
      <div><button className="btn-primary">{post ? "Guardar cambios" : "Crear publicación"}</button></div>
    </form>
  );
}

export default async function AdminBlogPage() {
  await requireArtist();
  const [posts, works] = await Promise.all([
    prisma.post.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.work.findMany({ select: { id: true, title: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Publicaciones" description="Blog, novedades, consejos y procesos." />

      <details className="card mb-8">
        <summary className="cursor-pointer font-medium text-accent">+ Nueva publicación</summary>
        <div className="mt-4"><PostForm works={works} /></div>
      </details>

      <div className="space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-medium text-bone-50">{p.title}</h3>
                <p className="text-xs text-bone-200/50">/{p.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge border-bone-200/20 bg-ink-800 text-bone-200">{POST_STATUS_LABEL[p.status]}</span>
                <form action={deletePostAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="text-sm text-rose-300 hover:underline">Eliminar</button>
                </form>
              </div>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-accent">Editar</summary>
              <div className="mt-4"><PostForm works={works} post={p} /></div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
