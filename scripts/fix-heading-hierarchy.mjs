import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED_FILES = [
  "a-propos/index.html",
  "acteurs-locaux/index.html",
  "acteurs/bouygues-batiment-sud-est/index.html",
  "acteurs/cdr-construction/index.html",
  "acteurs/chm-architectes/index.html",
  "acteurs/departement-du-puy-de-dome/index.html",
  "acteurs/ecib-project/index.html",
  "acteurs/etat-plan-france-relance/index.html",
  "acteurs/idex/index.html",
  "acteurs/laclautre-ingenierie/index.html",
  "acteurs/region-auvergne-rhone-alpes/index.html",
  "acteurs/sintec/index.html",
  "acteurs/spl-oser/index.html",
  "acteurs/tabard-construction/index.html",
  "acteurs/ville-de-clermont-ferrand/index.html",
  "acteurs/vinci-facilities/index.html",
  "aides-locales/index.html",
  "analyses/index.html",
  "documentation/index.html",
  "methode/index.html",
  "sources/index.html",
  "techniques/index.html",
  "territoires/index.html",
];

const changed = [];
for (const relative of EXPECTED_FILES) {
  const file = path.join(ROOT, relative);
  const html = readFileSync(file, "utf8");
  if (!/<h3\b/i.test(html)) continue;
  const next = html
    .replace(/<h3(\s[^>]*)?>/gi, (_match, attributes = "") => {
      if (/\bclass=["']/i.test(attributes)) {
        return `<h2${attributes.replace(/\bclass=(["'])([^"']*)\1/i, (_all, quote, classes) => `class=${quote}${classes} card-heading${quote}`)}>`;
      }
      return `<h2 class="card-heading"${attributes}>`;
    })
    .replace(/<\/h3>/gi, "</h2>");
  if (next !== html) {
    writeFileSync(file, next, "utf8");
    changed.push(relative);
  }
}

console.log(`Hiérarchie corrigée: ${changed.length} page(s).`);
for (const relative of changed) console.log(`- ${relative}`);
