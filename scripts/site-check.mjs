import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import vm from "node:vm";
import {
  FORBIDDEN_HEADER_LABELS,
  PUBLIC_NAV,
  SITE_ROOT,
  activeSectionFor,
  decodeEntities,
  extractAttribute,
  htmlFiles,
  isInternalLab,
  localHrefTarget,
  readUtf8,
  relativeToSite,
  textFiles,
} from "./site-utils.mjs";

const checks = [];

function addCheck(name, inspected, failures = [], warnings = []) {
  checks.push({ name, inspected, failures, warnings });
}

function normalizeLabel(value) {
  return decodeEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function anchorsIn(html) {
  return new Set([...html.matchAll(/\sid=["']([^"']+)["']/gi)].map((match) => match[1]));
}

function runEncodingCheck() {
  const failures = [];
  const suspicious = ["Ãƒ", "Ã‚", "Ã¢â‚¬", "Ã°Å¸", "ï¿½", "\uFFFD"];
  for (const file of textFiles()) {
    const rel = relativeToSite(file);
    const bytes = readFileSync(file);
    if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
      failures.push(`${rel}: BOM UTF-8 détecté`);
    }
    const text = bytes.toString("utf8");
    for (const pattern of suspicious) {
      if (text.includes(pattern)) failures.push(`${rel}: motif suspect ${pattern}`);
    }
    if (file.endsWith(".html")) {
      const charsetMatches = [...text.matchAll(/<meta\s+charset=["']([^"']+)["']\s*>/gi)];
      if (charsetMatches.length !== 1) {
        failures.push(`${rel}: ${charsetMatches.length} balise(s) meta charset`);
      } else if (charsetMatches[0][1] !== "UTF-8") {
        failures.push(`${rel}: charset ${charsetMatches[0][1]} au lieu de UTF-8`);
      }
      const headStart = text.search(/<head\b/i);
      const charsetPos = text.search(/<meta\s+charset=["']UTF-8["']\s*>/i);
      if (headStart < 0 || charsetPos < 0 || charsetPos - headStart > 300) {
        failures.push(`${rel}: charset absent ou trop tardif dans <head>`);
      }
      const httpEquiv = text.match(/http-equiv=["']content-type["']/i);
      if (httpEquiv) failures.push(`${rel}: charset contradictoire via http-equiv`);
    }
  }
  addCheck("encoding", textFiles().length, failures);
}

function runNavigationCheck() {
  const failures = [];
  for (const file of htmlFiles()) {
    const rel = relativeToSite(file);
    if (isInternalLab(rel)) continue;
    const html = readUtf8(file);
    const navMatches = [...html.matchAll(/<nav\b[^>]*class=["'][^"']*\bnav-links\b[^"']*["'][^>]*>([\s\S]*?)<\/nav>/gi)];
    if (navMatches.length !== 1) {
      failures.push(`${rel}: ${navMatches.length} navigation(s) principale(s)`);
      continue;
    }
    const navHtml = navMatches[0][1];
    const labels = [...navHtml.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)].map((match) => normalizeLabel(match[1]));
    if (labels.join("|") !== PUBLIC_NAV.join("|")) {
      failures.push(`${rel}: navigation ${JSON.stringify(labels)}`);
    }
    for (const forbidden of FORBIDDEN_HEADER_LABELS) {
      if (labels.includes(forbidden)) failures.push(`${rel}: ${forbidden} présent dans le header`);
    }
    const activeExpected = activeSectionFor(rel);
    const activeMatches = [...navHtml.matchAll(/<a\b[^>]*aria-current=["']page["'][^>]*>([\s\S]*?)<\/a>|<a\b(?=[^>]*aria-current=["']page["'])[^>]*>([\s\S]*?)<\/a>/gi)];
    const activeLabels = activeMatches.map((match) => normalizeLabel(match[1] || match[2] || ""));
    if (activeExpected && activeLabels.join("|") !== activeExpected) {
      failures.push(`${rel}: aria-current attendu ${activeExpected}, obtenu ${JSON.stringify(activeLabels)}`);
    }
    if (!activeExpected && activeLabels.length) {
      failures.push(`${rel}: aria-current inattendu ${JSON.stringify(activeLabels)}`);
    }

    const footerMatch = html.match(/<footer\b[^>]*class=["'][^"']*\bsite-footer\b[^"']*["'][^>]*>([\s\S]*?)<\/footer>/i);
    if (!footerMatch) {
      failures.push(`${rel}: footer manquant`);
      continue;
    }
    const methodLinks = [...footerMatch[1].matchAll(/<a\b[^>]*href=["']([^"']*methode\/index\.html|index\.html)["'][^>]*>([\s\S]*?)<\/a>/gi)]
      .filter((match) => normalizeLabel(match[2]).toLowerCase().includes("méthode"));
    if (methodLinks.length !== 1) failures.push(`${rel}: ${methodLinks.length} lien(s) Méthode dans le footer`);
  }
  addCheck("navigation-footer", htmlFiles().length, failures);
}

function runLinksCheck() {
  const failures = [];
  for (const file of htmlFiles()) {
    const rel = relativeToSite(file);
    if (isInternalLab(rel)) continue;
    const html = readUtf8(file);
    const ids = anchorsIn(html);
    const refs = [
      ...html.matchAll(/<(?:a|link)\b[^>]*href=["']([^"']*)["'][^>]*>/gi),
      ...html.matchAll(/<(?:img|script|source)\b[^>]*src=["']([^"']*)["'][^>]*>/gi),
    ];
    for (const match of refs) {
      const raw = match[1];
      if (!raw || raw === "#") {
        failures.push(`${rel}: lien vide ou href="#"`);
        continue;
      }
      const hash = raw.includes("#") ? raw.split("#").slice(1).join("#") : "";
      const target = localHrefTarget(file, raw);
      if (target && !existsSync(target)) failures.push(`${rel}: cible absente ${raw}`);
      if (hash && !/^(https?:|mailto:|tel:|data:|\/\/)/i.test(raw) && !ids.has(hash)) {
        const targetFile = target && existsSync(target) ? target : file;
        const targetIds = targetFile === file ? ids : anchorsIn(readUtf8(targetFile));
        if (!targetIds.has(hash)) failures.push(`${rel}: ancre absente ${raw}`);
      }
    }
  }
  addCheck("links-media", htmlFiles().length, failures);
}

function runJavaScriptSyntaxCheck() {
  const failures = [];
  const jsFiles = textFiles().filter((file) => file.endsWith(".js") || file.endsWith(".mjs"));
  for (const file of jsFiles) {
    const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (result.status !== 0) failures.push(`${relativeToSite(file)}: ${result.stderr.trim() || result.stdout.trim()}`);
  }
  addCheck("javascript-syntax", jsFiles.length, failures);
}

function loadCases() {
  const file = path.join(SITE_ROOT, "assets", "observatoire.js");
  const code = `${readUtf8(file)}\nglobalThis.__cases = cases;`;
  const context = { document: { addEventListener() {}, querySelector() { return null; } }, window: {}, globalThis: {} };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(code, context, { filename: file });
  return context.__cases || [];
}

function runProjectDataCheck() {
  const failures = [];
  const warnings = [];
  const required = ["id", "slug", "title", "place", "owner", "status", "buildingType", "category", "documentStatus", "summary", "actors", "sources"];
  const cases = loadCases();
  const ids = new Set();
  const slugs = new Set();
  for (const item of cases) {
    for (const field of required) {
      if (item[field] == null || item[field] === "") failures.push(`${item.id || "projet sans id"}: champ requis absent ${field}`);
    }
    if (ids.has(item.id)) failures.push(`${item.id}: identifiant dupliqué`);
    ids.add(item.id);
    if (slugs.has(item.slug)) failures.push(`${item.slug}: slug dupliqué`);
    slugs.add(item.slug);
    if (!existsSync(path.join(SITE_ROOT, "etudes-de-cas", item.slug, "index.html"))) {
      failures.push(`${item.id}: page projet absente ${item.slug}/index.html`);
    }
    if (!Array.isArray(item.sources) || item.sources.length === 0) failures.push(`${item.id}: source absente`);
    if (String(item.verificationDate || "").toLowerCase().includes("documenter")) warnings.push(`${item.id}: date de vérification à documenter`);
    if (String(item.performance || "").toLowerCase().includes("résultats") && String(item.performance || "").toLowerCase().includes("pas encore")) {
      warnings.push(`${item.id}: résultats mesurés non publiés, lacune conservée`);
    }
  }
  addCheck("project-data", cases.length, failures, warnings);
}

function runWatchDataCheck() {
  const failures = [];
  const file = path.join(SITE_ROOT, "assets", "veille-data.js");
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(readUtf8(file), context, { filename: file });
  const items = context.window.watchItems;
  if (!Array.isArray(items)) failures.push("window.watchItems doit être un tableau");
  const ids = new Set();
  for (const item of items || []) {
    if (!item.id) failures.push("veille: item sans id");
    if (ids.has(item.id)) failures.push(`veille ${item.id}: id dupliqué`);
    ids.add(item.id);
    if (!["published", "publie"].includes(String(item.status || item.statut || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())) {
      failures.push(`veille ${item.id}: statut non publiable dans export public`);
    }
    if (!item.targetUrl) failures.push(`veille ${item.id}: targetUrl requis pour un élément publié`);
  }
  addCheck("watch-data", Array.isArray(items) ? items.length : 0, failures);
}

function runSeoFilesCheck() {
  const failures = [];
  const sitemap = path.join(SITE_ROOT, "sitemap.xml");
  const robots = path.join(SITE_ROOT, "robots.txt");
  if (!existsSync(sitemap)) failures.push("sitemap.xml absent");
  if (!existsSync(robots)) failures.push("robots.txt absent");
  if (existsSync(robots) && !readUtf8(robots).includes("Sitemap:")) failures.push("robots.txt ne référence pas le sitemap");
  if (existsSync(sitemap) && readUtf8(sitemap).includes("veille-automatique")) failures.push("sitemap: laboratoire veille-automatique exposé");
  addCheck("seo-files", 2, failures);
}

runEncodingCheck();
runNavigationCheck();
runLinksCheck();
runJavaScriptSyntaxCheck();
runProjectDataCheck();
runWatchDataCheck();
runSeoFilesCheck();

let failureCount = 0;
let warningCount = 0;
for (const check of checks) {
  failureCount += check.failures.length;
  warningCount += check.warnings.length;
  const status = check.failures.length ? "FAIL" : "OK";
  console.log(`${status} ${check.name} (${check.inspected} inspectés)`);
  for (const failure of check.failures.slice(0, 20)) console.log(`  - ${failure}`);
  if (check.failures.length > 20) console.log(`  - ... ${check.failures.length - 20} erreurs supplémentaires`);
  for (const warning of check.warnings.slice(0, 8)) console.log(`  ! ${warning}`);
  if (check.warnings.length > 8) console.log(`  ! ... ${check.warnings.length - 8} avertissements supplémentaires`);
}
console.log(`Résumé: ${failureCount} erreur(s), ${warningCount} avertissement(s)`);
process.exitCode = failureCount ? 1 : 0;
