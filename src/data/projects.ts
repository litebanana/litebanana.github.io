// ---------------------------------------------------------------------------
// PROJECTS DATA — edit freely
// ---------------------------------------------------------------------------
// Only the four projects below should exist. Descriptions, technologies,
// features and results are marked as [PLACEHOLDER] — replace each one with
// real details. The `visual` field picks a decorative mockup illustration:
//   "phone" | "browser" | "game" | "tablet"
// ---------------------------------------------------------------------------

export type ProjectVisual = "phone" | "browser" | "game" | "tablet";

export interface Project {
  id: string;
  name: string;
  tagline: string;
  category: string;
  description: string; // [PROJECT DESCRIPTION]
  visual: ProjectVisual;
  accent: string; // tailwind-ish hex used for the mockup background
  tech: string[]; // [TECHNOLOGIES]
  overview: string; // [PROJECT OVERVIEW]
  problem: string; // [PROBLEM]
  solution: string; // [SOLUTION]
  features: string[]; // [KEY FEATURES]
  role: string; // [MY ROLE]
  results: string; // [RESULTS / OUTCOME]
}

export const PROJECTS: Project[] = [
  {
    id: "fittrack",
    name: "FitTrack",
    tagline: "Fitness & Tracking App",
    category: "Mobile App",
    description: "[PROJECT DESCRIPTION — add a short pitch for FitTrack here]",
    visual: "phone",
    accent: "#0EA5E9",
    tech: ["[TECHNOLOGY]", "[TECHNOLOGY]", "[TECHNOLOGY]"],
    overview:
      "[PROJECT OVERVIEW — what is FitTrack, who is it for, and what does it do?]",
    problem:
      "[PROBLEM — describe the problem the app was built to solve.]",
    solution:
      "[SOLUTION — describe how FitTrack solves the problem.]",
    features: [
      "[KEY FEATURE 1 — e.g. activity tracking]",
      "[KEY FEATURE 2 — e.g. goal setting]",
      "[KEY FEATURE 3 — e.g. progress history]",
    ],
    role: "[MY ROLE — e.g. UI development, state management, testing]",
    results:
      "[RESULTS / OUTCOME — e.g. what was delivered, what was learned]",
  },
  {
    id: "domfi",
    name: "DomFi",
    tagline: "Personal Finance Dashboard",
    category: "Web App",
    description: "[PROJECT DESCRIPTION — add a short pitch for DomFi here]",
    visual: "browser",
    accent: "#06B6D4",
    tech: ["[TECHNOLOGY]", "[TECHNOLOGY]", "[TECHNOLOGY]"],
    overview:
      "[PROJECT OVERVIEW — what is DomFi, who is it for, and what does it do?]",
    problem: "[PROBLEM — describe the problem DomFi was built to solve.]",
    solution: "[SOLUTION — describe how DomFi solves the problem.]",
    features: [
      "[KEY FEATURE 1 — e.g. expense tracking]",
      "[KEY FEATURE 2 — e.g. monthly summaries]",
      "[KEY FEATURE 3 — e.g. budgeting views]",
    ],
    role: "[MY ROLE — e.g. front-end development, data handling, QA]",
    results:
      "[RESULTS / OUTCOME — e.g. what was delivered, what was learned]",
  },
  {
    id: "backroom-game",
    name: "Backroom Game",
    tagline: "Short Horror Exploration Game",
    category: "Game",
    description:
      "[PROJECT DESCRIPTION — add a short pitch for the Backroom Game here]",
    visual: "game",
    accent: "#64748B",
    tech: ["[TECHNOLOGY]", "[TECHNOLOGY]", "[TECHNOLOGY]"],
    overview:
      "[PROJECT OVERVIEW — what is the Backroom Game and what did it explore?]",
    problem:
      "[PROBLEM — describe the creative or technical problem being explored.]",
    solution: "[SOLUTION — describe how the game was designed and built.]",
    features: [
      "[KEY FEATURE 1 — e.g. exploration levels]",
      "[KEY FEATURE 2 — e.g. atmosphere & audio]",
      "[KEY FEATURE 3 — e.g. simple interactions]",
    ],
    role: "[MY ROLE — e.g. game logic, level design, testing]",
    results:
      "[RESULTS / OUTCOME — e.g. what was delivered, what was learned]",
  },
  {
    id: "home-inventory",
    name: "Home Inventory",
    tagline: "Household Inventory Tracker",
    category: "App",
    description:
      "[PROJECT DESCRIPTION — add a short pitch for Home Inventory here]",
    visual: "tablet",
    accent: "#22C55E",
    tech: ["[TECHNOLOGY]", "[TECHNOLOGY]", "[TECHNOLOGY]"],
    overview:
      "[PROJECT OVERVIEW — what is Home Inventory, who is it for, and what does it do?]",
    problem:
      "[PROBLEM — describe the problem the app was built to solve.]",
    solution: "[SOLUTION — describe how Home Inventory solves the problem.]",
    features: [
      "[KEY FEATURE 1 — e.g. item catalog]",
      "[KEY FEATURE 2 — e.g. categories & search]",
      "[KEY FEATURE 3 — e.g. quantity tracking]",
    ],
    role: "[MY ROLE — e.g. app design, database, testing]",
    results:
      "[RESULTS / OUTCOME — e.g. what was delivered, what was learned]",
  },
];
