import { useId } from "react";
import type { ProjectVisual as VisualKind } from "../data/projects";

interface ProjectVisualProps {
  kind: VisualKind;
  accent: string;
  name: string;
}

/**
 * Decorative, illustrative mockups for each project.
 * These are generic UI sketches (not screenshots) so they never
 * misrepresent the projects. Replace with real screenshots later if desired.
 */
export default function ProjectVisual({ kind, accent, name }: ProjectVisualProps) {
  return (
    <div
      className="relative flex h-52 items-center justify-center overflow-hidden sm:h-64"
      style={{ background: `linear-gradient(135deg, ${accent}1f, ${accent}0d)` }}
    >
      <span className="pointer-events-none absolute left-3 top-2 rounded-md bg-white/70 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-ink-faint">
        Illustrative mockup
      </span>

      {kind === "phone" && <PhoneMockup accent={accent} name={name} />}
      {kind === "browser" && <BrowserMockup accent={accent} name={name} />}
      {kind === "game" && <GameMockup name={name} accent={accent} />}
      {kind === "tablet" && <TabletMockup accent={accent} name={name} />}
    </div>
  );
}

function PhoneMockup({ accent, name }: { accent: string; name: string }) {
  return (
    <div
      aria-hidden="true"
      className="relative h-44 w-24 rounded-[1.4rem] border-[3px] border-ink bg-white shadow-card sm:h-52 sm:w-28"
    >
      {/* notch */}
      <span className="absolute left-1/2 top-1.5 h-1.5 w-8 -translate-x-1/2 rounded-full bg-ink/20" />
      <div className="absolute inset-2 flex flex-col items-center justify-center gap-2 rounded-xl bg-white p-2">
        <div className="text-[9px] font-black tracking-widest" style={{ color: accent }}>
          {name.toUpperCase()}
        </div>
        {/* activity rings */}
        <svg viewBox="0 0 40 40" className="h-14 w-14 sm:h-16 sm:w-16">
          <circle cx="20" cy="20" r="16" fill="none" stroke="#E8EEF5" strokeWidth="5" />
          <circle cx="20" cy="20" r="16" fill="none" stroke={accent} strokeWidth="5" strokeDasharray="70 100" strokeLinecap="round" transform="rotate(-90 20 20)" />
          <circle cx="20" cy="20" r="11" fill="none" stroke="#22C55E" strokeWidth="5" strokeDasharray="40 100" strokeLinecap="round" transform="rotate(-90 20 20)" />
        </svg>
        {/* bars */}
        <div className="flex h-9 w-full items-end justify-center gap-1">
          <span className="w-1.5 rounded-sm bg-accent/40" style={{ height: "40%" }} />
          <span className="w-1.5 rounded-sm bg-accent/50" style={{ height: "60%" }} />
          <span className="w-1.5 rounded-sm bg-accent/70" style={{ height: "45%" }} />
          <span className="w-1.5 rounded-sm" style={{ height: "80%", background: accent }} />
          <span className="w-1.5 rounded-sm bg-accent/60" style={{ height: "55%" }} />
        </div>
      </div>
    </div>
  );
}

