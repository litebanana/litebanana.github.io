// ---------------------------------------------------------------------------
// PROJECTS DATA — edit freely
// ---------------------------------------------------------------------------
// Five projects: FitTrack, DomFi, Backroom Game, Home Inventory, GUBAT, VOID//RUN.
// All fields are filled with real info from Dominic's resume; details marked
// "draft" below were written to be accurate but should be double-checked.
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
  description: string;
  visual: ProjectVisual;
  accent: string; // tailwind-ish hex used for the mockup background
  tech: string[];
  overview: string;
  problem: string;
  solution: string;
  features: string[];
  role: string;
  results: string;
  /** Optional external links — shown as buttons when present. */
  links?: {
    repo?: string; // GitHub / source code URL
    demo?: string; // hosted demo URL
  };
}

export const PROJECTS: Project[] = [
  {
    id: "fittrack",
    name: "FitTrack",
    tagline: "Fitness & Tracking App",
    category: "Mobile App",
    description:
      "A fitness companion app that logs workouts, tracks daily activity, and keeps users consistent with simple goals and streaks.",
    visual: "phone",
    accent: "#0EA5E9",
    tech: ["Flutter", "Dart"],
    links: { repo: "https://github.com/litebanana/fittrack" },
    overview:
      "FitTrack is a mobile fitness companion that helps users log workouts, monitor daily activity, and stay motivated with clear, achievable goals and streak tracking.",
    problem:
      "Most fitness apps are packed with subscriptions and features the average user never touches, which makes staying consistent harder instead of easier.",
    solution:
      "FitTrack keeps things simple: a clean workout log, an at-a-glance activity dashboard, and goal streaks that make showing up every day feel rewarding.",
    features: [
      "Workout logging with exercise history",
      "Daily activity & step tracking",
      "Goal setting with streak reminders",
    ],
    role: "UI design, app logic, and state management in Flutter, plus local data persistence for workout history.",
    results:
      "Delivered a polished, working mobile app and learned how to structure a real Flutter project with clean state management and data storage.",
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
    links: { repo: "https://github.com/litebanana/DomFi" },
    overview:
      "Full-stack personal finance application that helps users manage budgets, track expenses, monitor savings goals, and analyze spending habits with AI-assisted insights.",
    problem:
      "Personal finances are scattered across bank accounts, cash, and subscriptions, and most existing tools are either too basic or too corporate to actually use.",
    solution:
      "DomFi brings budgeting, expense tracking, savings goals, and spending analysis into one full-stack app, with AI-powered insights that help users understand their habits.",
    features: [
      "Budget management across categories",
      "Expense tracking with transaction history",
      "Savings goal monitoring",
      "Spending habit analytics",
    ],
    role: "Full-stack development: React front-end, Node.js API, MongoDB data model, and AI feature integration.",
    results:
      "Built and shipped a complete full-stack finance application, strengthening end-to-end development, API design, and data modeling skills.",
  },
  {
    id: "backroom-game",
    name: "Backroom Game",
    tagline: "Short Horror Exploration Game",
    category: "Game",
    description:
      "A short horror exploration game that drops the player into an eerie, endless corridor and dares them to find the way out.",
    visual: "game",
    accent: "#64748B",
    tech: ["HTML", "CSS", "JavaScript"],
    links: {
      repo: "https://github.com/litebanana/backroom-game",
      demo: "/games/backroom/",
    },
    overview:
      "The Backroom Game is a short horror exploration experience built around the feeling of being lost in an endless, dimly lit corridor. The player walks, explores, and searches for the exit while the atmosphere does the scaring.",
    problem:
      "Creating genuine tension in a simple game without jump scares, expensive 3D models, or a large budget.",
    solution:
      "Atmosphere over assets: low-light visuals, a looping corridor layout, ambient audio cues, and an ominous emptiness that keeps the player on edge.",
    features: [
      "Endless corridor exploration",
      "Atmospheric lighting & audio",
      "Simple, immediate controls",
    ],
    role: "Game logic, player movement, level flow, and playtesting.",
    results:
      "Delivered a playable horror prototype and learned how pacing, environment design, and sound create tension.",
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
    links: { repo: "https://github.com/litebanana/home-inventory" },
    overview:
      "Mobile inventory management system that enables users to track household assets, warranties, receipts, and documents in one searchable place.",
    problem:
      "Household assets, warranties, and receipts end up scattered across drawers and emails, making claims and replacements painful when something breaks.",
    solution:
      "Home Inventory is a mobile catalog for everything you own: log items, attach warranty and receipt details, and keep supporting documents in one place.",
    features: [
      "Household asset catalog",
      "Warranty & receipt tracking",
      "Document & photo storage",
      "Searchable item categories",
    ],
    role: "App design and Flutter development, the MongoDB data layer, and testing.",
    results:
      "Shipped a working inventory manager and gained hands-on experience connecting a Flutter app to a cloud database.",
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
    problem:
      "SMS spam is a widespread problem in the Philippines, but many filters are trained on English-only datasets and miss the localized Taglish messages people actually receive.",
    solution:
      "GUBAT classifies SMS messages as spam or legitimate using a Random Forest model trained on a Taglish dataset, packaged as a simple Android app.",
    features: [
      "On-device SMS spam classification",
      "Random Forest model trained on localized Taglish data",
      "Simple Android interface for instant results",
    ],
    role: "Dataset preparation, model training and evaluation, and Android app integration.",
    results:
      "Delivered a working ML-powered Android app and learned the end-to-end machine learning pipeline, from raw data to a deployed model.",
  },
  {
    id: "voidrun",
    name: "VOID//RUN",
    tagline: "2D Pixel-Art Dungeon Roguelite",
    category: "Game",
    description:
      "A complete 2D pixel-art dungeon roguelite built from scratch in vanilla JavaScript. Fight through procedurally generated rooms, collect upgrades, and defeat THE NULL WARDEN.",
    visual: "game",
    accent: "#7C3AED",
    tech: ["HTML", "CSS", "JavaScript"],
    links: {
      repo: "https://github.com/litebanana/voidrun",
      demo: "/games/voidrun/",
    },
    overview:
      "VOID//RUN is a fast, readable dungeon roguelite with a pixel-art aesthetic rendered natively at full HD. You are Black Rabbit, a dungeon delver who falls into a corrupted dungeon and must fight waves of monsters, level up with build-defining upgrades, and break THE NULL WARDEN in a multi-phase boss fight.",
    problem:
      "Building a complete roguelite with tight combat, meaningful upgrades, and a boss fight without relying on external game engines or libraries.",
    solution:
      "A zero-dependency vanilla JavaScript engine with data-driven weapons, enemies, upgrades, and wave budgets, plus procedural room generation and WebAudio synthesis for sound.",
    features: [
      "4 data-driven weapons with distinct playstyles",
      "5 enemy archetypes with modular state-machine AI",
      "25 in-run upgrades across 4 rarities",
      "Multi-phase boss fight with telegraphed attacks",
      "Procedural dungeon generation with 9 rooms",
      "Permanent progression via Void Shards meta shop",
    ],
    role: "Solo development: engine architecture, gameplay systems, procedural generation, combat, UI, audio synthesis, and pixel-art rendering.",
    results:
      "Delivered a fully playable, polished roguelite in pure vanilla JS and learned how data-driven design, state machines, and game feel systems combine to create an engaging player experience.",
  },
];
