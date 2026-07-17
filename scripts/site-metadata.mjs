import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
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

const mode = process.argv.includes("--write") ? "write" : "check";
const config = JSON.parse(readFileSync(path.join(SITE_ROOT, "site.config.json"), "utf8"));

function urlFor(rel) {
  const base = config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`;
  return new URL(rel.replace(/index\.html$/, ""), base).href;
}

function escapeAttr(value) {
  return String(value).replace(/[&"]/g, (char) => ({ "&": "&amp;", '"': "&quot;" })[char]);
}

function firstUsefulText(html) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || html;
  const lead = main.match(/<p\b[^>]*class=["'][^"']*\blead\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)?.[1];
  const paragraph = main.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1];
  return stripTags(lead || paragraph || main);
}

function descriptionFor(html) {
  const h1 = extractTagContent(html, "h1");
  const text = firstUsefulText(html);
  const raw = text || `${h1}. ${config.defaultDescription}`;
  const clean = decodeEntities(raw).replace(/\s+/g, " ").trim();
  return clean.length > 158 ? `${clean.slice(0, 155).replace(/\s+\S*$/, "")}...` : clean;
}

function upsertMeta(head, name, content) {
  const tag = `<meta name="${name}" content="${escapeAttr(content)}">`;
  const rx = new RegExp(`<meta\\b(?=[^>]*name=["']${name}["'])[^>]*>`, "i");
  return rx.test(head) ? head.replace(rx, tag) : `${head}\n    ${tag}`;
}

function upsertProperty(head, property, content) {
  const tag = `<meta property="${property}" content="${escapeAttr(content)}">`;
  const rx = new RegExp(`<meta\\b(?=[^>]*property=["']${property}["'])[^>]*>`, "i");
  return rx.test(head) ? head.replace(rx, tag) : `${head}\n    ${tag}`;
}

function upsertCanonical(head, href) {
  const tag = `<link rel="canonical" href="${escapeAttr(href)}">`;
  const rx = /<link\b(?=[^>]*rel=["']canonical["'])[^>]*>/i;
  return rx.test(head) ? head.replace(rx, tag) : `${head}\n    ${tag}`;
}

function upsertJsonLd(head, rel, title, description, url) {
  if (rel !== "index.html") return head;
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": config.siteName,
    "url": config.baseUrl,
    "description": description,
  };
  const tag = `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
  const rx = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i;
  return rx.test(head) ? head.replace(rx, tag) : `${head}\n    ${tag}`;
}

function isIndexable(rel, html) {
  if (isInternalLab(rel)) return false;
  const robots = html.match(/<meta\b(?=[^>]*name=["']robots["'])[^>]*>/i);
  if (robots && /noindex/i.test(extractAttribute(robots[0], "content"))) return false;
  return true;
}

const failures = [];
const changed = [];
const titles = new Map();

for (const file of htmlFiles()) {
  const rel = relativeToSite(file);
  const html = readUtf8(file);
  const title = extractTagContent(html, "title");
  if (title) titles.set(title, [...(titles.get(title) || []), rel]);
  if (!isIndexable(rel, html)) continue;

  const url = urlFor(rel);
  const description = descriptionFor(html);
  let next = html.replace(/<head\b[^>]*>([\s\S]*?)<\/head>/i, (match, head) => {
    let nextHead = head;
    nextHead = upsertMeta(nextHead, "description", description);
    nextHead = upsertCanonical(nextHead, url);
    nextHead = upsertProperty(nextHead, "og:title", title || config.siteName);
    nextHead = upsertProperty(nextHead, "og:description", description);
    nextHead = upsertProperty(nextHead, "og:type", rel === "index.html" ? "website" : "article");
    nextHead = upsertProperty(nextHead, "og:url", url);
    nextHead = upsertJsonLd(nextHead, rel, title, description, url);
    return `<head>${nextHead}</head>`;
  });

  const required = [
    /<meta\b(?=[^>]*name=["']description["'])[^>]*>/i,
    /<link\b(?=[^>]*rel=["']canonical["'])[^>]*>/i,
    /<meta\b(?=[^>]*property=["']og:title["'])[^>]*>/i,
    /<meta\b(?=[^>]*property=["']og:description["'])[^>]*>/i,
    /<meta\b(?=[^>]*property=["']og:url["'])[^>]*>/i,
  ];
  for (const rx of required) {
    if (!rx.test(next)) failures.push(`${rel}: métadonnée manquante après génération ${rx}`);
  }
  if (next !== html) {
    changed.push(rel);
    if (mode === "write") writeFileSync(file, next, "utf8");
  }
}

for (const [title, pages] of titles) {
  if (title && pages.length > 1) failures.push(`titre dupliqué "${title}": ${pages.join(", ")}`);
}

if (mode === "check" && changed.length) {
  failures.push(`${changed.length} page(s) nécessitent une mise à jour SEO. Lancer npm.cmd run site:seo:write puis contrôler le diff.`);
}

if (failures.length) {
  console.error("SEO non conforme:");
  for (const failure of failures.slice(0, 60)) console.error(`- ${failure}`);
  if (failures.length > 60) console.error(`- ... ${failures.length - 60} erreurs supplémentaires`);
  process.exit(1);
}

console.log(mode === "write" ? `SEO mis à jour: ${changed.length} page(s)` : "SEO conforme.");
