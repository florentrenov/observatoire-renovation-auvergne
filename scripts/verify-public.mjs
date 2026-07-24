import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const POLICY = JSON.parse(readFileSync(path.join(ROOT, "config", "publication-allowlist.json"), "utf8"));

function walk(directory, files = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function toRelative(file) {
  return path.relative(DIST, file).split(path.sep).join("/");
}

function sha256File(file) {
  return crypto.createHash("sha256").update(readFileSync(file)).digest("hex");
}

function artifactHash() {
  const digest = crypto.createHash("sha256");
  for (const file of walk(DIST).filter((item) => path.basename(item) !== "RELEASE-MANIFEST.json").sort()) {
    digest.update(toRelative(file)).update("\0").update(sha256File(file)).update("\n");
  }
  return digest.digest("hex");
}

function resolvePublicTarget(fromFile, rawTarget) {
  const target = rawTarget.split("#")[0].split("?")[0];
  if (!target || /^(?:https?:|mailto:|tel:|data:|\/\/)/i.test(target)) return null;
  const publicBase = "/observatoire-renovation-auvergne/";
  if (target.startsWith(publicBase)) {
    const relative = decodeURI(target.slice(publicBase.length));
    return path.join(DIST, relative || "index.html");
  }
  let resolved = path.resolve(path.dirname(fromFile), decodeURI(target));
  if (target.endsWith("/")) resolved = path.join(resolved, "index.html");
  return resolved;
}

function gitValue(...args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function sitemapPageFile(rawUrl) {
  const url = new URL(rawUrl);
  const basePath = "/observatoire-renovation-auvergne/";
  if (url.protocol !== "https:" || url.hostname !== "florentrenov.github.io" || !url.pathname.startsWith(basePath)) {
    throw new Error(`Sitemap hors origine publique: ${rawUrl}`);
  }
  const relative = decodeURI(url.pathname.slice(basePath.length));
  return relative ? `${relative.replace(/\/$/, "")}/index.html` : "index.html";
}

function countPages(relativeDirectory, includeIndex = false) {
  const directory = path.join(DIST, relativeDirectory);
  if (!existsSync(directory)) return 0;
  return walk(directory).filter((file) => file.endsWith("index.html") && (includeIndex || path.relative(directory, file) !== "index.html")).length;
}

if (!existsSync(DIST)) throw new Error("Artefact dist absent. Exécuter public:build.");
const failures = [];
const files = walk(DIST);
const forbiddenSegments = new Set(POLICY.forbiddenPathSegments.map((item) => item.toLowerCase()));
const contentPatterns = POLICY.forbiddenContentPatterns.map((pattern) => new RegExp(pattern, "iu"));

for (const file of files) {
  const relativePath = toRelative(file);
  if (relativePath.split("/").some((segment) => forbiddenSegments.has(segment.toLowerCase()))) failures.push(`${relativePath}: chemin interdit`);
  if ([".html", ".css", ".js", ".json", ".xml", ".txt"].includes(path.extname(file).toLowerCase())) {
    if (readFileSync(file).includes(Buffer.from("\r\n"))) failures.push(`${relativePath}: fin de ligne CRLF non normalisée`);
    const content = readFileSync(file, "utf8");
    if (path.basename(file) !== "RELEASE-MANIFEST.json") {
      for (const pattern of contentPatterns) if (pattern.test(content)) failures.push(`${relativePath}: contenu interdit ${pattern}`);
    }
  }
}

for (const file of files.filter((item) => item.endsWith(".html"))) {
  const html = readFileSync(file, "utf8");
  const relativePath = toRelative(file);
  const visibleText = html.replace(/<script[\s\S]*?<\/script>/giu, " ").replace(/<style[\s\S]*?<\/style>/giu, " ").replace(/<[^>]+>/gu, " ");
  if (/observatoire\.js/iu.test(visibleText)) failures.push(`${relativePath}: nom de fichier interne visible`);
  if (!/<html\b[^>]*lang=["']fr["']/i.test(html)) failures.push(`${relativePath}: langue française absente`);
  if (!/<meta\b[^>]*name=["']viewport["']/i.test(html)) failures.push(`${relativePath}: viewport responsive absent`);
  if (!/<main\b/i.test(html)) failures.push(`${relativePath}: élément main absent`);
  if (/<span\s+class=["']footer-status["'](?=\s*<\/div>)/i.test(html)) failures.push(`${relativePath}: pied de page mal formé`);
  if (!/<footer\b[^>]*class=["'][^"']*\bsite-footer\b[^"']*["'][\s\S]*?href=["'][^"']*mentions-legales\/index\.html["']/i.test(html)) failures.push(`${relativePath}: lien légal absent du pied de page`);
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1];
  if (!canonical) failures.push(`${relativePath}: canonical absent`);
  else if (!canonical.startsWith("https://florentrenov.github.io/observatoire-renovation-auvergne/") || /localhost|127\.0\.0\.1|^[A-Za-z]:[\\/]/i.test(canonical)) failures.push(`${relativePath}: canonical non public ${canonical}`);
  for (const image of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt=["'][^"']*["']/i.test(image[0])) failures.push(`${relativePath}: image sans attribut alt`);
  }
  for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/gi)) {
    const target = resolvePublicTarget(file, match[1]);
    if (!target) continue;
    if (!target.startsWith(`${DIST}${path.sep}`)) failures.push(`${toRelative(file)}: lien hors dist ${match[1]}`);
    else if (!existsSync(target) || statSync(target).isDirectory()) failures.push(`${toRelative(file)}: cible absente ${match[1]}`);
  }
}

const sitemap = readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const sitemapFiles = sitemapUrls.map(sitemapPageFile);
if (new Set(sitemapUrls).size !== sitemapUrls.length) failures.push("Sitemap: URL dupliquée");
for (const [index, relative] of sitemapFiles.entries()) if (!existsSync(path.join(DIST, relative))) failures.push(`sitemap: page absente ${sitemapUrls[index]}`);
const actualHtmlFiles = files.filter((file) => file.endsWith(".html")).map(toRelative).sort();
const expectedHtmlFiles = [...sitemapFiles].sort();
const utilityHtmlFiles = [...(POLICY.utilityPageFiles || [])].sort();
const allowedHtmlFiles = [...expectedHtmlFiles, ...utilityHtmlFiles].sort();
for (const file of actualHtmlFiles.filter((item) => !allowedHtmlFiles.includes(item))) failures.push(`${file}: page HTML hors sitemap/allowlist`);
for (const file of expectedHtmlFiles.filter((item) => !actualHtmlFiles.includes(item))) failures.push(`${file}: page sitemap absente de l'artefact`);
for (const file of utilityHtmlFiles.filter((item) => !actualHtmlFiles.includes(item))) failures.push(`${file}: page utilitaire absente de l'artefact`);

const searchIndexPath = path.join(DIST, "assets", "search-index.js");
const searchContext = { window: {} };
vm.runInNewContext(readFileSync(searchIndexPath, "utf8"), searchContext, { filename: "assets/search-index.js" });
const searchEntries = searchContext.window.searchIndex || [];
const searchUrls = searchEntries.map((entry) => entry.url).sort();
if (new Set(searchUrls).size !== searchUrls.length) failures.push("Recherche: URL dupliquée");
for (const entry of searchEntries) {
  if (/\b(?:de l|[cdjlmnst])$/iu.test(String(entry.description || "").trim())) failures.push(`Recherche: description potentiellement tronquée ${entry.url}`);
}

const legalPage = path.join(DIST, "mentions-legales", "index.html");
if (!existsSync(legalPage)) failures.push("Mentions légales: page absente");
else {
  const legalHtml = readFileSync(legalPage, "utf8");
  for (const expected of ["NEBBAB Florent", "florentrenov@gmail.com", "GitHub, Inc.", "Aucun niveau global de conformité n’est revendiqué", "[DATE DU FUTUR DÉPLOIEMENT VALIDÉ]"]) {
    if (!legalHtml.includes(expected)) failures.push(`Mentions légales: contenu attendu absent ${expected}`);
  }
}

for (const forbiddenAsset of ["hero-basalte.png", "hero-puy-de-dome-green.png", "projets-auvergne-la-fayette.webp"]) {
  if (files.some((file) => path.basename(file) === forbiddenAsset)) failures.push(`Média sans droits présent dans l'artefact: ${forbiddenAsset}`);
}

for (const font of ["fraunces-variable.woff2", "ibm-plex-mono-400.woff2", "ibm-plex-sans-400.woff2", "ibm-plex-sans-500.woff2", "ibm-plex-sans-600.woff2"]) {
  const fontFile = path.join(DIST, "assets", "fonts", font);
  if (!existsSync(fontFile)) failures.push(`Police locale absente: ${font}`);
  else if (readFileSync(fontFile).subarray(0, 4).toString("ascii") !== "wOF2") failures.push(`Police locale invalide: ${font}`);
}
for (const license of ["OFL-Fraunces.txt", "OFL-IBM-Plex.txt"]) {
  const licenseFile = path.join(DIST, "assets", "fonts", license);
  if (!existsSync(licenseFile) || !/SIL OPEN FONT LICENSE Version 1\.1/i.test(readFileSync(licenseFile, "utf8"))) failures.push(`Licence de police absente ou invalide: ${license}`);
}
const techniquesSearchEntry = searchEntries.find((entry) => entry.url === "techniques/index.html");
if (!techniquesSearchEntry?.description.includes("cinq projets publiés")) failures.push("Recherche: périmètre des cinq projets absent de la fiche Techniques");
if (/dix premières opérations|dix premieres operations/iu.test(`${techniquesSearchEntry?.title || ""} ${techniquesSearchEntry?.description || ""} ${techniquesSearchEntry?.text || ""}`)) failures.push("Recherche: ancien périmètre de dix opérations encore visible");
for (const file of searchUrls.filter((item) => !expectedHtmlFiles.includes(item))) failures.push(`Recherche: page hors sitemap/allowlist ${file}`);
for (const file of expectedHtmlFiles.filter((item) => !searchUrls.includes(item))) failures.push(`Recherche: page sitemap non indexée ${file}`);

for (const id of POLICY.publishedProjectIds) {
  const projectFile = files.find((file) => file.endsWith("index.html") && readFileSync(file, "utf8").includes(`name="project-id" content="${id}"`));
  if (!projectFile) {
    failures.push(`${id}: page pré-rendue absente`);
    continue;
  }
  const html = readFileSync(projectFile, "utf8");
  if (!/<h1>[^<]+<\/h1>/i.test(html)) failures.push(`${id}: h1 absent sans JavaScript`);
  if (!/<p class="lead">[^<]+<\/p>/i.test(html)) failures.push(`${id}: résumé absent sans JavaScript`);
  if (!/<h2 id="sources">Sources<\/h2>/i.test(html)) failures.push(`${id}: sources absentes sans JavaScript`);
  if (/content="Voir aussi Tous les projets/i.test(html)) failures.push(`${id}: méta-description historique incorrecte`);
}

const manifestPath = path.join(DIST, "RELEASE-MANIFEST.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const currentCommit = gitValue("rev-parse", "HEAD");
const currentBranch = gitValue("branch", "--show-current");
const expectedProjectIds = [...POLICY.publishedProjectIds].sort();
const manifestProjectIds = [...(manifest.publishedProjectIds || [])].sort();
if (manifest.pageCount !== sitemapUrls.length) failures.push("Manifeste: nombre de pages publiques incohérent");
if (manifest.htmlFileCount !== actualHtmlFiles.length) failures.push("Manifeste: nombre de fichiers HTML incohérent");
if (manifest.utilityPageCount !== utilityHtmlFiles.length) failures.push("Manifeste: nombre de pages utilitaires incohérent");
if (manifest.sitemapUrlCount !== sitemapUrls.length) failures.push("Manifeste: sitemap incohérent");
if (manifest.publishedProjectCount !== POLICY.publishedProjectIds.length) failures.push("Manifeste: projets incohérents");
if (JSON.stringify(manifestProjectIds) !== JSON.stringify(expectedProjectIds)) failures.push("Manifeste: identifiants publiés incohérents");
if (manifest.sourceCommit !== currentCommit) failures.push("Manifeste: commit source incohérent");
if (manifest.sourceBranch !== currentBranch) failures.push("Manifeste: branche source incohérente");
if (!manifest.releaseId?.endsWith(`-${currentCommit.slice(0, 12)}`)) failures.push("Manifeste: identifiant de release incohérent");
if (!Number.isFinite(Date.parse(manifest.generatedAt))) failures.push("Manifeste: date invalide");
if (manifest.actorPageCount !== countPages("acteurs")) failures.push("Manifeste: nombre d'acteurs incohérent");
if (manifest.techniquePageCount !== countPages("techniques")) failures.push("Manifeste: nombre de techniques incohérent");
if (manifest.territoryPageCount !== countPages("territoires")) failures.push("Manifeste: nombre de territoires incohérent");
if (manifest.searchEntryCount !== searchEntries.length) failures.push("Manifeste: index de recherche incohérent");
if (manifest.validationDecision !== "human_approval_required") failures.push("Manifeste: décision humaine absente ou modifiée");
for (const exclusion of ["internal workspaces", "ambiguous project identities", "audit and validation documents", "working scripts and source registries"]) {
  if (!(manifest.exclusions || []).includes(exclusion)) failures.push(`Manifeste: exclusion absente ${exclusion}`);
}
for (const test of ["identity:check", "site:check", "public:build", "public:accessibility", "public:verify"]) {
  if (!(manifest.tests || []).some((item) => item.name === test)) failures.push(`Manifeste: test absent ${test}`);
}
if (manifest.artifactSha256 !== artifactHash()) failures.push("Manifeste: empreinte de l'artefact incohérente");

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  if (process.argv.includes("--record")) {
    manifest.tests = [
      { name: "identity:check", status: "passed" },
      { name: "site:check", status: "passed" },
      { name: "public:build", status: "passed" },
      { name: "public:accessibility", status: "passed" },
      { name: "public:verify", status: "passed" }
    ];
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  }
  console.log(`Artefact public vérifié: ${manifest.pageCount} pages, ${sitemapUrls.length} URL, ${manifest.publishedProjectCount} projets.`);
}
