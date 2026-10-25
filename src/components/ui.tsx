import { StarIcon } from "./icons";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="mt-3 text-bone-200/70">{subtitle}</p>}
    </div>
  );
}

export function Rating({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`flex gap-0.5 ${className}`} aria-label={`${value} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className={`h-4 w-4 ${i < value ? "text-accent" : "text-ink-600"}`}
        />
      ))}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl2 border border-dashed border-bone-200/15 p-10 text-center">
      <p className="text-bone-100">{title}</p>
      {hint && <p className="mt-1 text-sm text-bone-200/60">{hint}</p>}
    </div>
  );
}
