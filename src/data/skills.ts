// ---------------------------------------------------------------------------
// TECHNICAL EXPERIENCE — keep the exact years below (do not change them).
// ---------------------------------------------------------------------------

export interface Skill {
  name: string;
  years: number;
  icon: "python" | "ts" | "php" | "flutter" | "dart" | "html" | "css" | "web" | "database" | "ai";
}

export interface SkillCategory {
  title: string;
  blurb: string;
  skills: Skill[];
}

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    title: "DEVELOPMENT",
    blurb: "Languages & frameworks I build with.",
    skills: [
      { name: "Python", years: 3, icon: "python" },
      { name: "TypeScript", years: 1, icon: "ts" },
      { name: "PHP", years: 2, icon: "php" },
      { name: "Flutter", years: 2, icon: "flutter" },
      { name: "Dart", years: 2, icon: "dart" },
    ],
  },
  {
    title: "WEB",
    blurb: "Front-end foundations & web development.",
    skills: [
      { name: "HTML", years: 4, icon: "html" },
      { name: "CSS", years: 3, icon: "css" },
      { name: "Web Development", years: 3, icon: "web" },
    ],
  },
  {
    title: "DATA & AI",
    blurb: "Working with data and machine learning.",
    skills: [
      { name: "Database", years: 2, icon: "database" },
      { name: "AI / Machine Learning", years: 2, icon: "ai" },
    ],
  },
];
