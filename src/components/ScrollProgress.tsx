import { useEffect, useRef } from "react";

/**
 * Thin reading-progress bar pinned to the very top of the viewport
 * (above the navbar). rAF-throttled so it stays cheap on scroll.
 */
export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const pct = max > 0 ? Math.min(100, (doc.scrollTop / max) * 100) : 0;
      if (barRef.current) barRef.current.style.width = `${pct}%`;
      raf = 0;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-0 z-[60] h-[3px]">
      <div
        ref={barRef}
        className="h-full bg-gradient-to-r from-accent to-accent-deep shadow-[0_0_10px_rgba(14,165,233,0.55)]"
        style={{ width: "0%" }}
      />
    </div>
  );
}
