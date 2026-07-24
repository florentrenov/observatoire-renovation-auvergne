import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  SITE_ROOT,
  activeSectionFor,
  decodeEntities,
  extractAttribute,
  extractTagContent,
  htmlFiles,
  localHrefTarget,
  readUtf8,
  relativeToSite,
  stripTags,
} from "./site-utils.mjs";

function classify(rel, title, h1, outgoing, incoming) {
  if (rel === "index.html") return "public-principal";
  if (rel.startsWith("etudes-de-cas/")) return "public-principal";
  if (["veille/index.html", "acteurs/index.html", "sources/index.html", "a-propos/index.html"].includes(rel)) return "public-principal";
  if (rel === "methode/index.html") return "transparence";
  if (rel.startsWith("internal/") || rel === "veille-automatique/index.html" || rel.startsWith("analyse-connaissances/")) return "laboratoire-interne";
  if (rel.startsWith("veille/")) return "public-utile";
  if (["observatoire/index.html", "recherche/index.html"].includes(rel)) return "public-secondaire";
  if (["analyses/index.html", "techniques/index.html", "territoires/index.html"].includes(rel)) return "a-examiner";
  if (incoming === 0) return "a-examiner";
  if (!h1 || !title) return "a-examiner";
  if (outgoing === 0) return "a-examiner";
  return "public-utile";
}

function pageType(rel) {
  if (rel === "index.html") return "accueil";
  if (rel.startsWith("etudes-de-cas/") && rel !== "etudes-de-cas/index.html") return "fiche projet";
  if (rel === "etudes-de-cas/index.html") return "catalogue projets";
  if (rel.startsWith("documentation/")) return "documentation";
  if (rel.startsWith("territoires/")) return "territoire";
  if (rel.startsWith("acteurs/") && rel !== "acteurs/index.html") return "fiche acteur";
  if (rel.includes("veille")) return "veille";
  return "page";
}

const pages = new Map();
for (const file of htmlFiles()) {
  const rel = relativeToSite(file);
  const html = readUtf8(file);
  const title = decodeEntities(extractTagContent(html, "title"));
  const h1 = decodeEntities(extractTagContent(html, "h1"));
  const descriptionMatch = html.match(/<meta\b(?=[^>]*name=["']description["'])[^>]*>/i);
  const canonicalMatch = html.match(/<link\b(?=[^>]*rel=["']canonical["'])[^>]*>/i);
  const robotsMatch = html.match(/<meta\b(?=[^>]*name=["']robots["'])[^>]*>/i);
  const ogTitle = html.match(/<meta\b(?=[^>]*property=["']og:title["'])[^>]*>/i);
  const ogDescription = html.match(/<meta\b(?=[^>]*property=["']og:description["'])[^>]*>/i);
  const navMatch = html.match(/<nav\b[^>]*class=["'][^"']*\bnav-links\b[^"']*["'][^>]*>([\s\S]*?)<\/nav>/i);
  const hrefs = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)].map((m) => m[1]);
  const internal = [];
  for (const href of hrefs) {
    const target = localHrefTarget(file, href);
    if (target && target.endsWith(".html")) internal.push(relativeToSite(target));
    if (target && !target.endsWith(".html") && target.endsWith(path.sep)) internal.push(relativeToSite(path.join(target, "index.html")));
  }
  pages.set(rel, {
    path: rel,
    title,
    h1,
    type: pageType(rel),
    universe: activeSectionFor(rel) || "",
    inMainNavigation: Boolean(navMatch && navMatch[1].includes('aria-current="page"')),
    outgoingInternal: [...new Set(internal)].sort(),
    incomingInternal: [],
    inSitemap: false,
    hasMetaDescription: Boolean(descriptionMatch && extractAttribute(descriptionMatch[0], "content")),
    hasCanonical: Boolean(canonicalMatch && extractAttribute(canonicalMatch[0], "href")),
    hasOpenGraph: Boolean(ogTitle && ogDescription),
    indexable: !(robotsMatch && /noindex/i.test(extractAttribute(robotsMatch[0], "content"))),
    status: "",
    decisionRequired: "",
    completeness: "",
    sourceData: rel.startsWith("etudes-de-cas/") ? "assets/observatoire.js" : "",
    textLength: stripTags(html).length,
  });
}

for (const page of pages.values()) {
  for (const target of page.outgoingInternal) {
    const targetPage = pages.get(target);
    if (targetPage) targetPage.incomingInternal.push(page.path);
  }
}

const sitemapPath = path.join(SITE_ROOT, "sitemap.xml");
let sitemapText = "";
try {
  sitemapText = readUtf8(sitemapPath);
} catch {
  sitemapText = "";
}

for (const page of pages.values()) {
  page.incomingInternal = [...new Set(page.incomingInternal)].sort();
  page.incomingCount = page.incomingInternal.length;
  page.outgoingCount = page.outgoingInternal.length;
  page.inSitemap = sitemapText.includes(page.path.replace(/index\.html$/, ""));
  page.status = classify(page.path, page.title, page.h1, page.outgoingInternal.length, page.incomingCount);
  page.completeness = page.textLength > 2500 ? "forte" : page.textLength > 900 ? "moyenne" : "faible";
  page.decisionRequired = {
    "laboratoire-interne": "Confirmer exclusion publique durable",
    "a-examiner": "Décider relier, noindex, rediriger ou conserver",
    "public-secondaire": "Confirmer rôle et liens entrants",
    "transparence": "Conserver en footer",
  }[page.status] || "";
}

const inventory = {
  generatedAt: new Date().toISOString(),
  pageCount: pages.size,
  pages: [...pages.values()].sort((a, b) => a.path.localeCompare(b.path)),
};

mkdirSync(path.join(SITE_ROOT, "docs"), { recursive: true });
writeFileSync(path.join(SITE_ROOT, "docs", "site-inventory.json"), `${JSON.stringify(inventory, null, 2)}\n`, "utf8");

const summary = [
  "# Inventaire du site",
  "",
  `Généré le ${inventory.generatedAt}.`,
  "",
  `Pages HTML: ${inventory.pageCount}`,
  "",
  "| Page | Type | H1 | Statut | Indexable | Sitemap | Entrants | Sortants | Décision |",
  "|---|---|---|---|---|---|---:|---:|---|",
  ...inventory.pages.map((page) => `| ${page.path} | ${page.type} | ${page.h1.replace(/\|/g, "\\|")} | ${page.status} | ${page.indexable ? "oui" : "non"} | ${page.inSitemap ? "oui" : "non"} | ${page.incomingCount} | ${page.outgoingCount} | ${page.decisionRequired} |`),
  "",
];
writeFileSync(path.join(SITE_ROOT, "docs", "site-inventory.md"), summary.join("\n"), "utf8");

console.log(`Inventaire généré: ${inventory.pageCount} pages`);
