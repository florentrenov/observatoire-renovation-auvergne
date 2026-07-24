import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadRegistry, validateRegistry } from "./validate-project-identities.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.resolve(ROOT, "dist");
const POLICY = JSON.parse(readFileSync(path.join(ROOT, "config", "publication-allowlist.json"), "utf8"));
const REGISTRY = loadRegistry();
const TEXT_EXTENSIONS = new Set([".html", ".css", ".js", ".json", ".xml", ".txt", ".webmanifest"]);

function assertSafeDist() {
  if (path.dirname(DIST) !== ROOT || path.basename(DIST) !== "dist") {
    throw new Error(`Cible dist non sûre: ${DIST}`);
  }
}

function copyRelative(relativePath) {
  const source = path.resolve(ROOT, relativePath);
  const destination = path.resolve(DIST, relativePath);
  if (!source.startsWith(`${ROOT}${path.sep}`) || !destination.startsWith(`${DIST}${path.sep}`)) {
    throw new Error(`Copie hors périmètre: ${relativePath}`);
  }
  if (!existsSync(source)) throw new Error(`Élément allowlist absent: ${relativePath}`);
  mkdirSync(path.dirname(destination), { recursive: true });
  if (TEXT_EXTENSIONS.has(path.extname(source).toLowerCase())) {
    writeFileSync(destination, readFileSync(source, "utf8").replace(/\r\n?/g, "\n"), "utf8");
  } else {
    cpSync(source, destination, { recursive: true, force: false, errorOnExist: true });
  }
}

