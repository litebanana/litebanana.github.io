import { useState } from "react";
import Section from "./Section";
import Reveal from "./Reveal";
import { Mascot } from "./Character";
import { EXPERIENCE } from "../data/experience";
import { CheckIcon, ChevronDownIcon } from "./DetailIcons";

export default function Experience() {
  const [expanded, setExpanded] = useState(false);
  const exp = EXPERIENCE;

  return (
    <Section
      id="experience"
      eyebrow="Experience"
      title="Where I've been learning"
      description="My professional experience so far — hands-on QA work on a real product."
      className="bg-white dark:bg-[#0E1726]"
    >
      <div className="grid items-start gap-10 lg:grid-cols-[auto_1fr_auto] lg:gap-8">
        {/* Mascot beside the card */}
        <div className="mx-auto w-32 sm:w-36 lg:mx-0">
          <Mascot pose="standing" looking="right" className="w-full" ariaLabel="Click to hear from Dominic" />
        </div>

        {/* Timeline */}
        <div className="relative min-w-0">
          <div className="relative pl-8 sm:pl-10">
            {/* vertical rail */}
            <span
              className="absolute left-2 top-2 h-[calc(100%-1rem)] w-1 rounded-full bg-accent/20 sm:left-3"
              aria-hidden="true"
            />
            <span
              className="absolute left-0 top-2 grid h-6 w-6 place-items-center rounded-full border-[3px] border-accent bg-white shadow-pop sm:left-1"
              aria-hidden="true"
            >
              <span className="h-2 w-2 rounded-full bg-accent" />
            </span>

            <Reveal>
              <article className="rounded-4xl border-2 border-ink/10 bg-paper p-6 shadow-card transition-shadow duration-300 hover:shadow-lift sm:p-8 dark:border-white/10 dark:bg-[#131D30]">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-accent px-4 py-1.5 text-sm font-black uppercase tracking-wider text-white shadow-pop">
                    {exp.role}
                  </span>
                  <span className="rounded-full border-2 border-ink/10 bg-white px-4 py-1.5 text-sm font-extrabold text-ink-soft dark:border-white/15 dark:bg-white/5 dark:text-slate-300">
                    {exp.company}
                  </span>
                  <span className="rounded-full border-2 border-ink/10 bg-white px-4 py-1.5 text-sm font-extrabold text-ink-faint dark:border-white/15 dark:bg-white/5 dark:text-slate-400">
                    {exp.period}
                  </span>
                </div>

                <p className="mt-4 text-sm font-semibold leading-relaxed text-ink-soft sm:text-base dark:text-slate-300">
                  {exp.summary}
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    aria-expanded={expanded}
                    aria-controls="experience-details"
                    className="btn-outline !px-5 !py-2.5"
                  >
                    {expanded ? "HIDE DETAILS" : "VIEW EXPERIENCE"}
                    <ChevronDownIcon
                      className={`h-4 w-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                    />
                  </button>
                  <span className="text-xs font-bold text-ink-faint dark:text-slate-500">
                    {exp.responsibilities.length} focus areas
                  </span>
                </div>

                {/* Expandable responsibilities */}
                <div
                  id="experience-details"
                  className="grid transition-all duration-500 ease-in-out"
                  style={{
                    gridTemplateRows: expanded ? "1fr" : "0fr",
                  }}
                >
                  <div className="overflow-hidden">
                    <ul className="mt-5 grid gap-2.5 border-t-2 border-dashed border-ink/10 pt-5 sm:grid-cols-2 dark:border-white/10">
                      {exp.responsibilities.map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-2.5 rounded-xl border-2 border-ink/5 bg-white px-3.5 py-2.5 text-sm font-bold text-ink-soft dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                        >
                          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-tint text-accent-deep">
                            <CheckIcon className="h-3 w-3" />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            </Reveal>
          </div>
        </div>

        <div className="hidden lg:block lg:w-4" aria-hidden="true" />
      </div>
    </Section>
  );
}
