import { useState } from "react";
import SkillIcon from "./SkillIcon";
import { SKILL_CATEGORIES } from "../data/skills";

// Flatten every skill (name + icon) into a single ticker list.
const ITEMS = SKILL_CATEGORIES.flatMap((c) => c.skills).map((s) => ({
  name: s.name,
  icon: s.icon,
}));

/**
 * Infinite tech ticker. Two identical rows are rendered inside a track that
 * animates -50%, producing a seamless loop. Hovering pauses the scroll;
 * reduced-motion visitors get a static strip.
 */
export default function TechMarquee() {
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const row = (duplicate: boolean) => (
    <ul
      aria-hidden={duplicate || undefined}
      className="flex shrink-0 items-center gap-8 pr-8 sm:gap-12 sm:pr-12"
    >
      {ITEMS.map((item) => (
        <li
          key={`${item.name}-${duplicate ? "b" : "a"}`}
          className="flex items-center gap-3 whitespace-nowrap"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent-tint text-accent-deep dark:bg-accent/20 dark:text-accent-bright">
            <SkillIcon icon={item.icon} className="h-4 w-4" />
          </span>
          <span className="font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-slate-300">
            {item.name}
          </span>
          <span className="text-accent/70" aria-hidden="true">
            ✦
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      aria-label="Technologies Dominic works with"
      className="group relative overflow-hidden border-y border-ink/10 bg-white/70 py-5 backdrop-blur [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] dark:border-white/10 dark:bg-[#0E1726]/70"
    >
      <div
        className={`flex w-max ${
          reduced ? "" : "animate-marquee group-hover:[animation-play-state:paused]"
        }`}
      >
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
