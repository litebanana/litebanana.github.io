import Section from "./Section";
import Reveal from "./Reveal";
import { SKILL_CATEGORIES } from "../data/skills";
import SkillCard from "./SkillCard";

export default function Skills() {
  return (
    <Section
      id="skills"
      eyebrow="Technical Experience"
      title="What I work with"
      description="Years of hands-on experience with the tools I use — not percentages, just the time I've actually spent building."
    >
      <div className="flex flex-col gap-10">
          {SKILL_CATEGORIES.map((category, ci) => (
            <Reveal key={category.title} delay={ci * 80}>
              <div className="mb-4 flex items-center gap-3">
                <h3 className="font-display text-lg font-bold tracking-wide text-ink dark:text-white">
                  {category.title}
                </h3>
                <span className="h-1 flex-1 rounded-full bg-gradient-to-r from-accent/30 to-transparent" aria-hidden="true" />
                <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-ink-faint border-2 border-ink/10 dark:border-white/15 dark:bg-white/5 dark:text-slate-400">
                  {category.skills.length}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                {category.skills.map((skill) => (
                  <SkillCard key={skill.name} skill={skill} />
                ))}
              </div>
            </Reveal>
          ))}
      </div>
    </Section>
  );
}
