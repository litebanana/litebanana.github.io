import { useEffect, useLayoutEffect, useRef, useState } from "react";
import SkillIcon from "./SkillIcon";
import type { Skill } from "../data/skills";

type Breakpoint = "base" | "sm" | "lg";

interface Chip {
  icon: Skill["icon"];
  label: string;
  /** Base angle on the orbit in degrees (0° = right, clockwise). */
  angle: number;
  /** Radius multiplier on the base orbit ellipse (0.85–1.12). */
  radius: number;
  /** Scroll-driven rotation speed multiplier — each chip moves at its own pace. */
  speed: number;
  /** Organic sway amplitude in degrees (keeps the orbit feeling alive when idle). */
  sway: number;
  /** Phase offset so chips never move in lockstep. */
  phase: number;
  floatDelay: number;
  floatDuration: number;
  /** Earliest breakpoint at which this chip is visible. */
  min: Breakpoint;
}

const CHIPS: Chip[] = [
  { icon: "python", label: "Python", angle: 0, radius: 1.0, speed: 1.0, sway: 6, phase: 0.4, floatDelay: 0, floatDuration: 7, min: "base" },
  { icon: "ts", label: "TypeScript", angle: 36, radius: 1.1, speed: 1.15, sway: 4, phase: 1.3, floatDelay: 0.8, floatDuration: 8, min: "lg" },
  { icon: "html", label: "HTML", angle: 72, radius: 0.9, speed: 0.85, sway: 7, phase: 2.1, floatDelay: 0.4, floatDuration: 6.5, min: "lg" },
  { icon: "css", label: "CSS", angle: 108, radius: 1.08, speed: 1.25, sway: 5, phase: 2.9, floatDelay: 1.2, floatDuration: 7.5, min: "lg" },
  { icon: "php", label: "PHP", angle: 144, radius: 0.88, speed: 0.9, sway: 8, phase: 3.5, floatDelay: 1.6, floatDuration: 6.8, min: "base" },
  { icon: "flutter", label: "Flutter", angle: 180, radius: 1.12, speed: 1.05, sway: 4, phase: 4.1, floatDelay: 0.3, floatDuration: 8.2, min: "lg" },
  { icon: "dart", label: "Dart", angle: 216, radius: 0.95, speed: 0.8, sway: 6, phase: 4.7, floatDelay: 2, floatDuration: 7.2, min: "base" },
  { icon: "database", label: "Database", angle: 252, radius: 1.05, speed: 1.2, sway: 5, phase: 5.3, floatDelay: 0.6, floatDuration: 6.6, min: "sm" },
  { icon: "ai", label: "AI / ML", angle: 288, radius: 0.98, speed: 0.95, sway: 7, phase: 5.9, floatDelay: 1, floatDuration: 7.8, min: "base" },
  { icon: "web", label: "Web Dev", angle: 324, radius: 0.85, speed: 1.1, sway: 5, phase: 0.9, floatDelay: 2.4, floatDuration: 6.9, min: "sm" },
];

const ICON_INDEX = new Map<Skill["icon"], number>(CHIPS.map((chip, i) => [chip.icon, i]));

const DEG = Math.PI / 180;
/** Degrees of orbit rotation per pixel scrolled (slow, subtle). */
const DEG_PER_PX = 0.055;

function visibilityClass(min: Breakpoint) {
  if (min === "lg") return "hidden lg:block";
  if (min === "sm") return "hidden sm:block";
  return "";
}

/**
 * Orbit size scale per breakpoint: smaller screens get a slightly tighter
 * orbit so the chips hug the edges and never crowd the content.
 */
function radiusScale() {
  const w = window.innerWidth;
  if (w < 640) return 0.92;
  if (w < 1024) return 0.96;
  return 1;
}

/**
 * Base orbit ellipse. Using both viewport dimensions (instead of just the
 * smaller one) spreads the chips across the full screen edges, making the
 * background feel airy instead of cramped.
 */
