import { GithubIcon, LinkedinIcon, MailIcon } from "./Icons";
import { LINKS, SITE } from "../data/links";

export default function Footer() {
  return (
    <footer className="border-t-2 border-ink/10 bg-white">
      <div className="container-site flex flex-col items-center gap-6 py-10 text-center">
        <a
          href="#home"
          className="font-display text-base font-black tracking-wide text-ink"
        >
          DOMINIC TORRES
        </a>
        <p className="-mt-3 text-sm font-bold text-ink-faint">
          {SITE.role}
          <span className="mx-2 text-accent">•</span>
          {SITE.tagline}
        </p>

        <nav aria-label="Footer links" className="flex items-center gap-4">
          <a
            href={LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub (placeholder link)"
            className="grid h-11 w-11 place-items-center rounded-xl border-2 border-ink/10 bg-paper text-ink-soft transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent-deep"
          >
            <GithubIcon />
          </a>
          <a
            href={LINKS.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn (placeholder link)"
            className="grid h-11 w-11 place-items-center rounded-xl border-2 border-ink/10 bg-paper text-ink-soft transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent-deep"
          >
            <LinkedinIcon />
          </a>
          <a
            href={`mailto:${LINKS.email}`}
            aria-label={`Email ${LINKS.email}`}
            className="grid h-11 w-11 place-items-center rounded-xl border-2 border-ink/10 bg-paper text-ink-soft transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent-deep"
          >
            <MailIcon />
          </a>
        </nav>

        <p className="text-xs font-bold text-ink-faint">
          © 2026 Dominic Torres · Built with React, TypeScript &amp; Tailwind CSS
        </p>
      </div>
    </footer>
  );
}
