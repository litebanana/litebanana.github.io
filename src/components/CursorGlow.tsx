import { useEffect, useRef } from "react";

/**
 * Soft cyan spotlight that trails the mouse. Fine pointers only (touch
 * devices never activate it), and it stays off under prefers-reduced-motion.
 * The glow lerps toward the cursor each frame for a smooth trailing feel,
 * and fades out when the pointer leaves the window.
 */
export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = glowRef.current;
    if (!el) return;

    const SIZE = 560;
    let x = -SIZE;
    let y = -SIZE;
    let tx = -SIZE;
    let ty = -SIZE;
    let raf = 0;
    let visible = false;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        visible = true;
        x = tx;
        y = ty;
        el.style.opacity = "1";
      }
    };

    const onLeave = () => {
      visible = false;
      el.style.opacity = "0";
    };

    const loop = () => {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      el.style.transform = `translate3d(${x - SIZE / 2}px, ${y - SIZE / 2}px, 0)`;
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[5] rounded-full opacity-0 transition-opacity duration-500"
      style={{
        width: 560,
        height: 560,
        background: "radial-gradient(circle, rgba(56,189,248,0.08), transparent 62%)",
      }}
    />
  );
}
