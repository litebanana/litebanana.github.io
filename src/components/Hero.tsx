import ProfilePhoto from "./ProfilePhoto";
import TechBackdrop from "./TechBackdrop";
import { ArrowRightIcon, GithubIcon, LinkedinIcon, MailIcon } from "./Icons";
import { LINKS, SITE } from "../data/links";

function scrollTo(href: string) {
  document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
}

const HERO_STATS = [
  { value: "3+", label: "Years coding" },
  { value: "5", label: "Projects built" },
  { value: "4", label: "Certifications" },
];

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden pt-32 pb-24 sm:pt-40 sm:pb-32">
      {/* Ambient backdrop */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-70 [mask-image:radial-gradient(75%_60%_at_50%_22%,black,transparent)]" />
        <div className="absolute -top-24 left-[10%] h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute top-44 -right-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <TechBackdrop />

      <div className="container-site relative">
        <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <p className="inline-flex items-center gap-2.5 rounded-full border border-ink/10 bg-white/80 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-ink-soft shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Open to internships &amp; opportunities
            </p>

            <h1 className="mt-8 font-display text-5xl font-bold leading-[1.04] tracking-tight text-ink sm:text-6xl xl:text-7xl dark:text-white">
              Hi, I&apos;m <span className="text-accent">Dominic.</span>
            </h1>

            <p className="mt-6 font-display text-2xl font-semibold text-ink-soft sm:text-3xl dark:text-slate-200">
              {SITE.role}
            </p>
            <p className="mt-3 text-sm font-semibold tracking-wide text-ink-faint sm:text-base dark:text-slate-400">
              {SITE.tagline}
            </p>

            <p className="mx-auto mt-8 max-w-xl text-base font-medium leading-relaxed text-ink-soft sm:text-lg lg:mx-0 dark:text-slate-300">
              I&apos;m a Computer Science student who enjoys building applications,
              developing websites, working with AI, and finding bugs that other
              people missed.
            </p>

            <div className="mt-11 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <button type="button" onClick={() => scrollTo("#projects")} className="btn-primary">
                EXPLORE MY WORK
                <ArrowRightIcon className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => scrollTo("#contact")} className="btn-outline">
                <MailIcon className="h-4 w-4" />
                CONTACT ME
              </button>
              <div className="flex items-center gap-2">
                <a
                  href={LINKS.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub profile"
                  className="btn-icon"
                >
                  <GithubIcon className="h-5 w-5" />
                </a>
                <a
                  href={LINKS.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn profile"
                  className="btn-icon"
                >
                  <LinkedinIcon className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Stats */}
            <dl className="mx-auto mt-16 flex max-w-md items-center justify-center gap-6 sm:gap-8 lg:mx-0 lg:justify-start">
              {HERO_STATS.map((stat, i) => (
                <div
                  key={stat.label}
                  className={`flex flex-col items-center gap-1 lg:items-start ${
                    i > 0 ? "border-l border-ink/10 pl-6 sm:pl-8 dark:border-white/10" : ""
                  }`}
                >
                  <dt className="order-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-ink-faint dark:text-slate-400">
                    {stat.label}
                  </dt>
                  <dd className="order-1 font-display text-3xl font-bold text-ink dark:text-white">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Portrait */}
          <div className="relative mx-auto w-full max-w-[20rem] lg:max-w-[16.5rem]">
            <div
              aria-hidden="true"
              className="absolute -inset-8 rounded-[3rem] bg-gradient-to-tr from-accent/25 via-transparent to-accent/10 blur-2xl"
            />
            <div className="relative rounded-[2.25rem] border border-ink/10 bg-white/80 p-3 shadow-lift backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="overflow-hidden rounded-[1.75rem]">
                <ProfilePhoto
                  className="aspect-[4/5] w-full"
                  alt="Dominic Torres — Computer Science Student"
                />
              </div>

              {/* Floating context badges */}
              <div
                className="absolute -right-3 bottom-16 hidden animate-floaty rounded-2xl border border-ink/10 bg-white/95 px-4 py-3 shadow-card backdrop-blur sm:block lg:-right-6 dark:border-white/10 dark:bg-[#16213E]/95"
                style={{ animationDelay: "1.2s" }}
              >
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-ink-faint dark:text-slate-400">
                  Studying
                </p>
                <p className="font-display text-sm font-bold text-ink dark:text-white">
                  B.S. Computer Science
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
