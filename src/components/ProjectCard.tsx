import { useEffect, useRef, type CSSProperties } from "react";
import type { Project } from "../data/projects";
import ProjectVisual from "./ProjectVisual";
import { ArrowRightIcon, ExternalIcon, GithubIcon, PencilIcon } from "./Icons";

interface ProjectCardProps {
  project: Project;
  active: boolean;
  onOpen: () => void;
}

export default function ProjectCard({ project, active, onOpen }: ProjectCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);
  const settingsRef = useRef({ reduced: false, coarse: false });
  const hasPlaceholders = project.description.startsWith("[");

  useEffect(() => {
    settingsRef.current = {
      reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      coarse: window.matchMedia("(pointer: coarse)").matches,
    };
  }, []);

  /** Return the card to its resting transform (also covers slide transitions). */
  const resetTransform = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = active ? "scale(1)" : "scale(0.94)";
    el.style.transition = "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s ease, box-shadow 0.3s ease";
  };

  // Reset the inline transform whenever the active state flips, so a card
  // that was hovered mid-slide never keeps a stale tilt/scale.
  useEffect(() => {
    resetTransform();
  }, [active]);

  /** Mouse-tracked 3D tilt + spotlight position (skipped for touch/reduced motion). */
  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = cardRef.current;
    if (!el || settingsRef.current.reduced || settingsRef.current.coarse) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--mx", `${(px + 0.5) * 100}%`);
    el.style.setProperty("--my", `${(py + 0.5) * 100}%`);
    el.style.transform = `perspective(1100px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) scale(${active ? 1 : 0.94})`;
    el.style.transition = "transform 0.09s ease-out";
  };

  return (
    <article
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={resetTransform}
      aria-hidden={!active}
      style={
        {
          "--glow": project.accent,
          "--glow-soft": `${project.accent}59`,
        } as CSSProperties
      }
      className={`group relative mx-auto flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-card transition-all duration-500 hover:border-[color:var(--glow)] hover:shadow-[0_28px_80px_-20px_var(--glow-soft),0_0_0_1px_var(--glow-soft)] dark:border-white/10 dark:bg-[#131D30] ${
        active
          ? "scale-100 opacity-100"
          : "pointer-events-none scale-[0.94] opacity-40"
      }`}
    >
      {/* Mouse-follow spotlight tint over the whole card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgba(56, 189, 248, 0.07), transparent 65%)",
        }}
      />

      <ProjectVisual kind={project.visual} accent={project.accent} name={project.name} />

      <div className="flex flex-1 flex-col p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider"
            style={{ background: `${project.accent}1a`, color: project.accent }}
          >
            {project.category}
          </span>
          <span className="rounded-full border-2 border-ink/10 bg-paper px-3 py-1 text-xs font-bold text-ink-soft dark:border-white/15 dark:bg-white/5 dark:text-slate-300">
            {project.tagline}
          </span>
        </div>

        <h3 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl dark:text-white">
          {project.name}
        </h3>

        <p className="mt-2 flex-1 text-sm font-medium leading-relaxed text-ink-faint sm:text-base">
          {hasPlaceholders ? (
            <span className="placeholder-text">{project.description}</span>
          ) : (
            project.description
          )}
        </p>

        {/* Technologies */}
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Technologies">
          {project.tech.map((tech, i) => (
            <li
              key={`${tech}-${i}`}
              className="rounded-lg bg-accent-tint px-2.5 py-1 text-xs font-extrabold text-accent-deep dark:bg-accent/15 dark:text-accent-bright"
            >
              {tech}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onOpen}
            tabIndex={active ? 0 : -1}
            aria-disabled={!active}
            className="btn-primary !px-5 !py-2.5"
            aria-label={`View ${project.name} project details`}
          >
            VIEW PROJECT
            <ArrowRightIcon className="h-4 w-4" />
          </button>

          {/* Direct links to the source / demo when they exist */}
          {(project.links?.repo || project.links?.demo) && (
            <div className="flex items-center gap-2">
              {project.links.repo && (
                <a
                  href={project.links.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={active ? 0 : -1}
                  aria-label={`View ${project.name} source code`}
                  title="View source code"
                  className="btn-icon"
                >
                  <GithubIcon className="h-5 w-5" />
                </a>
              )}
              {project.links.demo && (
                <a
                  href={project.links.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={active ? 0 : -1}
                  aria-label={`Open ${project.name} live demo`}
                  title="Open live demo"
                  className="btn-icon"
                >
                  <ExternalIcon className="h-5 w-5" />
                </a>
              )}
            </div>
          )}

          {hasPlaceholders && (
            <span
              className="hidden items-center gap-1.5 text-[11px] font-bold text-ink-faint sm:flex dark:text-slate-500"
              title="Editable placeholder — update in src/data/projects.ts"
            >
              <PencilIcon className="h-3.5 w-3.5" />
              Edit in src/data/projects.ts
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
