import { useEffect, useState } from "react";

export type CharacterPose =
  | "standing"
  | "waving"
  | "pointing"
  | "thinking"
  | "celebrating"
  | "sitting"
  | "laptop";

export type LookDirection = "left" | "right" | "center";

interface CharacterProps {
  pose?: CharacterPose;
  looking?: LookDirection;
  className?: string;
  animate?: boolean;
}

const INK = "#16213E";
const SKIN = "#F6C9A0";
const HAIR = "#1B2A4E";
const SHIRT = "#38BDF8";
const SHIRT_DARK = "#0EA5E9";
const PANTS = "#33415E";
const CHEEK = "#F9A8C0";

/**
 * Dominic — the portfolio mascot.
 * An original, clean chibi-style illustrated boy character built as inline SVG
 * so it stays crisp, lightweight and fully responsive on GitHub Pages.
 * No raster assets, no external requests.
 */
export default function Character({
  pose = "standing",
  looking = "center",
  className = "",
  animate = true,
}: CharacterProps) {
  const lookShift = looking === "left" ? -4 : looking === "right" ? 4 : 0;
  const idle = animate ? " char-idle" : "";

  return (
    <svg
      viewBox="0 0 220 208"
      className={`${className}${idle}`}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {/* Ground shadow */}
      <ellipse cx="110" cy="200" rx="52" ry="7" fill={INK} opacity="0.07" />

      {/* ------------------------------ HEAD ------------------------------ */}
      <g>
        {/* ears */}
        <circle cx="72" cy="66" r="7" fill={SKIN} stroke={INK} strokeWidth="3.5" />
        <circle cx="148" cy="66" r="7" fill={SKIN} stroke={INK} strokeWidth="3.5" />
        {/* head */}
        <circle cx="110" cy="62" r="38" fill={SKIN} stroke={INK} strokeWidth="3.5" />
        {/* hair cap with two front bangs */}
        <path
          d="M110 19 C134 19 150 34 150 57 C150 62 147 64 144 62 C141 59 138 56 134 55 C131 61 127 65 120 66 L100 66 C93 65 89 61 86 55 C82 56 79 59 76 62 C73 64 70 62 70 57 C70 34 86 19 110 19 Z"
          fill={HAIR}
          stroke={INK}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* hair tuft */}
        <path
          d="M102 21 Q106 9 115 11 Q119 5 124 13 Q130 13 125 21 Z"
          fill={HAIR}
          stroke={INK}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* eyes (blink + look direction) */}
        <g
          className="eye-blink"
          transform={`translate(${lookShift} 0)`}
        >
          <circle cx="95" cy="63" r="4.6" fill={INK} />
          <circle cx="125" cy="63" r="4.6" fill={INK} />
          <circle cx="96.5" cy="61.2" r="1.5" fill="#fff" />
          <circle cx="126.5" cy="61.2" r="1.5" fill="#fff" />
        </g>
        {/* brows */}
        <path d="M85 53 Q94 48 102 52" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M118 52 Q126 48 135 53" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* cheeks */}
        <circle cx="82" cy="73" r="4.8" fill={CHEEK} opacity="0.55" />
        <circle cx="138" cy="73" r="4.8" fill={CHEEK} opacity="0.55" />
        {/* smile */}
        <path d="M101 76 Q110 85 119 76" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>

      {/* ------------------------------ BODY ------------------------------ */}
      {/* neck */}
      <rect x="102" y="92" width="16" height="14" rx="6" fill={SKIN} stroke={INK} strokeWidth="3.5" />
      {/* torso */}
      <path
        d="M80 106 C80 97 88 97 94 99 L126 99 C132 97 140 97 140 106 L140 150 C140 160 132 166 120 166 L100 166 C88 166 80 160 80 150 Z"
        fill={SHIRT}
        stroke={INK}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* collar */}
      <path d="M98 100 L110 114 L122 100 Z" fill="#E0F2FE" stroke={INK} strokeWidth="3" strokeLinejoin="round" />

      {/* ------------------------------ ARMS ------------------------------ */}
      {pose === "waving" && (
        <>
          <Arm path="M88 108 L80 132" hand={{ x: 79, y: 134 }} />
          <g className="limb limb-arm-wave" style={{ transformOrigin: "8% 94%" }}>
            <Arm path="M132 106 C138 92 140 88 148 78" hand={{ x: 150, y: 76 }} />
          </g>
        </>
      )}

      {pose === "pointing" && (
        <>
          <Arm path="M88 108 C84 118 84 126 86 130" hand={{ x: 87, y: 132 }} />
          <Arm path="M132 106 C142 108 150 112 158 118" hand={{ x: 161, y: 120 }} />
        </>
      )}

      {pose === "thinking" && (
        <>
          <Arm path="M88 108 C84 118 84 126 86 130" hand={{ x: 87, y: 132 }} />
          <Arm path="M132 106 C134 96 130 94 124 99" hand={{ x: 122, y: 101 }} />
        </>
      )}

      {pose === "celebrating" && (
        <>
          <g className="limb limb-celebrate" style={{ transformOrigin: "92% 94%" }}>
            <Arm path="M88 106 C82 92 78 88 74 80" hand={{ x: 72, y: 77 }} />
          </g>
          <g
            className="limb limb-celebrate"
            style={{ transformOrigin: "8% 94%", animationDelay: "0.15s" }}
          >
            <Arm path="M132 106 C138 92 142 88 146 80" hand={{ x: 148, y: 77 }} />
          </g>
          {/* celebration sparkles */}
          <g className="sparkle-pulse">
            <Star x={58} y={60} />
            <Star x={166} y={50} />
          </g>
        </>
      )}

      {pose === "sitting" && (
        <>
          <Arm path="M88 108 C84 122 84 132 86 140" hand={{ x: 86, y: 142 }} />
          <Arm path="M132 108 C136 122 136 132 134 140" hand={{ x: 134, y: 142 }} />
        </>
      )}

      {pose === "laptop" && (
        <>
          <Arm path="M88 108 C82 124 82 138 84 148" hand={{ x: 84, y: 150 }} />
          <Arm path="M132 108 C138 124 138 138 136 148" hand={{ x: 136, y: 150 }} />
        </>
      )}

      {pose === "standing" && (
        <>
          <Arm path="M88 108 L80 132" hand={{ x: 79, y: 134 }} />
          <Arm path="M132 108 L140 132" hand={{ x: 141, y: 134 }} />
        </>
      )}

      {/* ------------------------------ LEGS ------------------------------ */}
      {pose === "standing" || pose === "waving" || pose === "pointing" || pose === "thinking" || pose === "celebrating" ? (
        <>
          <rect x="90" y="156" width="17" height="30" rx="8" fill={PANTS} stroke={INK} strokeWidth="3.5" />
          <rect x="113" y="156" width="17" height="30" rx="8" fill={PANTS} stroke={INK} strokeWidth="3.5" />
          <rect x="85" y="184" width="27" height="13" rx="6.5" fill={INK} stroke={INK} strokeWidth="3" />
          <rect x="108" y="184" width="27" height="13" rx="6.5" fill={INK} stroke={INK} strokeWidth="3" />
        </>
      ) : (
        /* sitting / laptop — feet peeking out, laptop drawn in front */
        <>
          <rect x="82" y="158" width="18" height="16" rx="8" fill={PANTS} stroke={INK} strokeWidth="3.5" />
          <rect x="120" y="158" width="18" height="16" rx="8" fill={PANTS} stroke={INK} strokeWidth="3.5" />
          <rect x="77" y="172" width="26" height="13" rx="6.5" fill={INK} stroke={INK} strokeWidth="3" />
          <rect x="117" y="172" width="26" height="13" rx="6.5" fill={INK} stroke={INK} strokeWidth="3" />
        </>
      )}

      {/* ------------------------------ LAPTOP ------------------------------ */}
      {pose === "laptop" && (
        <g>
          <rect x="74" y="112" width="72" height="36" rx="6" fill="#0B1B33" stroke={INK} strokeWidth="3.5" />
          <rect x="82" y="120" width="30" height="4" rx="2" fill="#1E3A5F" />
          <rect x="82" y="128" width="22" height="4" rx="2" fill="#22D3EE" />
          <rect x="82" y="136" width="26" height="4" rx="2" fill="#38BDF8" />
          <circle cx="140" cy="124" r="5" fill="#22D3EE" opacity="0.9" />
          <rect x="70" y="150" width="80" height="12" rx="5" fill="#24324F" stroke={INK} strokeWidth="3.5" />
        </g>
      )}
    </svg>
  );
}

