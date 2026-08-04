interface FloatingShapeProps {
  variant?: "circle" | "ring" | "plus" | "dot" | "square" | "spark";
  className?: string;
}

/**
 * Small decorative geometric shapes used across sections.
 * Pure CSS/SVG — no image assets.
 */
export default function FloatingShape({ variant = "circle", className = "" }: FloatingShapeProps) {
  const base = "pointer-events-none absolute select-none";

  switch (variant) {
    case "ring":
      return <span aria-hidden="true" className={`${base} ${className}`}><span className="block h-10 w-10 rounded-full border-[3px] border-accent/40" /></span>;
    case "plus":
      return (
        <span aria-hidden="true" className={`${base} ${className}`}>
          <span className="relative block h-6 w-6">
            <span className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 rounded-full bg-accent/50" />
            <span className="absolute top-1/2 left-0 h-[3px] w-full -translate-y-1/2 rounded-full bg-accent/50" />
          </span>
        </span>
      );
    case "dot":
      return <span aria-hidden="true" className={`${base} ${className}`}><span className="block h-3 w-3 rounded-full bg-ink/15" /></span>;
    case "square":
      return <span aria-hidden="true" className={`${base} ${className}`}><span className="block h-8 w-8 rotate-12 rounded-lg border-[3px] border-ink/10" /></span>;
    case "spark":
      return (
        <span aria-hidden="true" className={`${base} ${className}`}>
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-accent/60">
            <path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4L12 0z" />
          </svg>
        </span>
      );
    case "circle":
    default:
      return <span aria-hidden="true" className={`${base} ${className}`}><span className="block h-6 w-6 rounded-full bg-accent/25" /></span>;
  }
}
