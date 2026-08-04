# Dominic Torres — Portfolio

A modern, responsive, playful personal portfolio website for **Dominic Torres** — Computer Science Student, Developer, QA Tester, and AI Enthusiast.

Built with **React + TypeScript + Vite + Tailwind CSS** and designed to be deployed **completely free on GitHub Pages** as a static site.

![Stack](https://img.shields.io/badge/React-18-0EA5E9) ![Stack](https://img.shields.io/badge/TypeScript-5.6-0284C7) ![Stack](https://img.shields.io/badge/Tailwind-3-38BDF8) ![Deploy](https://img.shields.io/badge/GitHub%20Pages-ready-22C55E)

---

## ✨ Features

- **Original illustrated mascot** — a chibi-style boy character (Dominic) built in pure SVG. Different poses per section (standing, waving, pointing, thinking, celebrating, sitting, laptop), subtle idle animations, and a small click easter egg (try clicking him 👋).
- **Interactive project carousel** — arrows, dots, **keyboard ← →**, and **swipe** on mobile. Opens a clean case-study modal per project.
- **Experience timeline** — QA Intern at VetAssist with an expandable responsibilities card.
- **Technical experience cards** — real years of experience (no fake percentage bars), organized into Development / Web / Data & AI.
- **About, Contact & Footer** — resume buttons, email / GitHub / LinkedIn links.
- Fully **responsive**, accessible (semantic HTML, focus states, `prefers-reduced-motion`), and lightweight (zero runtime UI dependencies).

## 🚀 Getting started

```bash
npm install     # install dependencies
npm run dev     # local dev server → http://localhost:5173
npm run build   # production build → dist/
npm run preview # preview the production build locally
```

## ☁️ Deploying to GitHub Pages

### Option A — GitHub Actions (recommended, automated)

A ready-to-use workflow is included at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Every push to `main` builds the site and publishes it.

1. Create a repository and push this project to `main`.
2. Go to **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. That's it — the next push (or a manual "Run workflow") deploys the site.

Your site will be live at:
- **`https://<username>.github.io/`** if the repository is named `<username>.github.io`, or
- **`https://<username>.github.io/<repo>/`** for any other repository name.

### Option B — Manual (dist → gh-pages branch)

```bash
npm run build
npx gh-pages -d dist
```

> The Vite config uses a **relative base (`./`)**, so the built site works at any
> sub-path — no absolute localhost paths, no hard-coded `/` paths anywhere.

## ✏️ Editing your content

All content lives in a few easy-to-edit files:

| File | What it holds |
| --- | --- |
| `src/data/projects.ts` | The four projects (FitTrack, DomFi, Backroom Game, Home Inventory) with clearly-marked `[PLACEHOLDER]` fields |
| `src/data/skills.ts` | Technical experience (keep the exact year values) |
| `src/data/experience.ts` | The QA Intern / VetAssist experience |
| `src/data/links.ts` | **Email, GitHub, LinkedIn, resume links** |

Notes:

- Unfilled fields show as clearly styled editable placeholders — nothing is fabricated.
- Project mockups in the carousel are **illustrative sketches** (`src/components/ProjectVisual.tsx`), not real screenshots. Swap in real screenshots whenever you like (e.g. drop images in `public/images/` and use them in `ProjectVisual`).
- Want to change the character? It's a pure SVG component at `src/components/Character.tsx` — colors, poses and animations are all right there.

## 📁 Project structure

```
├── .github/workflows/deploy.yml   # GitHub Pages deployment
├── public/
│   ├── favicon.svg
│   └── images/                    # drop project images / resume.pdf here
├── src/
│   ├── components/
│   │   ├── Navbar.tsx             # sticky nav + mobile menu + scroll-spy
│   │   ├── Hero.tsx
│   │   ├── Character.tsx          # SVG mascot + poses + easter egg
│   │   ├── ProjectCarousel.tsx    # carousel (keys / swipe / dots)
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectDetails.tsx     # case-study modal
│   │   ├── ProjectVisual.tsx      # illustrative mockups
│   │   ├── Experience.tsx         # experience timeline
│   │   ├── Skills.tsx / SkillCard.tsx / SkillIcon.tsx
│   │   ├── About.tsx
│   │   ├── Contact.tsx
│   │   ├── Footer.tsx
│   │   ├── Section.tsx / Reveal.tsx / FloatingShape.tsx / Icons.tsx
│   ├── data/                      # projects, skills, experience, links
│   ├── App.tsx
│   └── main.tsx
└── ...config files
```

## ♿ Accessibility & performance

- Semantic landmarks, keyboard-operable carousel, focus trap in the modal, `aria` labels throughout.
- All animations respect `prefers-reduced-motion`.
- No heavy dependencies, no external image requests — the mascot and icons are inline SVG.

---

© 2026 Dominic Torres
