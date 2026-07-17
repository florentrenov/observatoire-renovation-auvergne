import { writeFileSync } from "node:fs";
import {
  PUBLIC_NAV,
  activeSectionFor,
  decodeEntities,
  htmlFiles,
  isInternalLab,
  readUtf8,
  relativeToSite,
} from "./site-utils.mjs";

const mode = process.argv.includes("--write") ? "write" : "check";

function depthPrefix(rel) {
  const depth = rel.split("/").length - 1;
  return "../".repeat(depth);
}

function labelsFromLinks(html) {
  return [...html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => decodeEntities(match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()));
}

function navFor(rel) {
  const prefix = depthPrefix(rel);
  const entries = [
    [prefix + "index.html", PUBLIC_NAV[0]],
    [prefix + "etudes-de-cas/index.html", PUBLIC_NAV[1]],
    [prefix + "veille/index.html", PUBLIC_NAV[2]],
    [prefix + "acteurs/index.html", PUBLIC_NAV[3]],
    [prefix + "sources/index.html", PUBLIC_NAV[4]],
    [prefix + "a-propos/index.html", PUBLIC_NAV[5]],
  ];
  const active = activeSectionFor(rel);
  return `<nav class="nav-links" aria-label="Navigation principale">${entries.map(([href, label]) => {
    const current = label === active ? ' aria-current="page"' : "";
    return `<a href="${href}"${current}>${label}</a>`;
  }).join("")}</nav>`;
}

function headerFor(rel, oldHeader) {
  const brandMatch = oldHeader.match(/<a\b[^>]*class=["'][^"']*\bbrand\b[^"']*["'][\s\S]*?<\/a>/i);
  if (!brandMatch) throw new Error(`${rel}: marque .brand absente dans le header`);
  return `<header class="site-header"><div class="nav-shell">${brandMatch[0]}${navFor(rel)}</div></header>`;
}

function footerFor(rel, oldFooter) {
  const methodHref = `${depthPrefix(rel)}methode/index.html`;
  let footer = oldFooter.replace(/<a\b[^>]*href=["'][^"']*methode\/index\.html["'][^>]*>[\s\S]*?<\/a>/gi, "");
  footer = footer.replace(/<span\b[^>]*class=["'][^"']*\bfooter-status\b[^"']*["'][^>]*>/i, `<a href="${methodHref}">Méthode</a><span class="footer-status"`);
  if (!footer.includes(`href="${methodHref}"`)) {
    footer = footer.replace("</div></footer>", `<a href="${methodHref}">Méthode</a></div></footer>`);
  }
  return footer;
}

const changed = [];
const failures = [];

for (const file of htmlFiles()) {
  const rel = relativeToSite(file);
  if (isInternalLab(rel)) continue;
  const html = readUtf8(file);
  const headerMatches = [...html.matchAll(/<header\b[^>]*class=["'][^"']*\bsite-header\b[^"']*["'][\s\S]*?<\/header>/gi)];
  const footerMatches = [...html.matchAll(/<footer\b[^>]*class=["'][^"']*\bsite-footer\b[^"']*["'][\s\S]*?<\/footer>/gi)];

  if (headerMatches.length !== 1) failures.push(`${rel}: ${headerMatches.length} header(s) site-header`);
  if (footerMatches.length !== 1) failures.push(`${rel}: ${footerMatches.length} footer(s) site-footer`);
  if (headerMatches.length !== 1 || footerMatches.length !== 1) continue;

  if (mode === "check") {
    const navMatch = headerMatches[0][0].match(/<nav\b[^>]*class=["'][^"']*\bnav-links\b[^"']*["'][^>]*>([\s\S]*?)<\/nav>/i);
    if (!navMatch) {
      failures.push(`${rel}: nav-links absente`);
    } else if (labelsFromLinks(navMatch[1]).join("|") !== PUBLIC_NAV.join("|")) {
      failures.push(`${rel}: navigation non conforme`);
    }
    const methodLinks = [...footerMatches[0][0].matchAll(/<a\b[^>]*href=["'][^"']*methode\/index\.html["'][^>]*>([\s\S]*?)<\/a>/gi)]
      .filter((match) => labelsFromLinks(match[0]).join("").toLowerCase().includes("méthode"));
    if (methodLinks.length !== 1) failures.push(`${rel}: lien Méthode footer non conforme`);
    continue;
  }

  let next = html.replace(headerMatches[0][0], headerFor(rel, headerMatches[0][0]));
  next = next.replace(footerMatches[0][0], footerFor(rel, footerMatches[0][0]));
  if (next !== html) {
    changed.push(rel);
    writeFileSync(file, next, "utf8");
  }
}

if (failures.length) {
  console.error("Synchronisation impossible:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

if (mode === "check") {
  console.log("Header/footer conformes.");
} else if (changed.length) {
  console.log(`Mis à jour: ${changed.length} page(s)`);
  for (const rel of changed.slice(0, 30)) console.log(`- ${rel}`);
  if (changed.length > 30) console.log(`- ... ${changed.length - 30} page(s) supplémentaires`);
} else {
  console.log("Header/footer déjà synchronisés.");
}
