import { useEffect, useRef, useState } from "react";
import Section from "./Section";
import Reveal from "./Reveal";
import { Mascot } from "./Character";
import { CopyIcon, GithubIcon, LinkedinIcon, MailIcon } from "./Icons";
import { CheckIcon } from "./DetailIcons";
import { LINKS } from "../data/links";

export default function Contact() {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  async function copyEmail() {
    const text = LINKS.email;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for non-secure contexts / older browsers.
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Section
      id="contact"
      index={5}
      eyebrow="Contact"
      className="overflow-hidden"
    >
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-ink/10 bg-gradient-to-br from-accent-tint via-paper to-paper px-6 py-12 text-center shadow-card sm:px-12 sm:py-16 dark:border-white/10 dark:from-accent/15 dark:via-[#0E1726] dark:to-[#0E1726]">
          {/* decorative shapes */}
          <span aria-hidden="true" className="pointer-events-none absolute left-8 top-8 h-4 w-4 rounded-full bg-accent/30 animate-floaty" />
          <span aria-hidden="true" className="pointer-events-none absolute right-10 top-12 h-7 w-7 rounded-full border-[3px] border-accent/25 animate-floaty-slow" />
          <span aria-hidden="true" className="pointer-events-none absolute bottom-10 left-12 h-2.5 w-2.5 rounded-full bg-ink/15 animate-floaty dark:bg-white/20" />

          <div className="relative mx-auto flex max-w-4xl flex-col items-center">
            <Mascot
              pose="waving"
              looking="center"
              className="w-40 sm:w-48"
              ariaLabel="Say hi to Dominic"
            />

            <h2 className="mt-6 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl dark:text-white">
              LET&apos;S BUILD <span className="text-accent">SOMETHING.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-relaxed text-ink-soft sm:text-lg dark:text-slate-300">
              Have a project, opportunity, or idea? I&apos;d love to hear from you.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a href={`mailto:${LINKS.email}`} className="btn-primary !py-3.5 !px-7">
                <MailIcon className="h-5 w-5" />
                EMAIL ME
              </a>
              <a
                href={LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline !py-3.5 !px-7"
              >
                <GithubIcon className="h-5 w-5" />
                GITHUB
              </a>
              <a
                href={LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline !py-3.5 !px-7"
              >
                <LinkedinIcon className="h-5 w-5" />
                LINKEDIN
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs font-semibold text-ink-faint dark:text-slate-500">
              <span>{LINKS.location}</span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={copyEmail}
                aria-live="polite"
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white/80 px-3.5 py-1.5 font-bold text-ink-soft transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent-deep active:scale-95 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:border-accent dark:hover:text-accent-bright"
              >
                {copied ? (
                  <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <CopyIcon className="h-3.5 w-3.5" />
                )}
                {copied ? "Email copied!" : LINKS.email}
              </button>
              <span aria-hidden="true">·</span>
              <span>{LINKS.phone}</span>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
