import { writeFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {
  SITE_ROOT,
  decodeEntities,
  extractAttribute,
  extractTagContent,
  htmlFiles,
  isInternalLab,
  readUtf8,
  relativeToSite,
  stripTags,
} from "./site-utils.mjs";

function loadCases() {
  const file = path.join(SITE_ROOT, "assets", "observatoire.js");
  const code = `${readUtf8(file)}\nglobalThis.__cases = cases;`;
  const context = { document: { addEventListener() {}, querySelector() { return null; } }, window: {}, globalThis: {} };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(code, context, { filename: file });
  return context.__cases || [];
}

function publicUrl(rel) {
  return rel.replace(/index\.html$/, "index.html");
}

function pageType(rel) {
  if (rel === "index.html") return "Accueil";
  if (rel.startsWith("etudes-de-cas/")) return rel === "etudes-de-cas/index.html" ? "Projets" : "Projet observé";
  if (rel.startsWith("documentation/")) return "Documentation";
  if (rel.startsWith("territoires/")) return "Territoire";
  if (rel.startsWith("acteurs/")) return "Acteurs";
  if (rel.startsWith("comprendre/")) return "Comprendre";
  if (rel.includes("veille")) return "Veille";
  return "Page";
}

const items = [];
const casesByPage = new Map(loadCases().map((item) => [`etudes-de-cas/${item.slug}/index.html`, item]));
for (const file of htmlFiles()) {
  const rel = relativeToSite(file);
  if (isInternalLab(rel)) continue;
  const html = readUtf8(file);
  const robots = html.match(/<meta\b(?=[^>]*name=["']robots["'])[^>]*>/i);
  if (robots && /noindex/i.test(extractAttribute(robots[0], "content"))) continue;
  const title = decodeEntities(extractTagContent(html, "title")).replace(/\s+·\s+(Observatoire|Projet).*$/i, "");
  const h1 = decodeEntities(extractTagContent(html, "h1"));
  const descriptionTag = html.match(/<meta\b(?=[^>]*name=["']description["'])[^>]*>/i);
  const description = descriptionTag ? extractAttribute(descriptionTag[0], "content") : "";
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || "";
  const text = stripTags(main).slice(0, 1800);
  const project = casesByPage.get(rel);
  const keywords = project ? [
    project.id,
    project.title,
    project.place,
    project.owner,
    project.category,
    project.buildingType,
    ...(project.badges || []),
    ...(project.actors || []).flatMap((group) => group.names || []),
  ].filter(Boolean) : [];
  if (!title && !h1) continue;
  items.push({
    title: h1 || title,
    type: pageType(rel),
    url: publicUrl(rel),
    description: description || text.slice(0, 180),
    keywords,
    text,
  });
}

items.sort((a, b) => a.url.localeCompare(b.url));

const js = `window.searchIndex = ${JSON.stringify(items, null, 2)};\n`;
writeFileSync(path.join(SITE_ROOT, "assets", "search-index.js"), js, "utf8");
console.log(`Index de recherche généré: ${items.length} entrées`);
