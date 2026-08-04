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
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border-2 border-ink/10 bg-white px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.18em] text-accent-deep dark:border-white/15 dark:bg-white/10">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            {eyebrow}
          </div>
          {title && (
            <div>
              <h2 className="font-display text-3xl font-black tracking-tight text-ink sm:text-5xl dark:text-white">
                {title}
              </h2>
              <span
                className="mt-3 block h-1.5 w-16 rounded-full bg-gradient-to-r from-accent to-accent-bright"
                aria-hidden="true"
              />
            </div>
          )}
          {description && (
            <p className="mt-4 max-w-2xl text-base font-semibold text-ink-faint sm:text-lg dark:text-slate-400">
              {description}
            </p>
          )}
        </Reveal>
        {children}
      </div>
    </section>
  );
}
