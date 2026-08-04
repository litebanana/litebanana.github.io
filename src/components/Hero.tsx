import FloatingShape from "./FloatingShape";
import { Mascot } from "./Character";
import { ArrowRightIcon, GithubIcon, LinkedinIcon, MailIcon } from "./Icons";
import { LINKS, SITE } from "../data/links";

function scrollTo(href: string) {
  document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
}

const HERO_STATS = [
  { value: "3+", label: "Years coding" },
  { value: "5", label: "Projects built" },
  { value: "QA", label: "Intern @ VetAssist" },
];

export default function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24"
    >
      {/* Gradient backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_15%_0%,rgba(14,165,233,0.12),transparent_70%),radial-gradient(50%_45%_at_90%_10%,rgba(56,189,248,0.10),transparent_70%)]"
      />
      {/* Decorative shapes */}
      <FloatingShape variant="ring" className="left-[6%] top-28 animate-floaty-slow" />
      <FloatingShape variant="plus" className="right-[10%] top-24 animate-floaty" />
      <FloatingShape variant="dot" className="left-[14%] top-64 animate-floaty" />
      <FloatingShape variant="spark" className="right-[22%] top-56 animate-floaty-slow" />
      <FloatingShape variant="square" className="bottom-10 left-[8%] animate-spin-slow opacity-70" />
      <FloatingShape variant="circle" className="bottom-24 right-[6%] animate-floaty" />

      <div className="container-site relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-6">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-ink/10 bg-white px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-ink-soft dark:border-white/15 dark:bg-white/10 dark:text-slate-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              Open to internships & opportunities
            </p>

            <h1 className="font-display text-5xl font-black leading-[1.05] tracking-tight text-ink sm:text-6xl xl:text-7xl dark:text-white">
              Hi, I&apos;m <span className="text-accent">Dominic.</span>
            </h1>

            <p className="mt-4 font-display text-xl font-extrabold text-ink-soft sm:text-2xl dark:text-slate-300">
              Computer Science Student
            </p>
            <p className="mt-1 text-base font-bold text-ink-faint sm:text-lg dark:text-slate-400">
              {SITE.tagline}
            </p>

            <p className="mx-auto mt-6 max-w-xl text-base font-semibold leading-relaxed text-ink-soft sm:text-lg lg:mx-0 dark:text-slate-300">
              I&apos;m a Computer Science student who enjoys building applications,
              developing websites, working with AI, and finding bugs that other
              people missed.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
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
                  className="grid h-11 w-11 place-items-center rounded-2xl border-2 border-ink/15 bg-white text-ink-soft transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent-deep active:scale-95 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:text-accent-bright"
                >
                  <GithubIcon className="h-5 w-5" />
                </a>
                <a
                  href={LINKS.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn profile"
                  className="grid h-11 w-11 place-items-center rounded-2xl border-2 border-ink/15 bg-white text-ink-soft transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent-deep active:scale-95 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:text-accent-bright"
                >
                  <LinkedinIcon className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Stat chips */}
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-3 sm:gap-4 lg:max-w-lg">
              {HERO_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col rounded-2xl border-2 border-ink/10 bg-white/80 px-3 py-3 text-center shadow-soft transition-transform duration-300 hover:-translate-y-1 dark:border-white/15 dark:bg-white/5"
                >
                  <dt className="order-2 mt-1 text-[10px] font-extrabold uppercase tracking-wider text-ink-faint dark:text-slate-400 sm:text-[11px]">
                    {stat.label}
                  </dt>
                  <dd className="order-1 font-display text-xl font-black text-accent-deep dark:text-accent-bright sm:text-2xl">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Character */}
          <div className="relative mx-auto w-full max-w-[300px] sm:max-w-[360px] lg:max-w-[400px]">
            <Mascot
              pose="standing"
              looking="right"
              className="w-full animate-floaty-slow"
              ariaLabel="Say hi to Dominic"
            />
            {/* speech-bubble-style label */}
            <div className="pointer-events-none absolute -top-3 left-0 hidden rotate-[-4deg] rounded-2xl border-2 border-ink/10 bg-white px-3 py-1.5 text-xs font-extrabold text-ink shadow-soft sm:block dark:border-white/15 dark:bg-white/10 dark:text-white">
              Welcome! 👋
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
