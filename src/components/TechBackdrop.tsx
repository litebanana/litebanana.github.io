import { useEffect, useRef } from "react";
import SkillIcon from "./SkillIcon";
import type { Skill } from "../data/skills";

interface Chip {
  icon: Skill["icon"];
  label: string;
  left: string;
  top: string;
  depth: number;
  delay: number;
  duration: number;
  mobile: boolean;
}

const CHIPS: Chip[] = [
  { icon: "python", label: "Python", left: "4%", top: "16%", depth: 18, delay: 0, duration: 7, mobile: false },
  { icon: "ts", label: "TypeScript", left: "86%", top: "12%", depth: 26, delay: 0.8, duration: 8, mobile: false },
  { icon: "html", label: "HTML", left: "12%", top: "72%", depth: 12, delay: 0.4, duration: 6.5, mobile: false },
  { icon: "css", label: "CSS", left: "90%", top: "64%", depth: 20, delay: 1.2, duration: 7.5, mobile: false },
  { icon: "php", label: "PHP", left: "3%", top: "42%", depth: 14, delay: 1.6, duration: 6.8, mobile: true },
  { icon: "flutter", label: "Flutter", left: "93%", top: "38%", depth: 22, delay: 0.3, duration: 8.2, mobile: false },
  { icon: "dart", label: "Dart", left: "18%", top: "30%", depth: 10, delay: 2, duration: 7.2, mobile: true },
  { icon: "database", label: "Database", left: "80%", top: "86%", depth: 16, delay: 0.6, duration: 6.6, mobile: false },
  { icon: "ai", label: "AI / ML", left: "6%", top: "88%", depth: 24, delay: 1, duration: 7.8, mobile: true },
  { icon: "web", label: "Web Dev", left: "72%", top: "24%", depth: 12, delay: 2.4, duration: 6.9, mobile: false },
];

/**
 * Floating technology chips drifting behind the hero copy.
 * Gentle bob + a very subtle cursor parallax (depth-based). Disabled on
 * touch devices so mobile stays calm and performant.
 */
export default function TechBackdrop() {
  const layerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        el.style.setProperty("--mx", x.toFixed(3));
        el.style.setProperty("--my", y.toFixed(3));
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 hidden select-none overflow-hidden sm:block"
    >
      {CHIPS.map((chip) => (
        <div
          key={chip.label}
          className={`absolute ${chip.mobile ? "" : "hidden lg:block"}`}
          style={{
            left: chip.left,
            top: chip.top,
            transform: `translate3d(calc(var(--mx, 0) * ${chip.depth}px), calc(var(--my, 0) * ${chip.depth}px), 0)`,
          }}
        >
          <div
            className="animate-floaty-slow"
            style={{ animationDelay: `${chip.delay}s`, animationDuration: `${chip.duration}s` }}
          >
            <span className="flex items-center gap-2 rounded-2xl border border-ink/10 bg-white/70 px-3 py-2 text-[11px] font-extrabold text-ink-soft shadow-soft backdrop-blur-sm opacity-45 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-accent-tint text-accent-deep dark:bg-accent/20 dark:text-accent-bright">
                <SkillIcon icon={chip.icon} className="h-4 w-4" />
              </span>
              {chip.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
