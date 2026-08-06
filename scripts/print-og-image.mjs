// ---------------------------------------------------------------------------
// Renders scripts/og-image/og.html → public/og-image.png (1200×630) using
// headless Chrome, so the social-sharing card matches the site's branding.
//
//   Run:            npm run og-image
//   Custom Chrome:  CHROME_PATH="C:\path\to\chrome.exe" npm run og-image
// ---------------------------------------------------------------------------
import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
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
  console.error("Could not find Chrome. Install it or point CHROME_PATH at the executable.");
  process.exit(1);
}

const htmlPath = resolve(here, "og-image", "og.html");
const outPath = resolve(here, "..", "public", "og-image.png");
const fileUrl = "file://" + htmlPath.replace(/\\/g, "/");

execFileSync(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--window-size=1200,630",
    "--virtual-time-budget=10000",
    `--screenshot=${outPath}`,
    fileUrl,
  ],
  { stdio: "inherit" }
);

const { size } = statSync(outPath);
console.log(`Wrote ${outPath} (${size} bytes)`);
