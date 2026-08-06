import { useState } from "react";
import Section from "./Section";
import Reveal from "./Reveal";
import { EXPERIENCE } from "../data/experience";
import { CheckIcon, ChevronDownIcon } from "./DetailIcons";

export default function Experience() {
  // Only one entry can be expanded at a time; null means all collapsed.
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <Section
      id="experience"
      eyebrow="Experience"
      title="Where I've been learning"
      description="My professional experience so far — hands-on QA on a real product, plus hands-on IoT training."
      className="bg-white dark:bg-[#0E1726]"
    >
      <div className="relative mx-auto max-w-3xl">
        <div className="relative">
          {/* vertical rail */}
          <span
            className="absolute left-2 top-2 bottom-2 w-1 rounded-full bg-accent/20 sm:left-3"
            aria-hidden="true"
          />

          <div className="flex flex-col gap-8 pl-8 sm:pl-10">
            {EXPERIENCE.map((exp, ei) => {
              const expanded = expandedId === exp.id;
              return (
                <div key={exp.id} className="relative">
                  {/* timeline node — negative offsets pull it back over the rail */}
                  <span
                    className="absolute -left-8 top-2 grid h-6 w-6 place-items-center rounded-full border-[3px] border-accent bg-white shadow-pop sm:-left-10"
                    aria-hidden="true"
                  >
                    <span className="h-2 w-2 rounded-full bg-accent" />
                  </span>

                  <Reveal delay={ei * 80}>
                    <article className="rounded-3xl border border-ink/10 bg-paper p-6 shadow-card transition-shadow duration-300 hover:shadow-lift sm:p-8 dark:border-white/10 dark:bg-[#131D30]">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <h3 className="font-display text-2xl font-bold tracking-tight text-ink dark:text-white">
                          {exp.role}
                        </h3>
                        <span className="text-ink-faint dark:text-slate-500">·</span>
                        <span className="text-sm font-bold text-ink-soft dark:text-slate-300">
                          {exp.company}
                        </span>
                        <span className="ml-auto rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-extrabold text-ink-faint dark:border-white/15 dark:bg-white/5 dark:text-slate-400">
                          {exp.period}
                        </span>
                      </div>

                      <p className="mt-3.5 text-sm font-medium leading-relaxed text-ink-soft sm:text-base dark:text-slate-300">
                        {exp.summary}
                      </p>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setExpandedId(expanded ? null : exp.id)}
                          aria-expanded={expanded}
                          aria-controls={`experience-details-${exp.id}`}
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
                        id={`experience-details-${exp.id}`}
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
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}
