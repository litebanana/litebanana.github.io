// ---------------------------------------------------------------------------
// ABOUT-ME DATA — education, certifications & soft skills
// ---------------------------------------------------------------------------

export interface EducationEntry {
  school: string;
  program: string;
  period: string;
  current?: boolean;
}

export const EDUCATION: EducationEntry[] = [
  {
    school: "Lyceum of the Philippines University – Cavite",
    program: "Bachelor of Science in Computer Science",
    period: "2023 – Present",
    current: true,
  },
  {
    school: "Our Lady of Remedios Montessori School",
    program: "Senior High School – Information and Communications Technology",
    period: "2020 – 2022",
  },
];

export interface Certification {
  name: string;
  issuer: string;
  year: string;
}

export const CERTIFICATIONS: Certification[] = [
  { name: "Python Essentials 1", issuer: "Cisco Networking Academy", year: "2024" },
  { name: "Python Essentials 2", issuer: "Cisco Networking Academy", year: "2024" },
  { name: "Internet of Things (IoT) Bootcamp", issuer: "ACube Technologies Inc.", year: "2025" },
  { name: "Networking Basics", issuer: "Cisco", year: "2026" },
];

export const SOFT_SKILLS: string[] = [
  "Communication",
  "Teamwork",
  "Problem-Solving",
  "Time Management",
  "Adaptability",
  "Critical Thinking",
];
