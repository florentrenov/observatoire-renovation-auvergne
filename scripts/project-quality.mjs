import { writeFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { SITE_ROOT, readUtf8 } from "./site-utils.mjs";

function loadCases() {
  const file = path.join(SITE_ROOT, "assets", "observatoire.js");
  const context = { document: { addEventListener() {}, querySelector() { return null; } }, window: {}, globalThis: {} };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(`${readUtf8(file)}\nglobalThis.__cases = cases;`, context, { filename: file });
  return context.__cases || [];
}

function hasGap(value) {
  return /documenter|non publi|pas encore|partielle|absent|non repris|non disponible/i.test(String(value || ""));
}

const rows = loadCases().map((item) => {
  const warnings = [];
  if (hasGap(item.verificationDate)) warnings.push("date de vérification");
  if (hasGap(item.surface)) warnings.push("surface");
  if (hasGap(item.amount)) warnings.push("montant");
  if (hasGap(item.performance)) warnings.push("résultats mesurés");
  if (!item.sources?.length) warnings.push("sources");
  const score = Math.max(0, 100 - warnings.length * 12 - (item.documentStatus?.includes("partielle") ? 10 : 0));
  return {
    id: item.id,
    title: item.title,
    status: item.status,
    documentStatus: item.documentStatus,
    confidence: item.confidence,
    score,
    warnings,
    imageRights: item.id === "PDD-001" ? "image La Fayette à vérifier avant usage social global" : "aucune image dédiée contrôlée",
  };
});

const md = [
  "# Qualité des projets",
  "",
  "Ce tableau n'ajoute aucune donnée. Il qualifie les lacunes visibles dans `assets/observatoire.js`.",
  "",
  "| ID | Projet | Statut | Documentation | Score | Points à documenter | Droit image |",
  "|---|---|---|---|---:|---|---|",
  ...rows.map((row) => `| ${row.id} | ${row.title} | ${row.status} | ${row.documentStatus} | ${row.score} | ${row.warnings.join(", ") || "aucun blocage détecté"} | ${row.imageRights} |`),
  "",
];

writeFileSync(path.join(SITE_ROOT, "docs", "project-quality.json"), `${JSON.stringify(rows, null, 2)}\n`, "utf8");
writeFileSync(path.join(SITE_ROOT, "docs", "project-quality.md"), md.join("\n"), "utf8");
console.log(`Qualité projets: ${rows.length} projets audités`);
