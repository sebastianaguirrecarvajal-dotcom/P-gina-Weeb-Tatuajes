import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getStudioOrThrow } from "@/lib/studio";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SectionHeading, EmptyState } from "@/components/ui";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Resuelve tus dudas sobre precios, cuidados, sesiones y reservas.",
};

export default async function FaqPage() {
  const faqs = await prisma.faq.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });
  const studio = await getStudioOrThrow();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <div className="container-page max-w-3xl py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <SectionHeading eyebrow="Ayuda" title="Preguntas frecuentes" subtitle="Lo que más me preguntan antes de tatuarse." />

      {faqs.length === 0 ? (
        <div className="mt-10"><EmptyState title="Aún no hay preguntas publicadas" /></div>
      ) : (
        <div className="mt-10 space-y-3">
          {faqs.map((f) => (
            <details key={f.id} className="group rounded-xl2 border border-bone-200/10 bg-ink-900 p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium text-bone-50">
                {f.question}
                <span className="shrink-0 text-accent transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 whitespace-pre-line text-bone-200/80">{f.answer}</p>
            </details>
          ))}
        </div>
      )}

      <div className="mt-12 rounded-xl2 border border-accent/20 bg-ink-900 p-8 text-center">
        <p className="text-lg text-bone-50">¿No encuentras la respuesta?</p>
        <p className="mt-1 text-sm text-bone-200/60">Escríbeme y te ayudo personalmente.</p>
        <div className="mt-5 flex justify-center">
          <WhatsAppButton number={studio.whatsappNumber} context="faq" label="Escríbeme por WhatsApp" />
        </div>
      </div>
    </div>
  );
}
