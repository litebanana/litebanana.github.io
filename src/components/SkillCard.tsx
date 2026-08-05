import { useRef } from "react";
import type { Skill } from "../data/skills";
import SkillIcon from "./SkillIcon";

interface SkillCardProps {
  skill: Skill;
}

/**
 * Tells the Tech Orbit backdrop which technology chip to highlight when this
 * card is hovered. Cursor-only devices; touch users get the highlight via the
 * card's own hover styles instead.
 */
function highlightOrbit(icon: Skill["icon"], el: HTMLElement | null) {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  window.dispatchEvent(
    new CustomEvent("orbit:highlight", { detail: { icon, el } })
  );
}

export default function SkillCard({ skill }: SkillCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => highlightOrbit(skill.icon, cardRef.current)}
      onMouseLeave={() =>
        window.dispatchEvent(new CustomEvent("orbit:highlight", { detail: { icon: null } }))
      }
      className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-lift dark:border-white/10 dark:bg-[#131D30] dark:hover:border-accent/60"
    >
      {/* accent corner glow on hover */}
      <span
        className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-accent/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      <div className="flex items-center justify-between gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-accent-tint to-accent/15 text-accent-deep transition-transform duration-300 group-hover:scale-110 dark:from-accent/20 dark:to-accent/5 dark:text-accent-bright">
          <SkillIcon icon={skill.icon} className="h-6 w-6" />
        </span>
        {skill.years !== undefined ? (
          <span className="text-right">
            <span className="block font-display text-2xl font-bold leading-none text-ink dark:text-white">
              {skill.years}
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-ink-faint dark:text-slate-400">
              {skill.years === 1 ? "year" : "years"}
            </span>
          </span>
        ) : (
          <span className="text-right">
            <span className="block font-display text-xl font-bold leading-none text-accent">
              ✓
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-ink-faint dark:text-slate-400">
              used
            </span>
          </span>
        )}
      </div>

      <h4 className="mt-3 font-display text-base font-bold text-ink dark:text-white">{skill.name}</h4>
      <p className="mt-1 text-xs font-semibold text-ink-faint dark:text-slate-400">
        {skill.years !== undefined
          ? "Hands-on experience"
          : "Worked with in real projects"}
      </p>
    </div>
  );
}
