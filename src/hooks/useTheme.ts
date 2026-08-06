import { useEffect, useRef, useState } from "react";

const LIGHT_BG = "#F6FAFD";
const DARK_BG = "#0B1220";
const STORAGE_KEY = "theme";

function initialDark(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark") return true;
    if (stored === "light") return false;
  } catch {
    /* storage unavailable */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Dark / night mode. Applies the `dark` class to <html>, falls back to the
 * system preference, and keeps the meta theme-color in sync.
 *
 * The user's choice is persisted only after they toggle explicitly — until
 * then the site keeps following the OS, even if it changes while the page
 * is open.
 */
export function useTheme() {
  const [dark, setDark] = useState<boolean>(initialDark);
  const explicitRef = useRef(false);

  // A stored theme from a previous visit counts as an explicit choice, so
  // later OS changes won't silently override it.
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) explicitRef.current = true;
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
    if (explicitRef.current) {
      try {
        localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
      } catch {
        /* storage unavailable */
      }
    }
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? DARK_BG : LIGHT_BG);
  }, [dark]);

  // Follow live OS theme changes until the user picks a theme explicitly.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      if (!explicitRef.current) setDark(e.matches);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return {
    dark,
    toggle: () => {
      explicitRef.current = true;
      setDark((d) => !d);
    },
  };
}