function BrowserMockup({ accent, name }: { accent: string; name: string }) {
  return (
    <div aria-hidden="true" className="w-56 sm:w-72">
      <div className="flex items-center gap-1 rounded-t-xl border-2 border-b-0 border-ink bg-white px-2.5 py-1.5">
        <span className="h-2 w-2 rounded-full bg-[#F87171]" />
        <span className="h-2 w-2 rounded-full bg-[#FBBF24]" />
        <span className="h-2 w-2 rounded-full bg-[#34D399]" />
        <span className="ml-2 flex-1 rounded-md bg-ink/5 px-2 py-0.5 text-[9px] font-bold text-ink-faint">
          {name.toLowerCase()}.app
        </span>
      </div>
      <div className="flex h-28 rounded-b-xl border-2 border-ink bg-white p-2 sm:h-32">
        {/* sidebar */}
        <div className="mr-2 flex w-8 flex-col items-center gap-1.5 rounded-lg bg-ink/5 py-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
          <span className="h-2 w-2 rounded-full bg-ink/20" />
          <span className="h-2 w-2 rounded-full bg-ink/20" />
          <span className="h-2 w-2 rounded-full bg-ink/20" />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          {/* stat cards */}
          <div className="grid grid-cols-3 gap-1.5">
            <span className="rounded-md bg-ink/5 p-1">
              <span className="block h-1.5 w-3/4 rounded bg-ink/15" />
              <span className="mt-1 block h-2 w-1/2 rounded" style={{ background: accent }} />
            </span>
            <span className="rounded-md bg-ink/5 p-1">
              <span className="block h-1.5 w-3/4 rounded bg-ink/15" />
              <span className="mt-1 block h-2 w-1/2 rounded bg-ink/25" />
            </span>
            <span className="rounded-md bg-ink/5 p-1">
              <span className="block h-1.5 w-3/4 rounded bg-ink/15" />
              <span className="mt-1 block h-2 w-1/2 rounded bg-ink/25" />
            </span>
          </div>
          {/* chart */}
          <div className="flex flex-1 items-end gap-1 rounded-md bg-ink/5 p-1.5">
            {[35, 55, 40, 70, 50, 85, 65].map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-sm"
                style={{ height: `${h}%`, background: i === 5 ? accent : `${accent}66` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GameMockup({ name, accent }: { name: string; accent: string }) {
  // The Backroom Game gets the corridor scene; VOID//RUN gets its own
  // dungeon-roguelite mockup with a pixel hero, HUD, and boss doorway.
  if (name.toLowerCase().includes("void")) {
    return <VoidRunMockup accent={accent} />;
  }
  return (
    <div aria-hidden="true" className="relative h-40 w-56 overflow-hidden rounded-2xl border-[3px] border-ink bg-[#141d2e] sm:h-44 sm:w-64">
      {/* corridor perspective */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full opacity-90" preserveAspectRatio="none">
        <path d="M0 100 L20 60 L20 40 L0 0 Z" fill="#1c2740" />
        <path d="M100 100 L80 60 L80 40 L100 0 Z" fill="#1c2740" />
        <path d="M50 100 L50 0" stroke="#2a3a5c" strokeWidth="2" />
        <rect x="20" y="40" width="60" height="20" fill="#243250" />
        <rect x="22" y="42" width="56" height="16" fill="#3a4d75" />
        {/* doorway */}
        <rect x="42" y="46" width="16" height="14" fill="#0b1120" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      <span className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-white/20 bg-black/40 px-2 py-0.5 text-[9px] font-black tracking-[0.25em] text-white/80">
        BACKROOMS
      </span>
      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-white/50">
        simple exploration experience
      </span>
    </div>
  );
}

/**
 * Pixel-art dungeon-roguelite mockup for VOID//RUN: a torch-lit brick room,
 * the pixel hero (Black Rabbit), slime enemies, an HP HUD, a minimap, and
 * the boss doorway glowing with THE NULL WARDEN's eyes.
 */
function VoidRunMockup({ accent }: { accent: string }) {
  const uid = useId();
  const brickId = `voidrun-bricks-${uid}`;
  return (
    <div
      aria-hidden="true"
      className="relative h-40 w-56 overflow-hidden rounded-2xl border-[3px] border-ink bg-[#0e0a1c] sm:h-44 sm:w-64"
    >
      {/* dungeon scene */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <pattern id={brickId} width="14" height="7" patternUnits="userSpaceOnUse">
            <rect width="14" height="7" fill="#241a45" />
            <rect x="0.5" y="0.5" width="13" height="6" fill="#1b1233" />
            <rect x="0.5" y="3.5" width="13" height="3" fill="#251b48" />
          </pattern>
          <linearGradient id={`wall-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#120b24" />
            <stop offset="100%" stopColor="#1b1233" />
          </linearGradient>
        </defs>

        {/* back wall */}
        <rect x="0" y="0" width="100" height="62" fill={`url(#wall-${uid})`} />
        <rect x="0" y="0" width="100" height="62" fill={`url(#${brickId})`} />

        {/* torches */}
        <rect x="4" y="30" width="2.5" height="10" fill="#3b2d5e" />
        <rect x="3.6" y="27" width="3.3" height="3.3" fill={accent} opacity="0.9" />
        <rect x="93.5" y="30" width="2.5" height="10" fill="#3b2d5e" />
        <rect x="93.1" y="27" width="3.3" height="3.3" fill={accent} opacity="0.9" />

        {/* boss doorway with void glow */}
        <rect x="38" y="18" width="24" height="44" fill="#0b0718" />
        <rect x="37" y="15" width="26" height="4" fill="#4c3b82" />
        <rect x="40" y="24" width="20" height="38" fill={accent} opacity="0.28" />
        {/* THE NULL WARDEN eyes */}
        <rect x="45" y="36" width="4" height="5" fill={accent} />
        <rect x="51" y="36" width="4" height="5" fill={accent} />

        {/* floor tiles with perspective */}
        <rect x="0" y="62" width="100" height="38" fill="#120b24" />
        {[72, 82, 92].map((y, i) => (
          <rect key={y} x="0" y={y} width="100" height={1.5} fill="#241a45" opacity={0.5 + i * 0.25} />
        ))}
        <rect x="0" y="62" width="100" height="1.5" fill="#4c3b82" opacity="0.8" />
      </svg>

      {/* subtle CRT scanlines for retro game feel */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_3px)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/30" />

      {/* HUD: hearts */}
      <div className="absolute left-2 top-2 flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <svg key={i} viewBox="0 0 8 8" className="h-2.5 w-2.5">
            <path
              d="M4 6.5 C2.8 5.4 1.2 4.2 1.2 2.9 A1.9 1.9 0 0 1 4 1.6 A1.9 1.9 0 0 1 6.8 2.9 C6.8 4.2 5.2 5.4 4 6.5 Z"
              fill={i < 2 ? "#f43f5e" : "#1f1437"}
              stroke={i < 2 ? "#fda4af" : "#3b2d5e"}
              strokeWidth="0.4"
            />
          </svg>
        ))}
      </div>

      {/* HUD: HP bar */}
      <div className="absolute left-2 top-5 flex items-center gap-1">
        <span className="text-[7px] font-black tracking-widest text-white/70">HP</span>
        <div className="h-1.5 w-14 overflow-hidden rounded-full border border-white/20 bg-black/50">
          <div className="h-full w-[70%] rounded-full" style={{ background: accent }} />
        </div>
      </div>

      {/* HUD: minimap */}
      <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded border border-white/20 bg-black/50">
        <svg viewBox="0 0 20 20" className="h-6 w-6">
          <rect x="2" y="2" width="6" height="6" fill="#241a45" stroke="#4c3b82" strokeWidth="0.8" />
          <rect x="11" y="2" width="6" height="6" fill="#241a45" stroke="#4c3b82" strokeWidth="0.8" />
          <rect x="2" y="11" width="6" height="6" fill="#241a45" stroke="#4c3b82" strokeWidth="0.8" />
          <rect x="11" y="11" width="6" height="6" fill={accent} opacity="0.55" />
          <rect x="13.5" y="13.5" width="1.5" height="1.5" fill="#fff" />
        </svg>
      </div>

      {/* title */}
      <span className="absolute left-1/2 top-2 -translate-x-1/2 rounded border border-white/20 bg-black/55 px-2 py-0.5 text-[9px] font-black tracking-[0.25em] text-white">
        VOID//RUN
      </span>

      {/* pixel hero — Black Rabbit with a sword */}
      <div className="absolute bottom-2 left-3">
        <svg viewBox="0 0 14 14" className="h-12 w-12">
          {/* ears */}
          <rect x="3" y="0.5" width="2" height="3.5" fill="#7c3aed" />
          <rect x="8.5" y="0.5" width="2" height="3.5" fill="#7c3aed" />
          <rect x="3.5" y="1" width="1" height="2.5" fill="#c4b5fd" />
          <rect x="9" y="1" width="1" height="2.5" fill="#c4b5fd" />
          {/* head */}
          <rect x="2" y="4" width="10" height="4.5" fill="#8b5cf6" />
          <rect x="2" y="5.5" width="10" height="2" fill="#a78bfa" />
          {/* eyes */}
          <rect x="4.5" y="5" width="1.5" height="1.5" fill="#0e0a1c" />
          <rect x="8" y="5" width="1.5" height="1.5" fill="#0e0a1c" />
          {/* body */}
          <rect x="3" y="8.5" width="8" height="5" fill="#5b21b6" />
          <rect x="3" y="10" width="8" height="2" fill="#7c3aed" />
          {/* sword */}
          <rect x="11.5" y="6.5" width="1.5" height="6" fill="#e2e8f0" />
          <rect x="10.5" y="6" width="3.5" height="1" fill="#cbd5e1" />
          <rect x="10.5" y="4.5" width="1.5" height="2" fill="#8b5cf6" />
        </svg>
      </div>

      {/* slime enemies */}
      <div className="absolute bottom-2 right-4 flex gap-1">
        <svg viewBox="0 0 10 7" className="h-5 w-7">
          <path d="M1 6.5 Q1 2 5 2 Q9 2 9 6.5 Z" fill={accent} opacity="0.75" />
          <rect x="3.2" y="3.4" width="1.4" height="1.4" fill="#0e0a1c" />
          <rect x="5.6" y="3.4" width="1.4" height="1.4" fill="#0e0a1c" />
        </svg>
        <svg viewBox="0 0 10 7" className="mt-1 h-4 w-6">
          <path d="M1 6.5 Q1 2.5 5 2.5 Q9 2.5 9 6.5 Z" fill={accent} opacity="0.45" />
          <rect x="3.2" y="3.8" width="1.2" height="1.2" fill="#0e0a1c" />
          <rect x="5.6" y="3.8" width="1.2" height="1.2" fill="#0e0a1c" />
        </svg>
      </div>
    </div>
  );
}

function TabletMockup({ accent, name }: { accent: string; name: string }) {
  const items = [
    { label: "Item name", cat: "Kitchen", on: true },
    { label: "Item name", cat: "Tools", on: false },
    { label: "Item name", cat: "Storage", on: true },
    { label: "Item name", cat: "Kitchen", on: false },
  ];
  return (
    <div aria-hidden="true" className="w-60 sm:w-72">
      <div className="rounded-2xl border-[3px] border-ink bg-white p-2 shadow-card">
        <div className="flex items-center justify-between px-1 pb-1.5">
          <span className="text-[9px] font-black tracking-widest" style={{ color: accent }}>
            {name.toUpperCase()}
          </span>
          <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[8px] font-bold text-ink-faint">
            {items.filter((i) => i.on).length}/{items.length} items
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-ink/[0.04] px-2 py-1.5">
              <span
                className={`grid h-3.5 w-3.5 place-items-center rounded-full border-2 ${
                  item.on ? "" : "border-ink/20 bg-white"
                }`}
                style={item.on ? { background: accent, borderColor: accent } : undefined}
              >
                {item.on && <span className="text-[7px] font-black text-white">✓</span>}
              </span>
              <span className="flex-1 text-[9px] font-bold text-ink-soft">{item.label}</span>
              <span className="rounded bg-ink/5 px-1.5 py-0.5 text-[7px] font-extrabold uppercase text-ink-faint">
                {item.cat}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
