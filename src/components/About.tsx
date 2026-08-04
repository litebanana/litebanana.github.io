import Section from "./Section";
import Reveal from "./Reveal";
import { Mascot } from "./Character";
import { DownloadIcon, ExternalIcon, PencilIcon } from "./Icons";
import { LINKS } from "../data/links";

export default function About() {
  return (
    <Section id="about" eyebrow="About Me" title="ABOUT ME" className="bg-white">
      <Reveal>
        <div className="mx-auto max-w-4xl overflow-hidden rounded-4xl border-2 border-ink/10 bg-paper shadow-card">
          <div className="grid md:grid-cols-[auto_1fr]">
            {/* Portrait area with larger character */}
            <div className="relative flex items-end justify-center bg-gradient-to-b from-accent-tint to-paper px-8 pb-2 pt-8">
              <FloatingShapes />
              <Mascot
                pose="standing"
                looking="center"
                className="w-44 sm:w-52"
                ariaLabel="Click to hear from Dominic"
              />
            </div>

            {/* Profile copy */}
            <div className="p-7 sm:p-10">
              <h3 className="font-display text-3xl font-black tracking-tight text-ink sm:text-4xl">
                Dominic Torres
              </h3>
              <p className="mt-1 text-sm font-extrabold uppercase tracking-[0.18em] text-accent-deep">
                Computer Science Student
              </p>

              <p className="mt-5 text-sm font-semibold leading-relaxed text-ink-soft sm:text-base">
                I&apos;m a Computer Science student focused on software and web
                development, QA testing, and AI / machine learning. I enjoy
                building practical applications — turning ideas into working
                software, and making sure it actually works before it ships.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {["Software Development", "Web Development", "QA Testing", "AI / ML"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border-2 border-ink/10 bg-white px-3 py-1 text-xs font-extrabold text-ink-soft"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href={LINKS.resumeView}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  aria-label="View resume (placeholder link)"
                >
                  <ExternalIcon className="h-4 w-4" />
                  VIEW RESUME
                </a>
                <a
                  href={LINKS.resumeDownload}
                  download
                  className="btn-outline"
                  aria-label="Download resume (placeholder link)"
                >
                  <DownloadIcon className="h-4 w-4" />
                  DOWNLOAD RESUME
                </a>
              </div>

              <p className="mt-4 flex items-start gap-1.5 text-xs font-bold text-ink-faint">
                <PencilIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Resume not attached yet — add the link in src/data/links.ts and drop
                your resume in /public if you want a direct file.
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

function FloatingShapes() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      <span className="absolute left-6 top-6 h-3 w-3 rounded-full bg-accent/40 animate-floaty" />
      <span className="absolute right-10 top-10 h-5 w-5 rounded-full border-[3px] border-accent/30 animate-floaty-slow" />
      <span className="absolute bottom-16 left-10 h-2.5 w-2.5 rounded-full bg-ink/15 animate-floaty" />
    </span>
  );
}
