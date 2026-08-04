import { useEffect, useState } from "react";
import { CloseIcon, MenuIcon, MoonIcon, SunIcon } from "./Icons";
import { useTheme } from "../hooks/useTheme";

const NAV_ITEMS = [
  { label: "Home", href: "#home" },
  { label: "Projects", href: "#projects" },
  { label: "Experience", href: "#experience" },
  { label: "Skills", href: "#skills" },
  { label: "About", href: "#about" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");
  const { dark, toggle } = useTheme();

  // Elevate the bar once the page is scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-spy: highlight the section currently in view
  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.href.slice(1)));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => s && observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Close the mobile menu when resizing up to desktop
  useEffect(() => {
    const onResize = () => window.innerWidth >= 768 && setOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function navigate(href: string) {
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  }

  const themeButton = (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="grid h-11 w-11 place-items-center rounded-xl border-2 border-ink/10 bg-white text-ink transition hover:border-accent hover:text-accent-deep active:scale-90 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:text-accent-bright"
    >
      {dark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-ink/10 bg-paper/85 shadow-soft backdrop-blur-md dark:border-white/10 dark:bg-[#0B1220]/85 dark:shadow-black/40"
          : "bg-transparent"
      }`}
    >
      <nav className="container-site flex h-16 items-center justify-between gap-4 sm:h-20" aria-label="Main navigation">
        {/* Logo */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            navigate("#home");
          }}
          className="flex items-center gap-2 font-display text-sm font-black tracking-wide text-ink dark:text-white sm:text-base"
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-xs font-black text-white shadow-pop">
            D
          </span>
          DOMINIC TORRES
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.href);
              }}
              aria-current={active === item.href.slice(1) ? "page" : undefined}
              className={`rounded-xl px-4 py-2 text-sm font-extrabold transition-colors ${
                active === item.href.slice(1)
                  ? "bg-accent/10 text-accent-deep dark:bg-accent/20 dark:text-accent-bright"
                  : "text-ink-soft hover:bg-ink/5 hover:text-ink dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              }`}
            >
              {item.label}
            </a>
          ))}
          <div className="ml-2 flex items-center gap-2">
            {themeButton}
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                navigate("#contact");
              }}
              className="btn-primary !px-5 !py-2.5"
            >
              CONTACT
            </a>
          </div>
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          {themeButton}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid h-11 w-11 place-items-center rounded-xl border-2 border-ink/10 bg-white text-ink transition hover:border-accent md:hidden dark:border-white/15 dark:bg-white/10 dark:text-slate-200"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col bg-paper px-6 pt-6 pb-10 transition-all duration-300 md:hidden dark:bg-[#0B1220] ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {NAV_ITEMS.map((item, i) => (
          <a
            key={item.href}
            href={item.href}
            onClick={(e) => {
              e.preventDefault();
              navigate(item.href);
            }}
            style={{ transitionDelay: open ? `${i * 40}ms` : "0ms" }}
            className={`border-b border-ink/5 py-4 font-display text-2xl font-black text-ink transition-all duration-300 dark:border-white/10 dark:text-white ${
              open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
          >
            {item.label}
          </a>
        ))}
        <a
          href="#contact"
          onClick={(e) => {
            e.preventDefault();
            navigate("#contact");
          }}
          className="btn-primary mt-8 w-full !py-4 text-base"
        >
          CONTACT
        </a>
        <p className="mt-auto text-center text-sm font-bold text-ink-faint dark:text-slate-400">
          © 2026 Dominic Torres
        </p>
      </div>
    </header>
  );
}
