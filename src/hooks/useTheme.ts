import { useEffect, useState } from "react";

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
 * Dark / night mode. Applies the `dark` class to <html>, persists the choice,
 * falls back to the system preference, and keeps the meta theme-color in sync.
 */
export function useTheme() {
  const [dark, setDark] = useState<boolean>(initialDark);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
    try {
      localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
    } catch {
      /* storage unavailable */
    }
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? DARK_BG : LIGHT_BG);
  }, [dark]);

  return {
    dark,
    toggle: () => setDark((d) => !d),
  };
}
