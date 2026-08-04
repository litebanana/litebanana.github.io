import FloatingShape from "./FloatingShape";
import { Mascot } from "./Character";
import { ArrowRightIcon, MailIcon } from "./Icons";
import { SITE } from "../data/links";

function scrollTo(href: string) {
  document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
}

export default function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24"
    >
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
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-ink/10 bg-white px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-ink-soft">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              Available for opportunities
            </p>

            <h1 className="font-display text-5xl font-black leading-[1.05] tracking-tight text-ink sm:text-6xl xl:text-7xl">
              Hi, I&apos;m <span className="text-accent">Dominic.</span>
            </h1>

            <p className="mt-4 font-display text-xl font-extrabold text-ink-soft sm:text-2xl">
              Computer Science Student
            </p>
            <p className="mt-1 text-base font-bold text-ink-faint sm:text-lg">
              {SITE.tagline}
            </p>

            <p className="mx-auto mt-6 max-w-xl text-base font-semibold leading-relaxed text-ink-soft sm:text-lg lg:mx-0">
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
            </div>
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
            <div className="pointer-events-none absolute -top-3 left-0 hidden rotate-[-4deg] rounded-2xl border-2 border-ink/10 bg-white px-3 py-1.5 text-xs font-extrabold text-ink shadow-soft sm:block">
              Welcome! 👋
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
