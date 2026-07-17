import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { SITE_ROOT, readUtf8 } from "./site-utils.mjs";

function slugActor(value) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/œ/g, "oe").replace(/æ/g, "ae").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function loadCases() {
  const file = path.join(SITE_ROOT, "assets", "observatoire.js");
  const context = { document: { addEventListener() {}, querySelector() { return null; } }, window: {}, globalThis: {} };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(`${readUtf8(file)}\nglobalThis.__cases = cases;`, context, { filename: file });
  return context.__cases || [];
}

function add(map, key, value) {
  if (!map[key]) map[key] = [];
  if (!map[key].includes(value)) map[key].push(value);
}

const relations = {
  projectToActors: {},
  projectToTechniques: {},
  projectToSources: {},
  projectToTerritory: {},
  actorToProjects: {},
  techniqueToProjects: {},
  territoryToProjects: {},
  sourceToProjects: {},
  warnings: [],
};

for (const item of loadCases()) {
  relations.projectToTerritory[item.id] = [item.place, "Puy-de-Dôme"].filter(Boolean);
  for (const territory of relations.projectToTerritory[item.id]) add(relations.territoryToProjects, territory, item.id);
  relations.projectToTechniques[item.id] = [...new Set([...(item.badges || []), ...(item.tech || [])])];
  for (const technique of relations.projectToTechniques[item.id]) add(relations.techniqueToProjects, technique, item.id);
  relations.projectToSources[item.id] = (item.sources || []).map(([label, url]) => ({ label, url }));
  for (const source of relations.projectToSources[item.id]) add(relations.sourceToProjects, source.url, item.id);
  relations.projectToActors[item.id] = [];
  for (const group of item.actors || []) {
    for (const name of group.names || []) {
      relations.projectToActors[item.id].push({ role: group.role, name });
      add(relations.actorToProjects, name, item.id);
      const actorPage = path.join(SITE_ROOT, "acteurs", slugActor(name), "index.html");
      if (!existsSync(actorPage)) relations.warnings.push(`${item.id}: page acteur absente pour ${name}`);
    }
  }
}

const md = [
  "# Relations de contenu",
  "",
  "Index dérivé uniquement des projets présents dans `assets/observatoire.js`.",
  "",
  "## Acteurs vers projets",
  "",
  ...Object.entries(relations.actorToProjects).sort().map(([actor, projects]) => `- ${actor} : ${projects.join(", ")}`),
  "",
  "## Techniques vers projets",
  "",
  ...Object.entries(relations.techniqueToProjects).sort().map(([tech, projects]) => `- ${tech} : ${projects.join(", ")}`),
  "",
  "## Avertissements",
  "",
  ...(relations.warnings.length ? relations.warnings.map((warning) => `- ${warning}`) : ["- Aucun lien absent détecté."]),
  "",
];

writeFileSync(path.join(SITE_ROOT, "docs", "relations.json"), `${JSON.stringify(relations, null, 2)}\n`, "utf8");
writeFileSync(path.join(SITE_ROOT, "docs", "relations.md"), md.join("\n"), "utf8");
console.log(`Relations: ${Object.keys(relations.actorToProjects).length} acteurs, ${Object.keys(relations.techniqueToProjects).length} techniques`);
if (relations.warnings.length) {
  for (const warning of relations.warnings) console.warn(`! ${warning}`);
}
