import type { Skill } from "../data/skills";

/**
 * Minimal illustrative glyphs for each technology.
 * Simple, self-made marks (not vendor logos).
 */
export default function SkillIcon({ icon, className = "" }: { icon: Skill["icon"]; className?: string }) {
  const glyph: Record<Skill["icon"], React.ReactNode> = {
    python: <Monogram>Py</Monogram>,
    ts: <Monogram>TS</Monogram>,
    js: <Monogram>JS</Monogram>,
    php: <Monogram>PHP</Monogram>,
    flutter: <Monogram>Fl</Monogram>,
    dart: <Monogram>Da</Monogram>,
    node: <Monogram>No</Monogram>,
    react: <Monogram>Re</Monogram>,
    tailwind: <Monogram>Tw</Monogram>,
    express: <Monogram>Ex</Monogram>,
    vite: <Monogram>Vi</Monogram>,
    html: <Monogram>&lt;/&gt;</Monogram>,
    css: <Monogram>#</Monogram>,
    mongodb: <Monogram>Mo</Monogram>,
    mysql: <Monogram>My</Monogram>,
    fastapi: <Monogram>Fa</Monogram>,
    qa: <Monogram>QA</Monogram>,
    pm: <Monogram>PM</Monogram>,
    web: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18Z" />
      </svg>
    ),
    database: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
        <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
      </svg>
    ),
    ai: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2l1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 2z" />
        <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
        <path d="M5 15l.6 1.4L7 17l-1.4.6L5 19l-.6-1.4L3 17l1.4-.6L5 15z" />
      </svg>
    ),
  };

  return <span className="grid place-items-center">{glyph[icon]}</span>;
}

function Monogram({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-display text-lg font-black leading-none tracking-tight">
      {children}
    </span>
  );
}
