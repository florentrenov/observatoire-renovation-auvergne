import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { SITE_ROOT } from "./site-utils.mjs";

const pages = [
  "index.html",
  "etudes-de-cas/index.html",
  "recherche/index.html",
  "veille/index.html",
  "a-propos/index.html",
  "etudes-de-cas/pdd-001-la-fayette/index.html",
];

const viewports = [
  [390, 844],
  [430, 932],
  [768, 1024],
  [1024, 768],
  [1366, 768],
];

const outputRoot = path.resolve(SITE_ROOT, "..", "tmp", "visual-check");
mkdirSync(outputRoot, { recursive: true });

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch (error) {
  console.warn("Playwright n'est pas installé dans ce projet. Contrôle visuel ignoré localement.");
  console.warn("Installer Playwright dans le dépôt canonique ou exécuter les tests navigateur via l'environnement Codex.");
  process.exit(0);
}
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const browser = await chromium.launch({ headless: true, executablePath: edge });
const results = [];

for (const pagePath of pages) {
  for (const [width, height] of viewports) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    const jsErrors = [];
    page.on("pageerror", (error) => jsErrors.push(error.message));
    await page.goto(pathToFileURL(path.join(SITE_ROOT, pagePath)).href, { waitUntil: "load" });
    await page.waitForTimeout(250);
    const metrics = await page.evaluate(() => ({
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
      badText: /undefined|NaN|null/.test(document.body.innerText),
      h1Count: document.querySelectorAll("h1").length,
    }));
    const safeName = `${pagePath.replace(/[\/\\]/g, "__")}-${width}x${height}.png`;
    await page.screenshot({ path: path.join(outputRoot, safeName), fullPage: true });
    results.push({ page: pagePath, viewport: `${width}x${height}`, ...metrics, jsErrors, screenshot: safeName });
    await page.close();
  }
}

await browser.close();

writeFileSync(path.join(outputRoot, "visual-check-results.json"), `${JSON.stringify(results, null, 2)}\n`, "utf8");
const failures = results.filter((item) => item.overflow > 2 || item.badText || item.h1Count !== 1 || item.jsErrors.length);
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  throw new Error(`${failures.length} échec(s) visuel(s)`);
}
console.log(`Captures visuelles OK: ${results.length} captures dans ${outputRoot}`);
