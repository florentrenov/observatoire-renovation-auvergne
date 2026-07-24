import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");

function walk(directory, files = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

function hexToRgb(value) {
  const hex = value.replace("#", "");
  return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

function luminance(hex) {
  const channels = hexToRgb(hex).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground, background) {
  const left = luminance(foreground);
  const right = luminance(background);
  return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
}

const failures = [];
const htmlFiles = walk(DIST).filter((file) => file.endsWith(".html"));
for (const file of htmlFiles) {
  const relative = path.relative(DIST, file).split(path.sep).join("/");
  const html = readFileSync(file, "utf8");
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || "";
  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((match) => ({
    level: Number(match[1]),
    text: stripTags(match[2]),
  }));
  const h1Count = headings.filter((heading) => heading.level === 1).length;
  if (h1Count !== 1) failures.push(`${relative}: ${h1Count} titre(s) H1`);
  const mainMarkup = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || "";
  const noJavaScriptText = stripTags(mainMarkup.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " "));
  if (noJavaScriptText.length < 80) failures.push(`${relative}: contenu principal insuffisant sans JavaScript (${noJavaScriptText.length} caractères)`);
  for (const heading of headings.filter((item) => !item.text)) failures.push(`${relative}: titre H${heading.level} vide`);
  for (let index = 1; index < headings.length; index += 1) {
    if (headings[index].level - headings[index - 1].level > 1) {
      failures.push(`${relative}: saut H${headings[index - 1].level} vers H${headings[index].level}`);
    }
  }

  const skipLinks = [...body.matchAll(/<a\b(?=[^>]*class=["'][^"']*\bskip-link\b)(?=[^>]*href=["']#([^"']+)["'])[^>]*>/gi)];
  if (skipLinks.length !== 1) {
    failures.push(`${relative}: ${skipLinks.length} lien(s) d'évitement`);
  } else {
    const target = skipLinks[0][1];
    const targetCount = [...html.matchAll(new RegExp(`\\bid=["']${target}["']`, "gi"))].length;
    if (targetCount !== 1) failures.push(`${relative}: cible #${target} présente ${targetCount} fois`);
    const firstFocusable = body.search(/<(?:a|button|input|select|textarea|summary)\b/i);
    if (firstFocusable !== skipLinks[0].index) failures.push(`${relative}: le lien d'évitement n'est pas le premier contrôle focusable`);
  }
}

const css = readFileSync(path.join(DIST, "assets", "styles.css"), "utf8");
const color = (name) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"))?.[1];
const pairs = [
  ["lave", "basalte", 4.5, "texte et liens Lave/Basalte"],
  ["cendre", "basalte", 4.5, "texte principal Cendre/Basalte"],
  ["brume", "basalte", 4.5, "texte secondaire Brume/Basalte"],
  ["ocre-auvergne", "basalte", 3, "focus Ocre/Basalte"],
];
for (const [foregroundName, backgroundName, threshold, label] of pairs) {
  const foreground = color(foregroundName);
  const background = color(backgroundName);
  if (!foreground || !background) {
    failures.push(`Contraste: couleur absente pour ${label}`);
    continue;
  }
  const ratio = contrast(foreground, background);
  if (ratio < threshold) failures.push(`Contraste: ${label} ${ratio.toFixed(2)}:1 < ${threshold}:1`);
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Accessibilité ciblée conforme: ${htmlFiles.length} HTML, titres, lien d'évitement et 4 couples de contraste.`);
}
