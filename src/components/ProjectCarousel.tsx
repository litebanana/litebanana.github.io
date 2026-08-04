import { useCallback, useEffect, useRef, useState } from "react";
import { PROJECTS } from "../data/projects";
import ProjectCard from "./ProjectCard";
import ProjectDetails from "./ProjectDetails";
import { Mascot } from "./Character";
import { ArrowLeftIcon, ArrowRightIcon } from "./Icons";

export default function ProjectCarousel() {
  const [index, setIndex] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cheer, setCheer] = useState(false);
  const [inView, setInView] = useState(false);
  const touchStart = useRef<number | null>(null);
  const regionRef = useRef<HTMLDivElement | null>(null);
  const count = PROJECTS.length;

  const goTo = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count]
  );

  const openDetails = useCallback(() => {
    setDetailsOpen(true);
    // The mascot celebrates briefly when a project is opened
    setCheer(true);
    window.setTimeout(() => setCheer(false), 2800);
  }, []);

  const closeDetails = useCallback(() => setDetailsOpen(false), []);

  // Only listen to keyboard controls while the carousel is on screen
  useEffect(() => {
    const el = regionRef.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Keyboard controls: ← → while the carousel is visible and not typing
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (detailsOpen || !inView) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setIndex((i) => (i + 1) % count);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => (i - 1 + count) % count);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailsOpen, inView, count]);

  // Swipe support on touch devices
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(delta) > 48) {
      if (delta < 0) setIndex((i) => (i + 1) % count);
      else setIndex((i) => (i - 1 + count) % count);
    }
    touchStart.current = null;
  };

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr_auto] lg:gap-4">
      {/* Mascot — points toward the current project */}
      <div className="mx-auto w-32 sm:w-40 lg:w-44">
        <Mascot
          pose={cheer ? "celebrating" : "pointing"}
          looking="right"
          className="w-full"
          ariaLabel="Click to hear from Dominic"
        />
      </div>

      {/* Carousel */}
      <div
        ref={regionRef}
        className="relative min-w-0"
        role="region"
        aria-roledescription="carousel"
        aria-label="Dominic's projects"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="overflow-hidden rounded-4xl">
          <div
            className="carousel-track flex"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {PROJECTS.map((project, i) => (
              <div key={project.id} className="w-full shrink-0 px-1 py-1 sm:px-2">
                <ProjectCard
                  project={project}
                  active={i === index}
                  onOpen={openDetails}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Arrow buttons */}
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label="Previous project"
          className="absolute -left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border-2 border-ink/10 bg-white text-ink shadow-soft transition-all hover:scale-110 hover:border-accent hover:text-accent-deep active:scale-95 sm:-left-5 sm:h-12 sm:w-12 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:text-accent-bright"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label="Next project"
          className="absolute -right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border-2 border-ink/10 bg-white text-ink shadow-soft transition-all hover:scale-110 hover:border-accent hover:text-accent-deep active:scale-95 sm:-right-5 sm:h-12 sm:w-12 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:text-accent-bright"
        >
          <ArrowRightIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Side accent (keeps grid balanced on desktop) */}
      <div className="hidden lg:block lg:w-4" aria-hidden="true" />

      {/* Dots */}
      <div className="col-span-full mt-2 flex items-center justify-center gap-2.5" role="tablist" aria-label="Choose project">
        {PROJECTS.map((project, i) => (
          <button
            key={project.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Show ${project.name}`}
            onClick={() => goTo(i)}
            className={`h-3 rounded-full transition-all duration-300 ${
              i === index
                ? "w-9 bg-accent shadow-pop"
                : "w-3 bg-ink/15 hover:bg-ink/30 dark:bg-white/20 dark:hover:bg-white/40"
            }`}
          />
        ))}
      </div>

      <p className="col-span-full mt-4 text-center text-xs font-bold text-ink-faint">
        Use ← → keys or swipe to browse
      </p>

      <ProjectDetails
        project={PROJECTS[index]}
        open={detailsOpen}
        onClose={closeDetails}
      />
    </div>
  );
}
