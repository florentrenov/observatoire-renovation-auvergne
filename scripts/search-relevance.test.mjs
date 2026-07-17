import vm from "node:vm";
import path from "node:path";
import { SITE_ROOT, readUtf8 } from "./site-utils.mjs";

const context = { window: {} };
vm.createContext(context);
vm.runInContext(readUtf8(path.join(SITE_ROOT, "assets", "search-index.js")), context);
const index = context.window.searchIndex || [];

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[-–—]/g, " ")
    .replace(/œ/g, "oe")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const prepared = index.map((item) => ({
  ...item,
  titleIndex: normalize(item.title),
  keywordIndex: normalize((item.keywords || []).join(" ")),
  descriptionIndex: normalize(item.description),
  textIndex: normalize(item.text),
}));

function search(query) {
  const normalized = normalize(query);
  const terms = normalized.split(" ").filter((term) => term.length > 2);
  if (!terms.length) return [];
  return prepared.map((item) => {
    const contains = (term) => item.titleIndex.includes(term) || item.keywordIndex.includes(term) || item.descriptionIndex.includes(term) || item.textIndex.includes(term);
    if (!terms.every(contains)) return { item, score: 0 };
    const score = terms.reduce((total, term) => {
      let next = total;
      if (item.titleIndex === normalized) next += 50;
      if (item.titleIndex.includes(term)) next += 15;
      if (item.keywordIndex.includes(term)) next += 10;
      if (item.descriptionIndex.includes(term)) next += 5;
      if (item.textIndex.includes(term)) next += 1;
      return next;
    }, 0);
    return { item, score };
  }).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title)).map((entry) => entry.item);
}

const cases = [
  ["DPE", "DPE"],
  ["audit énergétique", "Audit énergétique"],
  ["rénovation", null],
  ["renovation", null],
  ["La Fayette", "Lycée La Fayette"],
  ["Teilhard", "Collège Teilhard de Chardin"],
  ["Clermont-Ferrand", null],
  ["Puy-de-Dôme", null],
  ["MaPrimeRénov", "MaPrimeRénov'"],
  ["photovoltaïque", null],
  ["terme-introuvable-xyz", ""],
  ["@@@ DPE !!!", "DPE"],
];

const failures = [];
for (const [query, expectedFirst] of cases) {
  const results = search(query);
  const urls = new Set();
  for (const result of results) {
    if (urls.has(result.url)) failures.push(`${query}: doublon URL ${result.url}`);
    urls.add(result.url);
    if (/veille-automatique|analyse-connaissances/.test(result.url)) failures.push(`${query}: laboratoire dans les résultats`);
  }
  if (expectedFirst === "" && results.length !== 0) failures.push(`${query}: attendu 0 résultat, obtenu ${results.length}`);
  if (expectedFirst && results[0]?.title !== expectedFirst) failures.push(`${query}: premier résultat attendu "${expectedFirst}", obtenu "${results[0]?.title || "aucun"}"`);
  if (expectedFirst !== "" && results.length === 0) failures.push(`${query}: aucun résultat`);
}

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Pertinence recherche OK: ${cases.length} requêtes testées`);
