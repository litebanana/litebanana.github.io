import Section from "./Section";
import Reveal from "./Reveal";
import ProfilePhoto from "./ProfilePhoto";
import { DownloadIcon, ExternalIcon } from "./Icons";
import { LINKS } from "../data/links";
import { CERTIFICATIONS, EDUCATION, SOFT_SKILLS } from "../data/about";

export default function About() {
  return (
    <Section id="about" index={4} eyebrow="About Me" title="About Me" className="bg-white dark:bg-[#0E1726]">
      <Reveal>
        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-ink/10 bg-paper shadow-card dark:border-white/10 dark:bg-[#0E1726]">
          <div className="grid md:grid-cols-[0.85fr_1.15fr]">
            {/* Portrait */}
            <div className="relative overflow-hidden bg-gradient-to-b from-accent-tint to-paper dark:from-accent/15 dark:to-[#0E1726]">
              <FloatingShapes />
              <ProfilePhoto
                className="aspect-[4/5] h-full min-h-[300px] w-full md:aspect-auto"
                alt="Dominic Torres — Computer Science Student"
              />
            </div>

            {/* Profile copy */}
            <div className="p-7 sm:p-10">
              <h3 className="font-display text-3xl font-bold tracking-tight text-ink dark:text-white sm:text-4xl">
                Dominic Torres
              </h3>
              <p className="mt-1.5 text-xs font-extrabold uppercase tracking-[0.2em] text-accent-deep dark:text-accent-bright">
                Computer Science Student
              </p>
              <p className="mt-1 text-sm font-semibold text-ink-faint dark:text-slate-400">
                {LINKS.location}
              </p>

              <p className="mt-5 text-sm font-medium leading-relaxed text-ink-soft dark:text-slate-300 sm:text-base">
                I&apos;m a Computer Science student focused on software and web
                development, QA testing, and AI / machine learning. I enjoy
                building practical applications — turning ideas into working
                software, and making sure it actually works before it ships.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {["Software Development", "Web Development", "QA Testing", "AI / ML"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-extrabold text-ink-soft dark:border-white/15 dark:bg-white/5 dark:text-slate-300"
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
                  aria-label="View resume"
                >
                  <ExternalIcon className="h-4 w-4" />
                  VIEW RESUME
                </a>
                <a href={LINKS.resumeDownload} download className="btn-outline" aria-label="Download resume">
                  <DownloadIcon className="h-4 w-4" />
                  DOWNLOAD RESUME
                </a>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Education, certifications & soft skills */}
      <div className="mx-auto mt-6 grid max-w-4xl gap-6 lg:grid-cols-2">
        {/* Education */}
        <Reveal>
          <div className="h-full rounded-3xl border border-ink/10 bg-white p-7 shadow-soft dark:border-white/10 dark:bg-[#131D30] sm:p-8">
            <h3 className="font-display text-lg font-bold tracking-wide text-ink dark:text-white">
              Education
            </h3>
            <div className="mt-5 flex flex-col gap-5">
              {EDUCATION.map((edu) => (
                <div key={edu.school} className="relative pl-6">
                  <span
                    className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-[3px] border-accent bg-white dark:bg-[#131D30]"
                    aria-hidden="true"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-display text-base font-bold text-ink dark:text-white">
                      {edu.school}
                    </h4>
                    {edu.current && (
                      <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-accent-deep dark:bg-accent/20 dark:text-accent-bright">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-ink-soft dark:text-slate-300">{edu.program}</p>
                  <p className="text-xs font-semibold text-ink-faint dark:text-slate-400">{edu.period}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Certifications & soft skills */}
        <Reveal delay={80}>
          <div className="flex h-full flex-col gap-6">
            <div className="rounded-3xl border border-ink/10 bg-white p-7 shadow-soft dark:border-white/10 dark:bg-[#131D30] sm:p-8">
              <h3 className="font-display text-lg font-bold tracking-wide text-ink dark:text-white">
                Certifications
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {CERTIFICATIONS.map((cert) => (
                  <li
                    key={cert.name}
                    className="flex items-start justify-between gap-3 rounded-xl border border-ink/5 bg-paper px-3.5 py-2.5 dark:border-white/10 dark:bg-white/5"
                  >
                    <span className="text-sm font-semibold text-ink-soft dark:text-slate-200">
                      {cert.name}
                      <span className="block text-xs font-medium text-ink-faint dark:text-slate-400">
                        {cert.issuer}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-accent-tint px-2.5 py-1 text-[11px] font-extrabold text-accent-deep dark:bg-accent/20 dark:text-accent-bright">
                      {cert.year}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-ink/10 bg-white p-7 shadow-soft dark:border-white/10 dark:bg-[#131D30] sm:p-8">
              <h3 className="font-display text-lg font-bold tracking-wide text-ink dark:text-white">
                Soft Skills
              </h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {SOFT_SKILLS.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-full border border-ink/10 bg-paper px-3.5 py-1.5 text-sm font-extrabold text-ink-soft dark:border-white/15 dark:bg-white/5 dark:text-slate-200"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

function FloatingShapes() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      <span className="absolute left-6 top-6 h-3 w-3 rounded-full bg-accent/40 animate-floaty" />
      <span className="absolute right-10 top-10 h-5 w-5 rounded-full border-[3px] border-accent/30 animate-floaty-slow" />
      <span className="absolute bottom-16 left-10 h-2.5 w-2.5 rounded-full bg-ink/15 animate-floaty dark:bg-white/20" />
    </span>
  );
}
