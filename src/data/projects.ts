// ---------------------------------------------------------------------------
// PROJECTS DATA — edit freely
// ---------------------------------------------------------------------------
// Five projects: FitTrack, DomFi, Backroom Game, Home Inventory, GUBAT.
// DomFi, Home Inventory and GUBAT are filled with real info from Dominic's
// resume. Fields marked [PLACEHOLDER] are still waiting for real details.
//
// The `visual` field picks a decorative mockup illustration:
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
    tagline: "AI-Powered Personal Finance Management System",
    category: "Web App",
    description:
      "Full-stack personal finance app to manage budgets, track expenses, monitor savings goals, and analyze spending habits.",
    visual: "browser",
    accent: "#06B6D4",
    tech: ["Node.js", "React", "MongoDB"],
    overview:
      "Full-stack personal finance application that helps users manage budgets, track expenses, monitor savings goals, and analyze spending habits.",
    problem: "[PROBLEM — describe the problem DomFi was built to solve.]",
    solution: "[SOLUTION — describe how DomFi solves the problem.]",
    features: [
      "[KEY FEATURE 1 — e.g. budget management]",
      "[KEY FEATURE 2 — e.g. expense tracking]",
      "[KEY FEATURE 3 — e.g. spending analytics]",
    ],
    role: "[MY ROLE — e.g. front-end development, backend, AI integration]",
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
    tagline: "Smart Home Asset & Warranty Manager",
    category: "Mobile App",
    description:
      "Mobile inventory management system for tracking household assets, warranties, receipts, and documents.",
    visual: "tablet",
    accent: "#22C55E",
    tech: ["Flutter", "Dart", "MongoDB"],
    overview:
      "Mobile inventory management system that enables users to track household assets, warranties, receipts, and documents.",
    problem:
      "[PROBLEM — describe the problem the app was built to solve.]",
    solution: "[SOLUTION — describe how Home Inventory solves the problem.]",
    features: [
      "[KEY FEATURE 1 — e.g. asset catalog]",
      "[KEY FEATURE 2 — e.g. warranty & receipt tracking]",
      "[KEY FEATURE 3 — e.g. document storage]",
    ],
    role: "[MY ROLE — e.g. app design, database, testing]",
    results:
      "[RESULTS / OUTCOME — e.g. what was delivered, what was learned]",
  },
  {
    id: "gubat",
    name: "GUBAT",
    tagline: "Random Forest SMS Spam Filter",
    category: "AI / Machine Learning",
    description:
      "ML-powered Android app that detects SMS spam using a Random Forest classifier trained on a localized Taglish dataset.",
    visual: "phone",
    accent: "#8B5CF6",
    tech: ["Python", "Machine Learning", "Android"],
    overview:
      "Machine learning-powered Android application for detecting SMS spam using a Random Forest classifier trained on a localized Filipino-English (Taglish) dataset.",
    problem: "[PROBLEM — describe the SMS spam problem being solved.]",
    solution: "[SOLUTION — describe how the classifier was built and deployed.]",
    features: [
      "[KEY FEATURE 1 — e.g. spam detection]",
      "[KEY FEATURE 2 — e.g. localized Taglish dataset]",
      "[KEY FEATURE 3 — e.g. Android app integration]",
    ],
    role: "[MY ROLE — e.g. model training, app development, testing]",
    results:
      "[RESULTS / OUTCOME — e.g. accuracy achieved, what was learned]",
  },
];
