// ---------------------------------------------------------------------------
// PROFESSIONAL EXPERIENCE — add more entries to the array to grow the timeline.
// ---------------------------------------------------------------------------

export interface Experience {
  id: string;
  role: string;
  company: string;
  period: string;
  location: string;
  summary: string;
  responsibilities: string[];
}

export const EXPERIENCE: Experience[] = [
  {
    id: "vetassist-qa",
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
  },
  {
    id: "iot-bootcamp",
    role: "IoT Bootcamp Trainee",
    company: "ACube Technologies Inc.",
    period: "2025",
    location: "",
    summary:
      "Completed a hands-on Internet of Things bootcamp, building connected device projects and learning how hardware, sensors, and software work together.",
    responsibilities: [
      "IoT fundamentals and embedded systems",
      "Sensor integration and data collection",
      "Hardware-software interfacing",
      "Hands-on project development",
    ],
  },
];
