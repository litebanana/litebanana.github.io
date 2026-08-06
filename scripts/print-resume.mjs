// ---------------------------------------------------------------------------
// Renders scripts/resume/resume.html → public/resume.pdf using headless
// Chrome, so the resume keeps the site's fonts and styling.
//
//   Run:            npm run resume
//   Custom Chrome:  CHROME_PATH="C:\path\to\chrome.exe" npm run resume
//
// Edit the HTML source, then re-run — the PDF is regenerated in place.
// ---------------------------------------------------------------------------
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const CANDIDATES = [
  process.env.CHROME_PATH,
  // Windows
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  process.env.LOCALAPPDATA
    ? join(process.env.LOCALAPPDATA, "Google\\Chrome\\Application\\chrome.exe")
    : undefined,
  // macOS
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  // Linux
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

const chrome = CANDIDATES.find((c) => existsSync(c));

if (!chrome) {
  console.error(
    "Could not find Chrome. Install it or point CHROME_PATH at the executable."
  );
  process.exit(1);
}

const htmlPath = resolve(here, "resume", "resume.html");
const outPath = resolve(here, "..", "public", "resume.pdf");
const fileUrl = "file://" + htmlPath.replace(/\\/g, "/");

// --virtual-time-budget lets the Google Fonts stylesheet finish loading
// before the page is printed. --no-pdf-header-footer drops Chrome's
// default page numbers/URL chrome.
execFileSync(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    "--virtual-time-budget=10000",
    `--print-to-pdf=${outPath}`,
    fileUrl,
  ],
  { stdio: "inherit" }
);

console.log(`Wrote ${outPath}`);
