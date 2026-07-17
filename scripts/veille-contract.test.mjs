import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const allowedCategories = new Set(["aides", "réglementation", "territoire", "acteurs", "projets", "données"]);

const fixtures = [
  { id: "draft-complete", title: "Brouillon", date: "2026-01-10", category: "aides", sourceName: "ANAH", sourceUrl: "https://example.org/source", summary: "Résumé.", verificationDate: "2026-01-11", status: "draft", humanValidated: true },
  { id: "verified-not-published", title: "Vérifié", date: "2026-01-10", category: "aides", sourceName: "ANAH", sourceUrl: "https://example.org/source", summary: "Résumé.", verificationDate: "2026-01-11", status: "verified", humanValidated: true },
  { id: "published-valid", title: "Publication valide", date: "2026-01-10", category: "aides", sourceName: "ANAH", sourceUrl: "https://www.anah.gouv.fr/", summary: "Résumé validé.", verificationDate: "2026-01-11", status: "published", humanValidated: true },
  { id: "missing-source", title: "Sans source", date: "2026-01-10", category: "aides", sourceName: "ANAH", summary: "Résumé.", verificationDate: "2026-01-11", status: "published", humanValidated: true },
  { id: "fake-url", title: "URL factice", date: "2026-01-10", category: "aides", sourceName: "ANAH", sourceUrl: "#", summary: "Résumé.", verificationDate: "2026-01-11", status: "published", humanValidated: true },
  { id: "future-date", title: "Date future", date: "2999-01-10", category: "aides", sourceName: "ANAH", sourceUrl: "https://www.anah.gouv.fr/", summary: "Résumé.", verificationDate: "2026-01-11", status: "published", humanValidated: true },
  { id: "empty-summary", title: "Résumé vide", date: "2026-01-10", category: "aides", sourceName: "ANAH", sourceUrl: "https://www.anah.gouv.fr/", summary: "", verificationDate: "2026-01-11", status: "published", humanValidated: true },
  { id: "unknown-status", title: "Statut inconnu", date: "2026-01-10", category: "aides", sourceName: "ANAH", sourceUrl: "https://www.anah.gouv.fr/", summary: "Résumé.", verificationDate: "2026-01-11", status: "ready", humanValidated: true },
  { id: "no-human-validation", title: "Sans validation", date: "2026-01-10", category: "aides", sourceName: "ANAH", sourceUrl: "https://www.anah.gouv.fr/", summary: "Résumé.", verificationDate: "2026-01-11", status: "published", humanValidated: false },
  { id: "accented", title: "MaPrimeRénov’", date: "2026-01-10", category: "réglementation", sourceName: "Service-Public", sourceUrl: "https://www.service-public.fr/", summary: "Résumé accentué.", verificationDate: "2026-01-11", status: "published", humanValidated: true },
];

function validUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function validate(item, seen = new Set()) {
  const errors = [];
  if (!item.id || seen.has(item.id)) errors.push("id");
  if (item.status !== "published" && item.status !== "publie") errors.push("status");
  if (!item.title) errors.push("title");
  if (!item.summary) errors.push("summary");
  if (!item.date || Number.isNaN(Date.parse(item.date))) errors.push("date");
  if (Date.parse(item.date) > Date.now()) errors.push("date future");
  if (!item.sourceName) errors.push("sourceName");
  if (!validUrl(item.sourceUrl)) errors.push("sourceUrl");
  if (!item.verificationDate || Number.isNaN(Date.parse(item.verificationDate))) errors.push("verificationDate");
  if (!allowedCategories.has(item.category)) errors.push("category");
  if (item.humanValidated !== true) errors.push("humanValidated");
  return errors;
}

const seen = new Set();
const exportable = [];
const report = [];
for (const item of fixtures) {
  const errors = validate(item, seen);
  seen.add(item.id);
  report.push({ id: item.id, exportable: errors.length === 0, errors });
  if (!errors.length) exportable.push(item);
}

const expected = ["published-valid", "accented"];
const actual = exportable.map((item) => item.id);
if (actual.join("|") !== expected.join("|")) {
  console.error(JSON.stringify(report, null, 2));
  throw new Error(`Export veille invalide: attendu ${expected.join(", ")}, obtenu ${actual.join(", ")}`);
}

console.log(`Contrat veille OK: ${exportable.length} fixtures exportables sur ${fixtures.length}`);

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptsDir, "..");
const dataFile = path.join(siteRoot, "assets", "veille-data.js");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(readFileSync(dataFile, "utf8"), context, { filename: dataFile });

const publishedItems = context.window.watchItems;
if (!Array.isArray(publishedItems)) throw new Error("window.watchItems doit être un tableau");

const publicationErrors = [];
const publishedIds = new Set();
for (const item of publishedItems) {
  const errors = validate(item, publishedIds);
  publishedIds.add(item.id);
  if (!item.targetUrl || !existsSync(path.join(siteRoot, "veille", item.targetUrl))) errors.push("targetUrl");
  if (!item.legalStatus) errors.push("legalStatus");
  if (errors.length) publicationErrors.push({ id: item.id, errors });
}

if (publicationErrors.length) {
  console.error(JSON.stringify(publicationErrors, null, 2));
  throw new Error("Une publication réelle de veille ne respecte pas le contrat");
}

const dpeDraft = publishedItems.find((item) => item.id === "VEILLE-REG-2026-001");
if (!dpeDraft || dpeDraft.currentFactor !== 1.9 || dpeDraft.proposedFactor !== 1.7 || !/consultation/i.test(dpeDraft.legalStatus)) {
  throw new Error("Le statut ou les facteurs du projet DPE ne sont pas correctement qualifiés");
}

const fossilDraft = publishedItems.find((item) => item.id === "VEILLE-REG-2026-002");
if (
  !fossilDraft
  || fossilDraft.proposedThreshold !== 79
  || fossilDraft.proposedThresholdScope !== "construction neuve"
  || fossilDraft.thresholdAmbiguity !== true
  || !/post-consultation/i.test(fossilDraft.legalStatus)
  || !/non publié/i.test(fossilDraft.legalStatus)
) {
  throw new Error("Le statut, le périmètre ou l’ambiguïté du projet sur les équipements fossiles sont mal qualifiés");
}

const networkDraft = publishedItems.find((item) => item.id === "VEILLE-REG-2026-003");
if (
  !networkDraft
  || networkDraft.legalStatus !== "Consultation publique en cours"
  || networkDraft.methodsStatus !== "projet d’arrêté"
  || networkDraft.thresholdsSource !== "Code de l’énergie"
  || networkDraft.calculationGuideAvailable !== false
  || networkDraft.consultationEndDate !== "2026-07-31"
  || networkDraft.seasonalPerformanceFactorMinimum !== 2.5
  || networkDraft.improvementPlanThresholdMW !== 5
) {
  throw new Error("Le projet sur les réseaux efficaces ne distingue pas correctement le droit en vigueur des modalités encore en consultation");
}

console.log(`Publications veille OK: ${publishedItems.length} élément(s) public(s) validé(s)`);
