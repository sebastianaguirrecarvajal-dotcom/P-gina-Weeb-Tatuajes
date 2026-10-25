import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireArtist } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { TESTIMONIAL_STATUS_LABEL } from "@/lib/constants";
import { PageHeader } from "@/components/admin/PageHeader";
import { Rating } from "@/components/ui";
import { setTestimonialStatusAction, deleteTestimonialAction } from "../admin-actions";

export const metadata: Metadata = { title: "Testimonios", robots: { index: false } };

export default async function AdminTestimoniosPage() {
  await requireArtist();
  const testimonials = await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader title="Testimonios" description="Modera las opiniones de tus clientes. Sólo los aprobados se muestran en la web." />

      {testimonials.length === 0 ? (
        <p className="text-bone-200/60">Aún no hay testimonios.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {testimonials.map((t) => (
            <div key={t.id} className="card">
              <div className="flex items-center justify-between">
                <Rating value={t.rating} />
                <span className="badge border-bone-200/20 bg-ink-800 text-bone-200">{TESTIMONIAL_STATUS_LABEL[t.status]}</span>
              </div>
              <blockquote className="mt-3 text-bone-100">“{t.content}”</blockquote>
              <p className="mt-2 text-sm text-bone-200/50">— {t.authorName} · {formatDate(t.createdAt)}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {t.status !== "APPROVED" && (
                  <form action={setTestimonialStatusAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="status" value="APPROVED" />
                    <button className="btn-outline px-3 py-1.5 text-xs">Aprobar</button>
                  </form>
                )}
                {t.status !== "HIDDEN" && (
                  <form action={setTestimonialStatusAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="status" value="HIDDEN" />
                    <button className="btn-ghost px-3 py-1.5 text-xs">Ocultar</button>
                  </form>
                )}
                <form action={deleteTestimonialAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <button className="px-3 py-1.5 text-xs text-rose-300 hover:underline">Eliminar</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