function Arm({ path, hand }: { path: string; hand: { x: number; y: number } }) {
  return (
    <g>
      <path d={path} stroke={SHIRT_DARK} strokeWidth="14" strokeLinecap="round" fill="none" />
      <circle cx={hand.x} cy={hand.y} r="8.5" fill={SKIN} stroke={INK} strokeWidth="3" />
    </g>
  );
}

function Star({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x} ${y - 7} L${x + 2.4} ${y - 2.4} L${x + 7} ${y} L${x + 2.4} ${y + 2.4} L${x} ${y + 7} L${x - 2.4} ${y + 2.4} L${x - 7} ${y} L${x - 2.4} ${y - 2.4} Z`}
      fill={SHIRT_DARK}
      stroke={INK}
      strokeWidth="2"
      strokeLinejoin="round"
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Mascot — wraps the character with the click easter egg + speech bubble      */
/* -------------------------------------------------------------------------- */

const BUBBLES = ["Hey! I'm Dominic 👋", "Thanks for checking out my portfolio!"];

export function Mascot({
  pose = "standing",
  looking = "center",
  className = "",
  animate = true,
  ariaLabel = "Click to hear from Dominic",
}: CharacterProps & { ariaLabel?: string }) {
  const [clickCount, setClickCount] = useState(0);
  const [bubble, setBubble] = useState<string | null>(null);
  const timer = useTimeout();

  function handleClick() {
    const next = clickCount + 1;
    setClickCount(next);
    setBubble(BUBBLES[(next - 1) % BUBBLES.length]);
    timer.clear();
    timer.set(() => setBubble(null), 3600);
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        aria-label={ariaLabel}
        className="block cursor-pointer rounded-3xl transition-transform duration-300 hover:scale-[1.04] active:scale-95 focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Character pose={pose} looking={looking} animate={animate} className="w-full h-auto" />
      </button>

      {bubble && (
        <div
          role="status"
          className="absolute -top-7 left-1/2 z-20 w-max max-w-[220px] -translate-x-1/2 -translate-y-full animate-pop-in rounded-2xl border-2 border-ink/10 bg-white px-4 py-2 text-sm font-extrabold text-ink shadow-card"
        >
          {bubble}
          <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 rotate-45 border-r-2 border-b-2 border-ink/10 bg-white w-3 h-3" />
        </div>
      )}
    </div>
  );
}

function useTimeout() {
  const [id, setId] = useState<number | null>(null);
  useEffect(() => () => { if (id !== null) window.clearTimeout(id); }, [id]);
  return {
    set(fn: () => void, ms: number) {
      const t = window.setTimeout(fn, ms);
      setId(t);
    },
    clear() {
      if (id !== null) window.clearTimeout(id);
      setId(null);
    },
  };
}
