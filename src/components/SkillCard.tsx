import type { Skill } from "../data/skills";
import SkillIcon from "./SkillIcon";

interface SkillCardProps {
  skill: Skill;
}

export default function SkillCard({ skill }: SkillCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border-2 border-ink/10 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/50 hover:shadow-lift dark:border-white/10 dark:bg-[#131D30] dark:hover:border-accent/60">
      {/* accent corner glow on hover */}
      <span
        className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-accent/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      <div className="flex items-center justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-tint text-accent-deep transition-transform duration-300 group-hover:scale-110 dark:bg-accent/15 dark:text-accent-bright">
          <SkillIcon icon={skill.icon} className="h-6 w-6" />
        </span>
        {skill.years !== undefined ? (
          <span className="text-right">
            <span className="block font-display text-3xl font-black leading-none text-ink dark:text-white">
              {skill.years}
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-ink-faint dark:text-slate-400">
              years
            </span>
          </span>
        ) : (
          <span className="text-right">
            <span className="block font-display text-2xl font-black leading-none text-accent">
              ✓
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-ink-faint dark:text-slate-400">
              used
            </span>
          </span>
        )}
      </div>

      <h4 className="mt-3 font-display text-base font-black text-ink dark:text-white">{skill.name}</h4>
      <p className="mt-0.5 text-xs font-bold text-ink-faint opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:text-slate-400">
        {skill.years !== undefined
          ? "Years of hands-on experience"
          : "Worked with in real projects"}
      </p>
    </div>
  );
}
