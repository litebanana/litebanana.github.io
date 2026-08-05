import { GithubIcon, LinkedinIcon, MailIcon } from "./Icons";
import { LINKS, SITE } from "../data/links";

export default function Footer() {
  return (
    <footer className="relative border-t border-ink/10 bg-white dark:border-white/10 dark:bg-[#0E1726]">
      <div className="container-site flex flex-col items-center gap-6 py-10 text-center">
        <a
          href="#home"
          className="font-display text-base font-bold tracking-[0.16em] text-ink dark:text-white"
        >
          DOMINIC TORRES
        </a>
        <p className="-mt-3 text-sm font-semibold text-ink-faint dark:text-slate-400">
          {SITE.role}
          <span className="mx-2 text-accent">•</span>
          {SITE.tagline}
        </p>

        <nav aria-label="Footer links" className="flex items-center gap-4">
          <a
            href={LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub profile"
            className="grid h-11 w-11 place-items-center rounded-xl border-2 border-ink/10 bg-paper text-ink-soft transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent-deep dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:text-accent-bright"
          >
            <GithubIcon />
          </a>
          <a
            href={LINKS.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn profile"
            className="grid h-11 w-11 place-items-center rounded-xl border-2 border-ink/10 bg-paper text-ink-soft transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent-deep dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:text-accent-bright"
          >
            <LinkedinIcon />
          </a>
          <a
            href={`mailto:${LINKS.email}`}
            aria-label={`Email ${LINKS.email}`}
            className="grid h-11 w-11 place-items-center rounded-xl border-2 border-ink/10 bg-paper text-ink-soft transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent-deep dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:text-accent-bright"
          >
            <MailIcon />
          </a>
        </nav>

        <p className="text-xs font-semibold text-ink-faint dark:text-slate-500">
          © 2026 Dominic Torres · Built with React, TypeScript &amp; Tailwind CSS
        </p>
      </div>
    </footer>
  );
}
