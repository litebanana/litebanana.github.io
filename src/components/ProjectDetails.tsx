import { useEffect, useRef } from "react";
import type { Project } from "../data/projects";
import ProjectVisual from "./ProjectVisual";
import { CloseIcon, PencilIcon } from "./Icons";

interface ProjectDetailsProps {
  project: Project;
  open: boolean;
  onClose: () => void;
}

export default function ProjectDetails({ project, open, onClose }: ProjectDetailsProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  // Keyboard: Escape closes; trap focus while open
  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lastFocused.current?.focus();
    };
  }, [open, onClose]);

  // Lock background scroll while open
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-detail-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close project details"
        onClick={onClose}
        className="absolute inset-0 cursor-default animate-fade-in bg-ink/50 backdrop-blur-sm"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative z-10 max-h-[92vh] w-full max-w-3xl animate-pop-in overflow-y-auto rounded-t-4xl border-2 border-ink/10 bg-paper shadow-lift sm:rounded-4xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-ink/10 bg-paper/95 px-6 py-4 backdrop-blur-sm sm:px-8">
          <div className="flex items-center gap-3">
            <span
              className="rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider"
              style={{ background: `${project.accent}1a`, color: project.accent }}
            >
              {project.category}
            </span>
            <h3 id="project-detail-title" className="font-display text-xl font-black text-ink sm:text-2xl">
              {project.name}
            </h3>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close project details"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-ink/10 bg-white text-ink transition hover:border-accent hover:text-accent-deep active:scale-90"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <ProjectVisual kind={project.visual} accent={project.accent} name={project.name} />

          {/* Overview */}
          <Section label="Overview">
            <p className="text-sm font-semibold leading-relaxed text-ink-soft sm:text-base">
              <span className="placeholder-text">{project.overview}</span>
            </p>
          </Section>

          {/* Problem & Solution */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border-2 border-ink/10 bg-white p-5">
              <h4 className="mb-2 font-display text-sm font-black uppercase tracking-wider text-ink">
                ⚠️ Problem
              </h4>
              <p className="text-sm font-semibold leading-relaxed text-ink-faint">
                <span className="placeholder-text">{project.problem}</span>
              </p>
            </div>
            <div className="rounded-2xl border-2 border-ink/10 bg-white p-5">
              <h4 className="mb-2 font-display text-sm font-black uppercase tracking-wider text-ink">
                💡 Solution
              </h4>
              <p className="text-sm font-semibold leading-relaxed text-ink-faint">
                <span className="placeholder-text">{project.solution}</span>
              </p>
            </div>
          </div>

          {/* Key features */}
          <Section label="Key Features">
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {project.features.map((feature, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-xl border-2 border-ink/5 bg-white px-3.5 py-2.5 text-sm font-bold text-ink-soft"
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-tint text-[10px] font-black text-accent-deep">
                    ✓
                  </span>
                  <span className="placeholder-text">{feature}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Technologies */}
          <Section label="Technologies">
            <ul className="flex flex-wrap gap-2">
              {project.tech.map((tech) => (
                <li
                  key={tech}
                  className="rounded-xl border-2 border-ink/10 bg-white px-3.5 py-2 text-sm font-extrabold text-accent-deep"
                >
                  {tech}
                </li>
              ))}
            </ul>
          </Section>

          {/* My role & results */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border-2 border-ink/10 bg-white p-5">
              <h4 className="mb-2 font-display text-sm font-black uppercase tracking-wider text-ink">
                👤 My Role
              </h4>
              <p className="text-sm font-semibold leading-relaxed text-ink-faint">
                <span className="placeholder-text">{project.role}</span>
              </p>
            </div>
            <div className="rounded-2xl border-2 border-ink/10 bg-white p-5">
              <h4 className="mb-2 font-display text-sm font-black uppercase tracking-wider text-ink">
                📈 Results / Outcome
              </h4>
              <p className="text-sm font-semibold leading-relaxed text-ink-faint">
                <span className="placeholder-text">{project.results}</span>
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-2 rounded-xl border border-dashed border-ink/20 bg-ink/[0.02] px-4 py-3 text-xs font-bold text-ink-faint">
            <PencilIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              This is an editable placeholder. Replace the [PLACEHOLDER] fields with
              real details in <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px]">src/data/projects.ts</code>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h4 className="mb-2.5 font-display text-sm font-black uppercase tracking-wider text-ink">
        {label}
      </h4>
      {children}
    </div>
  );
}