const ORBIT_RX = 0.42; // × viewport width
const ORBIT_RY = 0.38; // × viewport height

/** Default chip pill styling plus the hover treatment. */
function chipClasses(isHighlighted: boolean) {
  const base =
    "flex items-center gap-2 rounded-2xl border px-3 py-2 text-[11px] font-extrabold backdrop-blur-sm transition-all duration-300 will-change-transform";
  const idle =
    "border-ink/10 bg-white/70 text-ink-soft opacity-[0.3] shadow-soft dark:border-white/10 dark:bg-white/5 dark:text-slate-300 sm:opacity-[0.45]";
  const hover =
    "group-hover:border-accent/70 group-hover:bg-white/95 group-hover:text-accent-deep group-hover:opacity-100 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(56,189,248,0.45)] dark:group-hover:border-accent/70 dark:group-hover:bg-[#1B2B4A]/95 dark:group-hover:text-accent-bright";
  const active =
    "border-accent/80 bg-white/95 text-accent-deep opacity-100 scale-110 shadow-[0_0_24px_rgba(56,189,248,0.5)] dark:border-accent/80 dark:bg-[#1B2B4A]/95 dark:text-accent-bright";
  return `${base} ${isHighlighted ? active : `${idle} ${hover}`}`;
}

/**
 * "Tech Orbit" — the technology chips gently orbit an invisible centre of the
 * viewport. Scroll position drives the rotation (per-chip speeds, damped so the
 * motion eases instead of snapping), a slow sine sway keeps them alive when
 * idle, and the gentle float animation never stops.
 *
 * - Hovering a chip scales/brightens it, adds a cyan glow and a tooltip.
 * - Hovering a skill card highlights its matching chip and draws a faint
 *   connection line (see SkillCard's "orbit:highlight" event).
 * - Respected: prefers-reduced-motion (static chips) and coarse pointers
 *   (no cursor interactions, chips are fully non-interactive).
 */
