// ---------------------------------------------------------------------------
// PROFESSIONAL EXPERIENCE
// ---------------------------------------------------------------------------

export interface Experience {
  role: string;
  company: string;
  period: string;
  location: string;
  summary: string;
  responsibilities: string[];
}

export const EXPERIENCE: Experience = {
  role: "QA Intern",
  company: "VetAssist",
  period: "June 2026 – Present",
  location: "",
  summary:
    "Worked as a QA Intern helping test and validate a veterinary management platform, identifying UI/UX issues, functional bugs, and feature inconsistencies.",
  responsibilities: [
    "Manual software testing",
    "Test case execution",
    "Bug identification and reporting",
    "Regression testing",
    "UI/UX validation",
    "Jira-based issue tracking",
    "Feature and release validation",
  ],
};
