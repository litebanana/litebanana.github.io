// ---------------------------------------------------------------------------
// TECHNICAL EXPERIENCE
// ---------------------------------------------------------------------------
// Skills with `years` keep Dominic's exact provided values (do not change).
// Skills without `years` are from his resume/hard skills — shown with a
// "used" badge instead of an invented number of years.
// ---------------------------------------------------------------------------

export interface Skill {
  name: string;
  years?: number;
  icon:
    | "python"
    | "ts"
    | "js"
    | "php"
    | "flutter"
    | "dart"
    | "node"
    | "react"
    | "tailwind"
    | "express"
    | "vite"
    | "html"
    | "css"
    | "web"
    | "database"
    | "mongodb"
    | "mysql"
    | "fastapi"
    | "ai"
    | "qa"
    | "pm";
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
      { name: "JavaScript", icon: "js" },
      { name: "PHP", years: 2, icon: "php" },
      { name: "Flutter", years: 2, icon: "flutter" },
      { name: "Dart", years: 2, icon: "dart" },
      { name: "Node.js", icon: "node" },
    ],
  },
  {
    title: "WEB",
    blurb: "Front-end & web development.",
    skills: [
      { name: "HTML", years: 4, icon: "html" },
      { name: "CSS", years: 3, icon: "css" },
      { name: "Web Development", years: 3, icon: "web" },
      { name: "React", icon: "react" },
      { name: "Tailwind CSS", icon: "tailwind" },
      { name: "Express.js", icon: "express" },
      { name: "Vite", icon: "vite" },
    ],
  },
  {
    title: "DATA & AI",
    blurb: "Working with data and machine learning.",
    skills: [
      { name: "Database", years: 2, icon: "database" },
      { name: "AI / Machine Learning", years: 2, icon: "ai" },
      { name: "MongoDB", icon: "mongodb" },
      { name: "MySQL", icon: "mysql" },
      { name: "Python FastAPI", icon: "fastapi" },
    ],
  },
  {
    title: "QA & DELIVERY",
    blurb: "Making sure software actually works before it ships.",
    skills: [
      { name: "Quality Assurance", icon: "qa" },
      { name: "Project Management", icon: "pm" },
    ],
  },
];