function walk(directory, files = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeHttpUrl(value) {
  const parsed = new URL(String(value));
  if (!new Set(["http:", "https:"]).has(parsed.protocol)) throw new Error(`URL source interdite: ${value}`);
  return escapeHtml(parsed.href);
}

function actorSlug(value) {
  return String(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/œ/g, "oe").replace(/æ/g, "ae").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function htmlList(items, className = "") {
  return `<ul${className ? ` class="${escapeHtml(className)}"` : ""}>${items.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>`;
}

function techBadges(items) {
  return `<div class="tech-badges" aria-label="Techniques observées">${items.map((value) => `<span>${escapeHtml(value)}</span>`).join("")}</div>`;
}

function actorGroups(groups) {
  return `<div class="actor-map">${groups.map((group) => `<article><span>${escapeHtml(group.role)}</span><p>${group.names.map((name) => `<a href="../../acteurs/${actorSlug(name)}/index.html">${escapeHtml(name)}</a>`).join(" · ")}</p></article>`).join("")}</div>`;
}

function renderProject(project, byId) {
  const similar = (project.similar || []).map((id) => byId.get(id)).filter(Boolean);
  return `
    <header class="project-header">
      <span class="reference">${escapeHtml(project.id)} · ${escapeHtml(project.status)}</span>
      <span class="eyebrow">${escapeHtml(project.place)} · ${escapeHtml(project.owner)}</span>
      <h1>${escapeHtml(project.title)}</h1>
      <p class="lead">${escapeHtml(project.summary)}</p>
      ${techBadges(project.badges || [])}
      ${htmlList(project.metrics || [], "metric-list detail-metrics")}
    </header>
    <section class="project-identity" aria-labelledby="identity-title">
      <h2 id="identity-title">Fiche d'identité</h2>
      <dl>
        <div><dt>Type de bâtiment</dt><dd>${escapeHtml(project.buildingType)}</dd></div>
        <div><dt>Localisation</dt><dd>${escapeHtml(project.place)}</dd></div>
        <div><dt>Période</dt><dd>${escapeHtml(project.period)}</dd></div>
        <div><dt>Surface</dt><dd>${escapeHtml(project.surface)}</dd></div>
        <div><dt>Montant</dt><dd>${escapeHtml(project.amount)}</dd></div>
        <div><dt>Porteur du projet</dt><dd>${escapeHtml(project.owner)}</dd></div>
        <div><dt>Statut documentaire</dt><dd>${escapeHtml(project.documentStatus)}</dd></div>
      </dl>
    </section>
    <section class="executive-summary" aria-labelledby="takeaway-title"><h2 id="takeaway-title">À retenir</h2>${htmlList(project.takeaways || [])}</section>
    <nav class="project-network" aria-label="Explorer le réseau documentaire"><a href="#techniques">Techniques observées</a><a href="#acteurs">Acteurs</a><a href="../../territoires/puy-de-dome/index.html">Territoire</a><a href="#sources">Sources</a></nav>
    <h2>Contexte territorial</h2><p>${escapeHtml(project.context)}</p>
    <h2>Description du projet</h2><p>${escapeHtml(project.project)}</p>
    <h2 id="techniques">Choix techniques</h2>${techBadges(project.badges || [])}${htmlList(project.tech || [])}
    <h2 id="acteurs">Acteurs impliqués</h2>${actorGroups(project.actors || [])}
    <h2>Résultats et performances</h2><p>${escapeHtml(project.performance)}</p>
    <h2>Point remarquable</h2><p>${escapeHtml(project.lesson)}</p>
    <section class="document-trust" aria-labelledby="trust-title"><h2 id="trust-title">Crédibilité documentaire</h2><dl><div><dt>Sources utilisées</dt><dd>${escapeHtml(project.confidence)}</dd></div><div><dt>Date de vérification</dt><dd>${escapeHtml(project.verificationDate)}</dd></div><div><dt>Niveau documentaire</dt><dd>${escapeHtml(project.documentStatus)}</dd></div></dl><p>Les objectifs, estimations et résultats mesurés sont distingués lorsque les sources le permettent.</p></section>
    <h2 id="sources">Sources</h2><ul>${(project.sources || []).map(([name, url]) => `<li><a href="${safeHttpUrl(url)}">${escapeHtml(name)}</a></li>`).join("")}</ul>
    ${similar.length ? `<section class="similar-projects" aria-labelledby="similar-title"><h2 id="similar-title">Projets similaires</h2><div class="similar-grid">${similar.map((item) => `<a href="../${escapeHtml(item.slug)}/index.html"><span>${escapeHtml(item.id)} · ${escapeHtml(item.category)}</span><strong>${escapeHtml(item.title)}</strong><em>${escapeHtml(item.place)}</em></a>`).join("")}</div></section>` : ""}
  `;
}

function loadCases() {
  const source = readFileSync(path.join(ROOT, "assets", "observatoire.js"), "utf8");
  const context = { document: { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; } } };
  return vm.runInNewContext(`${source};cases`, context, { filename: "assets/observatoire.js" });
}

function replaceMeta(html, attribute, key, value) {
  const pattern = new RegExp(`<meta\\s+${attribute}=["']${key}["']\\s+content=["'][^"']*["']\\s*\\/?\\s*>`, "i");
  const tag = `<meta ${attribute}="${key}" content="${escapeHtml(value)}">`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace("</head>", `    ${tag}\n</head>`);
}

function preRenderProjects(cases) {
  const byId = new Map(cases.map((item) => [item.id, item]));
  for (const project of cases) {
    const file = path.join(DIST, "etudes-de-cas", project.slug, "index.html");
    let html = readFileSync(file, "utf8");
    const articlePattern = new RegExp(`<article\\s+class=["']doc-article["']\\s+data-case-detail=["']${project.id}["']>\\s*</article>`, "i");
    if (!articlePattern.test(html)) throw new Error(`${project.id}: coque projet introuvable`);
    html = html.replace(articlePattern, `<article class="doc-article" data-case-detail="${project.id}">${renderProject(project, byId)}</article>`);
    const pageTitle = `${project.title} · Projet d'Auvergne`;
    const canonical = `https://florentrenov.github.io/observatoire-renovation-auvergne/etudes-de-cas/${project.slug}/`;
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(pageTitle)}</title>`);
    html = replaceMeta(html, "name", "description", project.summary);
    html = replaceMeta(html, "property", "og:title", pageTitle);
    html = replaceMeta(html, "property", "og:description", project.summary);
    html = replaceMeta(html, "property", "og:type", "article");
    html = replaceMeta(html, "property", "og:url", canonical);
    html = html.replace(/<link\s+rel=["']canonical["']\s+href=["'][^"']+["']\s*\/?>/i, `<link rel="canonical" href="${canonical}">`);
    if (!/name=["']project-id["']/i.test(html)) html = html.replace("</head>", `    <meta name="project-id" content="${project.id}">\n</head>`);
    writeFileSync(file, html, "utf8");
  }
}

function stripTags(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeEntities(value) {
  return String(value || "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}

function metaContent(html, name) {
  const tag = html.match(new RegExp(`<meta\\b(?=[^>]*name=(["'])${name}\\1)[^>]*>`, "i"))?.[0] || "";
  const content = tag.match(/content=(["'])(.*?)\1/i)?.[2] || "";
  return decodeEntities(content);
}

function pageType(relativePath) {
  if (relativePath === "index.html") return "Accueil";
  if (relativePath.startsWith("etudes-de-cas/")) return relativePath === "etudes-de-cas/index.html" ? "Projets" : "Projet observé";
  if (relativePath.startsWith("documentation/")) return "Documentation";
  if (relativePath.startsWith("territoires/")) return "Territoire";
  if (relativePath.startsWith("acteurs/")) return "Acteurs";
  if (relativePath.startsWith("comprendre/")) return "Comprendre";
  if (relativePath.includes("veille")) return "Veille";
  return "Page";
}

function buildSearchIndex(cases) {
  const casesByPage = new Map(cases.map((item) => [`etudes-de-cas/${item.slug}/index.html`, item]));
  const items = [];
  for (const file of walk(DIST).filter((item) => item.endsWith(".html"))) {
    const relativePath = path.relative(DIST, file).split(path.sep).join("/");
    const html = readFileSync(file, "utf8");
    if (/<meta\b(?=[^>]*name=["']robots["'])[^>]*content=["'][^"']*noindex/i.test(html)) continue;
    const title = decodeEntities(stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "")).replace(/\s+·\s+(Observatoire|Projet).*$/i, "");
    const h1 = decodeEntities(stripTags(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || ""));
    const description = metaContent(html, "description");
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || "";
    const text = stripTags(main).slice(0, 1800);
    const project = casesByPage.get(relativePath);
    const keywords = project ? [project.id, project.title, project.place, project.owner, project.category, project.buildingType, ...(project.badges || []), ...(project.actors || []).flatMap((group) => group.names || [])].filter(Boolean) : [];
    if (!title && !h1) continue;
    items.push({ title: h1 || title, type: pageType(relativePath), url: relativePath, description: description || text.slice(0, 180), keywords, text });
  }
  items.sort((left, right) => left.url.localeCompare(right.url));
  writeFileSync(path.join(DIST, "assets", "search-index.js"), `window.searchIndex = ${JSON.stringify(items, null, 2)};\n`, "utf8");
  return items.length;
}

function legalHrefFor(relativePath) {
  const depth = relativePath.split("/").length - 1;
  return `${"../".repeat(depth)}mentions-legales/index.html`;
}

function injectLegalFooterLinks() {
  for (const file of walk(DIST).filter((item) => item.endsWith(".html"))) {
    const relativePath = path.relative(DIST, file).split(path.sep).join("/");
    let html = readFileSync(file, "utf8");
    html = html.replace(/<span\s+class=["']footer-status["'](?=\s*<\/div>)/i, "");
    if (/class=["'][^"']*\bsite-footer\b[^"']*["'][\s\S]*?mentions-legales\/index\.html/i.test(html)) continue;
    const link = `<a href="${legalHrefFor(relativePath)}">Mentions légales et confidentialité</a>`;
    const next = html.replace(/(<footer\b[^>]*class=["'][^"']*\bsite-footer\b[^"']*["'][\s\S]*?)(<\/div>\s*<\/footer>)/i, `$1${link}$2`);
    if (next === html) throw new Error(`${relativePath}: pied de page public introuvable pour le lien légal`);
    writeFileSync(file, next, "utf8");
  }
}

function sha256File(file) {
  return crypto.createHash("sha256").update(readFileSync(file)).digest("hex");
}

function artifactHash() {
  const digest = crypto.createHash("sha256");
  for (const file of walk(DIST).filter((item) => path.basename(item) !== "RELEASE-MANIFEST.json").sort()) {
    const relativePath = path.relative(DIST, file).split(path.sep).join("/");
    digest.update(relativePath).update("\0").update(sha256File(file)).update("\n");
  }
  return digest.digest("hex");
}

function countPages(relativeDirectory, includeIndex = false) {
  const directory = path.join(DIST, relativeDirectory);
  if (!existsSync(directory)) return 0;
  return walk(directory).filter((file) => file.endsWith("index.html") && (includeIndex || path.relative(directory, file) !== "index.html")).length;
}

function gitValue(...args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function sitemapPageFiles(xml) {
  const basePath = "/observatoire-renovation-auvergne/";
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => {
    const url = new URL(match[1]);
    if (url.protocol !== "https:" || url.hostname !== "florentrenov.github.io" || !url.pathname.startsWith(basePath)) {
      throw new Error(`Sitemap hors origine publique: ${url.href}`);
    }
    const relative = decodeURI(url.pathname.slice(basePath.length));
    return relative ? `${relative.replace(/\/$/, "")}/index.html` : "index.html";
  });
}

function expectedPublicHtmlFiles(registryById) {
  const files = [
    "index.html",
    ...(POLICY.publicPageFiles || []),
    POLICY.projectIndex,
    ...POLICY.additionalCaseStudies,
    ...POLICY.publishedProjectIds.map((id) => `etudes-de-cas/${registryById.get(id).canonicalSlug}/index.html`),
  ];
  if (new Set(files).size !== files.length) throw new Error("Allowlist: page HTML dupliquée");
  for (const file of files) {
    if (!file.endsWith("/index.html") && file !== "index.html") throw new Error(`Allowlist: page non explicite ${file}`);
  }
  return files.sort();
}

function writeManifest(cases, searchEntries) {
  const commit = gitValue("rev-parse", "HEAD");
  const branch = gitValue("branch", "--show-current");
  const generatedAt = new Date().toISOString();
  const sitemap = readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
  const manifest = {
    schemaVersion: "1.0.0",
    releaseId: `${generatedAt.replace(/[-:.]/g, "").replace("Z", "Z")}-${commit.slice(0, 12)}`,
    sourceCommit: commit,
    sourceBranch: branch,
    generatedAt,
    pageCount: (sitemap.match(/<loc>/g) || []).length,
    htmlFileCount: walk(DIST).filter((file) => file.endsWith(".html")).length,
    utilityPageCount: (POLICY.utilityPageFiles || []).length,
    publishedProjectCount: cases.length,
    publishedProjectIds: cases.map((item) => item.id).sort(),
    actorPageCount: countPages("acteurs"),
    techniquePageCount: countPages("techniques"),
    territoryPageCount: countPages("territoires"),
    sitemapUrlCount: (sitemap.match(/<loc>/g) || []).length,
    searchEntryCount: searchEntries,
    artifactSha256: artifactHash(),
    exclusions: ["internal workspaces", "ambiguous project identities", "audit and validation documents", "working scripts and source registries"],
    alerts: ["Four project identities require human arbitration before publication."],
    tests: [
      { name: "identity:check", status: "passed" },
      { name: "public:build", status: "passed" },
      { name: "public:accessibility", status: "pending_external" },
      { name: "site:check", status: "pending_external" },
      { name: "public:verify", status: "pending_external" }
    ],
    validationDecision: "human_approval_required"
  };
  writeFileSync(path.join(DIST, "RELEASE-MANIFEST.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}

const registryFailures = validateRegistry(REGISTRY);
if (registryFailures.length) throw new Error(registryFailures.join("\n"));
const registryById = new Map(REGISTRY.entries.map((entry) => [entry.id, entry]));
for (const id of POLICY.publishedProjectIds) {
  const entry = registryById.get(id);
  if (!entry || entry.status !== "actif" || entry.publicationStatus !== "public") throw new Error(`${id}: projet allowlist non actif`);
}
for (const id of POLICY.frozenProjectIds) {
  const entry = registryById.get(id);
  if (!entry || entry.status !== "ambigu" || entry.publicationStatus !== "non_publiable") throw new Error(`${id}: gel incohérent`);
}

const sourceSitemap = readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
const allowlistedHtmlFiles = expectedPublicHtmlFiles(registryById);
const sitemapHtmlFiles = sitemapPageFiles(sourceSitemap).sort();
const missingFromAllowlist = sitemapHtmlFiles.filter((file) => !allowlistedHtmlFiles.includes(file));
const missingFromSitemap = allowlistedHtmlFiles.filter((file) => !sitemapHtmlFiles.includes(file));
if (missingFromAllowlist.length || missingFromSitemap.length) {
  throw new Error(`Sitemap/allowlist incohérent. Hors allowlist: ${missingFromAllowlist.join(", ") || "aucune"}. Hors sitemap: ${missingFromSitemap.join(", ") || "aucune"}.`);
}

assertSafeDist();
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
for (const item of POLICY.rootFiles) copyRelative(item);
for (const item of POLICY.utilityPageFiles || []) copyRelative(item);
for (const item of POLICY.publicPageFiles) copyRelative(item);
mkdirSync(path.join(DIST, "assets"), { recursive: true });
for (const item of POLICY.publicAssets) copyRelative(path.join("assets", item));
copyRelative(POLICY.projectIndex);
for (const item of POLICY.additionalCaseStudies) copyRelative(item);
for (const id of POLICY.publishedProjectIds) copyRelative(path.join("etudes-de-cas", registryById.get(id).canonicalSlug, "index.html"));

const cases = loadCases().filter((item) => POLICY.publishedProjectIds.includes(item.id));
const caseIds = cases.map((item) => item.id).sort();
const expectedIds = [...POLICY.publishedProjectIds].sort();
if (JSON.stringify(caseIds) !== JSON.stringify(expectedIds)) throw new Error(`Corpus public incohérent: ${caseIds.join(", ")}`);
preRenderProjects(cases);
injectLegalFooterLinks();
const searchEntries = buildSearchIndex(cases);
const manifest = writeManifest(cases, searchEntries);
console.log(`Artefact public construit: ${manifest.pageCount} pages, ${manifest.publishedProjectCount} projets, SHA-256 ${manifest.artifactSha256}`);
