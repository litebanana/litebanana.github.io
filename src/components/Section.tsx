import type { ReactNode } from "react";
import Reveal from "./Reveal";

interface SectionProps {
  id: string;
  eyebrow: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/** Consistent section shell: eyebrow label, big title, optional description. */
export default function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className = "",
}: SectionProps) {
  return (
    <section id={id} className={`relative py-20 sm:py-28 ${className}`}>
      <div className="container-site">
        <Reveal className="mb-10 sm:mb-14">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-[3px] w-9 rounded-full bg-accent" aria-hidden="true" />
            <span className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-accent-deep dark:text-accent-bright">
              {eyebrow}
            </span>
          </div>
          {title && (
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-[2.6rem] sm:leading-[1.1] dark:text-white">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-3.5 max-w-2xl text-base font-medium leading-relaxed text-ink-faint sm:text-lg dark:text-slate-400">
              {description}
            </p>
          )}
        </Reveal>
        {children}
      </div>
    </section>
  );
}