export default function TechBackdrop() {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const chipEls = useRef<(HTMLDivElement | null)[]>([]);
  const screenPos = useRef<{ x: number; y: number }[]>(CHIPS.map(() => ({ x: 0, y: 0 })));
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const lineRef = useRef<SVGLineElement | null>(null);
  const glowRef = useRef<SVGCircleElement | null>(null);
  const gradRef = useRef<SVGLinearGradientElement | null>(null);

  const reducedRef = useRef(false);
  const coarseRef = useRef(false);
  const hoveredRef = useRef<number | null>(null);

  const [hovered, setHovered] = useState<number | null>(null);
  const [coarse, setCoarse] = useState(false);
  const [highlightIcon, setHighlightIcon] = useState<Skill["icon"] | null>(null);
  const highlightRef = useRef<{ icon: Skill["icon"]; el: HTMLElement } | null>(null);

  useLayoutEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqCoarse = window.matchMedia("(pointer: coarse)");
    reducedRef.current = mqReduced.matches;
    coarseRef.current = mqCoarse.matches;
    setCoarse(mqCoarse.matches);

    // Smaller orbit on smaller screens: tighter radius keeps chips closer to the edges.
    const scale = radiusScale();
    let baseRx = window.innerWidth * ORBIT_RX * scale;
    let baseRy = window.innerHeight * ORBIT_RY * scale;
    let raf = 0;
    let scrollCurrent = window.scrollY;

    const applySvgSize = () => {
      const svg = layer.querySelector("svg");
      if (svg) svg.setAttribute("viewBox", `0 0 ${window.innerWidth} ${window.innerHeight}`);
    };

    /** Place a single chip on the orbit ellipse and remember its screen position. */
    const place = (i: number, angleDeg: number, breather: number) => {
      const el = chipEls.current[i];
      if (!el) return;
      const chip = CHIPS[i];
      const a = angleDeg * DEG;
      const x = Math.cos(a) * baseRx * chip.radius * breather;
      const y = Math.sin(a) * baseRy * chip.radius * breather;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      screenPos.current[i] = { x: window.innerWidth / 2 + x, y: window.innerHeight / 2 + y };
    };

    const placeStatic = () => {
      for (let i = 0; i < CHIPS.length; i++) {
        place(i, CHIPS[i].angle, 1);
      }
    };

    const loop = (now: number) => {
      const t = now / 1000;
      const w = window.innerWidth;

      // Damped scroll value: the orbit eases toward the target instead of
      // snapping, so it "breathes" a moment after the visitor stops scrolling.
      scrollCurrent += (window.scrollY - scrollCurrent) * 0.06;
      const scrollAngle = scrollCurrent * DEG_PER_PX;

      for (let i = 0; i < CHIPS.length; i++) {
        const chip = CHIPS[i];
        const angle =
          chip.angle + scrollAngle * chip.speed + chip.sway * Math.sin(t * 0.3 + chip.phase);
        place(i, angle, 1 + 0.045 * Math.sin(t * 0.22 + chip.phase * 1.7));
      }

      // Follow the hovered chip with the tooltip, clamped to the viewport.
      const tip = tooltipRef.current;
      const idx = hoveredRef.current;
      if (tip && idx != null) {
        const p = screenPos.current[idx];
        const tw = tip.offsetWidth;
        const th = tip.offsetHeight;
        const tx = Math.max(8, Math.min(w - tw - 8, p.x - tw / 2));
        const ty = Math.max(8, p.y - th - 14);
        tip.style.transform = `translate(${tx}px, ${ty}px)`;
        tip.style.opacity = "1";
      }

      // Connection line between a hovered skill card and its orbit chip.
      const hl = highlightRef.current;
      const hi = hl ? ICON_INDEX.get(hl.icon) : undefined;
      // Skip when the matching chip is hidden at this breakpoint (e.g. a
      // lg-only chip on a tablet) — otherwise the line would dangle from
      // empty space.
      const hlChipVisible =
        hi != null && chipEls.current[hi] != null && chipEls.current[hi]!.offsetParent !== null;
      if (hl && hi != null && hlChipVisible) {
        const p = screenPos.current[hi];
        const rect = hl.el.getBoundingClientRect();
        const cx = Math.max(rect.left, Math.min(p.x, rect.right));
        const cy = Math.max(rect.top, Math.min(p.y, rect.bottom));
        const dx = cx - p.x;
        const dy = cy - p.y;
        const dist = Math.hypot(dx, dy) || 1;
        // End the line just before the card edge so it reads as a clean link.
        const ex = cx - (dx / dist) * 6;
        const ey = cy - (dy / dist) * 6;
        const line = lineRef.current;
        const glow = glowRef.current;
        const grad = gradRef.current;
        if (line && glow) {
          line.setAttribute("x1", p.x.toFixed(1));
          line.setAttribute("y1", p.y.toFixed(1));
          line.setAttribute("x2", ex.toFixed(1));
          line.setAttribute("y2", ey.toFixed(1));
          glow.setAttribute("cx", p.x.toFixed(1));
          glow.setAttribute("cy", p.y.toFixed(1));
          if (grad) {
            grad.setAttribute("x1", p.x.toFixed(1));
            grad.setAttribute("y1", p.y.toFixed(1));
            grad.setAttribute("x2", ex.toFixed(1));
            grad.setAttribute("y2", ey.toFixed(1));
          }
        }
      }

      raf = requestAnimationFrame(loop);
    };

    const onHighlight = (e: Event) => {
      if (reducedRef.current || coarseRef.current) return;
      const detail = (e as CustomEvent<{ icon?: Skill["icon"]; el?: HTMLElement } | null>).detail;
      if (detail?.icon && detail.el) {
        // Ignore cards whose technology has no orbit chip (React, Node, …).
        if (!ICON_INDEX.has(detail.icon)) return;
        highlightRef.current = { icon: detail.icon, el: detail.el };
        setHighlightIcon(detail.icon);
      } else {
        highlightRef.current = null;
        setHighlightIcon(null);
      }
    };

    const onResize = () => {
      const s = radiusScale();
      baseRx = window.innerWidth * ORBIT_RX * s;
      baseRy = window.innerHeight * ORBIT_RY * s;
      applySvgSize();
    };

    applySvgSize();

    // Reduced motion: place chips once at their base orbit and stay still.
    if (mqReduced.matches) {
      placeStatic();
      const onResizeStatic = () => {
        onResize();
        placeStatic();
      };
      window.addEventListener("resize", onResizeStatic);
      return () => window.removeEventListener("resize", onResizeStatic);
    }

    // Pause the animation loop while the tab is hidden to save battery.
    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(loop);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("orbit:highlight", onHighlight);
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orbit:highlight", onHighlight);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Reduced motion: position the tooltip once per hover (chips are static).
  useEffect(() => {
    if (hovered == null || !reducedRef.current) return;
    const el = chipEls.current[hovered];
    const tip = tooltipRef.current;
    if (!el || !tip) return;
    const r = el.getBoundingClientRect();
    const tx = Math.max(
      8,
      Math.min(window.innerWidth - tip.offsetWidth - 8, r.left + r.width / 2 - tip.offsetWidth / 2)
    );
    const ty = Math.max(8, r.top - tip.offsetHeight - 14);
    tip.style.transform = `translate(${tx}px, ${ty}px)`;
    tip.style.opacity = "1";
  }, [hovered]);

  const handleEnter = (i: number) => {
    if (coarseRef.current) return;
    hoveredRef.current = i;
    setHovered(i);
  };

  const handleLeave = () => {
    hoveredRef.current = null;
    setHovered(null);
  };

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden"
    >
      {/* Connection line + glow drawn toward a hovered skill card */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <linearGradient
            ref={gradRef}
            id="orbitLineGrad"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <line
          ref={lineRef}
          x1="0"
          y1="0"
          x2="0"
          y2="0"
          stroke="url(#orbitLineGrad)"
          strokeWidth="1.5"
          strokeDasharray="4 8"
          strokeLinecap="round"
          className="transition-opacity duration-300"
          style={{ opacity: highlightIcon ? 1 : 0 }}
        />
        <circle
          ref={glowRef}
          cx="0"
          cy="0"
          r="4"
          fill="#38BDF8"
          className="transition-opacity duration-300"
          style={{ opacity: highlightIcon ? 0.85 : 0 }}
        />
      </svg>

      {CHIPS.map((chip, i) => (
        <div
          key={chip.icon}
          ref={(el) => {
            chipEls.current[i] = el;
          }}
          className={`group absolute left-1/2 top-1/2 will-change-transform ${visibilityClass(chip.min)}`}
          style={{ pointerEvents: coarse ? "none" : "auto" }}
          onMouseEnter={() => handleEnter(i)}
          onMouseLeave={handleLeave}
        >
          <div
            className="animate-floaty-slow group-hover:[animation-play-state:paused]"
            style={{ animationDelay: `${chip.floatDelay}s`, animationDuration: `${chip.floatDuration}s` }}
          >
            <span className={chipClasses(highlightIcon === chip.icon)}>
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-accent-tint text-accent-deep dark:bg-accent/20 dark:text-accent-bright">
                <SkillIcon icon={chip.icon} className="h-4 w-4" />
              </span>
              {chip.label}
            </span>
          </div>
        </div>
      ))}

      {/* Shared tooltip, positioned next to the hovered chip */}
      {hovered != null && !coarse && (
        <div
          ref={tooltipRef}
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 z-10 whitespace-nowrap rounded-lg border border-ink/10 bg-white/95 px-3 py-1.5 text-[11px] font-extrabold text-ink opacity-0 shadow-card backdrop-blur dark:border-white/10 dark:bg-[#16213E]/95 dark:text-white"
        >
          {CHIPS[hovered].label}
        </div>
      )}
    </div>
  );
}
