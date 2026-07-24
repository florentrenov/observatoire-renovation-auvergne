import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SITE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const TEXT_EXTENSIONS = new Set([
  ".html",
  ".css",
  ".js",
  ".json",
  ".md",
  ".xml",
  ".txt",
  ".webmanifest",
]);

export const PUBLIC_NAV = [
  "Accueil",
  "Projets d'Auvergne",
  "Veille",
  "Acteurs",
  "Sources",
  "À propos",
];

export const FORBIDDEN_HEADER_LABELS = [
  "Méthode",
  "Observatoire",
  "Techniques",
  "Territoires",
  "Analyses",
];

export function isInternalLab(relativePath) {
  return relativePath.startsWith("internal/") || relativePath === "veille-automatique/index.html" || relativePath.startsWith("analyse-connaissances/");
}

export function toPosix(value) {
  return value.split(path.sep).join("/");
}

export function relativeToSite(file) {
  return toPosix(path.relative(SITE_ROOT, file));
}

export function walk(dir = SITE_ROOT, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist", ".release-cache"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

export function htmlFiles() {
  return walk().filter((file) => file.endsWith(".html"));
}

export function textFiles() {
  return walk().filter((file) => TEXT_EXTENSIONS.has(path.extname(file).toLowerCase()));
}

export function readUtf8(file) {
  return readFileSync(file, "utf8");
}

export function fileSize(file) {
  return statSync(file).size;
}

export function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function extractTagContent(html, tag) {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? stripTags(match[1]) : "";
}

export function extractAttribute(tag, attr) {
  const match = tag.match(new RegExp(`${attr}=(["'])(.*?)\\1`, "i"));
  return match ? decodeEntities(match[2]) : "";
}

export function localHrefTarget(fromFile, rawUrl) {
  if (!rawUrl || rawUrl.startsWith("#")) return null;
  if (/^(https?:|mailto:|tel:|data:|\/\/)/i.test(rawUrl)) return null;
  const [withoutHash] = rawUrl.split("#");
  const [withoutQuery] = withoutHash.split("?");
  if (!withoutQuery) return null;
  return path.resolve(path.dirname(fromFile), withoutQuery);
}

export function activeSectionFor(relativePath) {
  if (relativePath === "index.html") return "Accueil";
  if (relativePath.startsWith("etudes-de-cas/")) return "Projets d'Auvergne";
  if (relativePath.startsWith("veille/")) return "Veille";
  if (relativePath.startsWith("acteurs/")) return "Acteurs";
  if (relativePath.startsWith("sources/")) return "Sources";
  if (relativePath.startsWith("a-propos/")) return "À propos";
  return "";
}
