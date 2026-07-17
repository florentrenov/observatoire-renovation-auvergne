import { writeFileSync } from "node:fs";
import path from "node:path";
import { SITE_ROOT } from "./site-utils.mjs";

const fixtures = [
  {
    name: "projet-valide",
    frontmatter: { id: "PDD-FIXTURE", statut_publication: "public", titre: "Projet fixture", territoire: "Puy-de-Dôme" },
    body: "## Sources\n- https://example.org/source\n\n## Résumé\nProjet utilisé seulement pour tester le mapping.",
  },
  { name: "identifiant-manquant", frontmatter: { statut_publication: "public", titre: "Sans id" }, body: "## Sources\n- https://example.org/source" },
  { name: "source-absente", frontmatter: { id: "PDD-NOSOURCE", statut_publication: "public", titre: "Sans source" }, body: "Résumé." },
  { name: "statut-prive", frontmatter: { id: "PDD-PRIVATE", statut_publication: "privé", titre: "Privé" }, body: "## Sources\n- https://example.org/source" },
  { name: "caracteres-francais", frontmatter: { id: "PDD-ACCENT", statut_publication: "public", titre: "École rénovée" }, body: "## Sources\n- https://example.org/source\nRésumé accentué." },
];

function validate(note) {
  const errors = [];
  const fm = note.frontmatter || {};
  if (fm.statut_publication !== "public") errors.push("statut non public");
  if (!fm.id) errors.push("id manquant");
  if (!fm.titre) errors.push("titre manquant");
  if (!/https?:\/\//.test(note.body || "")) errors.push("source absente");
  return errors;
}

function mapNote(note) {
  return {
    id: note.frontmatter.id,
    title: note.frontmatter.titre,
    place: note.frontmatter.territoire || "à documenter",
    source: "fixture dry-run, non exportée",
  };
}

const rows = fixtures.map((note) => {
  const errors = validate(note);
  return {
    fixture: note.name,
    action: errors.length ? "rejeté" : "export simulé",
    errors,
    mapped: errors.length ? null : mapNote(note),
  };
});

const md = [
  "# Dry-run export Obsidian",
  "",
  "Simulation sur fixtures séparées. Aucun fichier du vault Obsidian n'est lu, créé ou modifié.",
  "",
  "| Fixture | Action | Erreurs |",
  "|---|---|---|",
  ...rows.map((row) => `| ${row.fixture} | ${row.action} | ${row.errors.join(", ") || "aucune"} |`),
  "",
  "## Mapping cible",
  "",
  "- `frontmatter.id` → `project.id`",
  "- `frontmatter.titre` → `project.title`",
  "- `frontmatter.territoire` → `project.place` ou territoire associé",
  "- section `Sources` → `project.sources`",
  "- `statut_publication: public` requis pour tout export",
  "",
];

writeFileSync(path.join(SITE_ROOT, "docs", "obsidian-export-dry-run.md"), md.join("\n"), "utf8");
console.log(`Dry-run Obsidian: ${rows.filter((row) => row.action === "export simulé").length} export(s) simulé(s), ${rows.filter((row) => row.action === "rejeté").length} rejet(s)`);
