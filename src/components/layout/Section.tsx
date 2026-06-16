import type { ReactNode } from "react";

interface SectionProps {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}

/** A titled dashboard section with a consistent header treatment. */
export function Section({ id, eyebrow, title, description, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-500 dark:text-brand-400">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
        {description ? <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
