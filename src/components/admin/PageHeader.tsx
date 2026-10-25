export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl text-bone-50 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-bone-200/60">{description}</p>}
      </div>
      {action}
    </div>
  );
}
