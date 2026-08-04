import type { Project } from "../data/projects";
import ProjectVisual from "./ProjectVisual";
import { ArrowRightIcon, PencilIcon } from "./Icons";

interface ProjectCardProps {
  project: Project;
  active: boolean;
  onOpen: () => void;
}

export default function ProjectCard({ project, active, onOpen }: ProjectCardProps) {
  return (
    <article
      aria-hidden={!active}
      className={`mx-auto flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-4xl border-2 border-ink/10 bg-white shadow-card transition-all duration-500 dark:border-white/10 dark:bg-[#131D30] ${
        active
          ? "scale-100 opacity-100"
          : "pointer-events-none scale-[0.94] opacity-40"
      }`}
    >
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

        <h3 className="mt-4 font-display text-3xl font-black tracking-tight text-ink sm:text-4xl dark:text-white">
          {project.name}
        </h3>

        <p className="mt-2 flex-1 text-sm font-semibold leading-relaxed text-ink-faint sm:text-base">
          <span className="placeholder-text">{project.description}</span>
        </p>

        {/* Technologies */}
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Technologies">
          {project.tech.map((tech) => (
            <li
              key={tech}
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
          <span
            className="hidden items-center gap-1.5 text-[11px] font-bold text-ink-faint sm:flex dark:text-slate-500"
            title="Editable placeholder — update in src/data/projects.ts"
          >
            <PencilIcon className="h-3.5 w-3.5" />
            Edit in src/data/projects.ts
          </span>
        </div>
      </div>
    </article>
  );
}
