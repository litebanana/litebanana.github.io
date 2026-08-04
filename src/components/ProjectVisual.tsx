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
      {kind === "game" && <GameMockup />}
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

function GameMockup() {
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
