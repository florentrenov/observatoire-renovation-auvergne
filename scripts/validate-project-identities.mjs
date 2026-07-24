import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = path.join(ROOT, "data", "registry", "project-identities.json");

export function loadRegistry() {
  return JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
}

export function validateRegistry(registry = loadRegistry()) {
  const failures = [];
  const allowed = new Set(registry.policy?.allowedStatuses || []);
  const seenIds = new Set();
  const seenSlugs = new Set();

  if (registry.policy?.immutableIds !== true || registry.policy?.reuseForbidden !== true) {
    failures.push("La politique doit rendre les identifiants immuables et non réutilisables.");
  }

  for (const entry of registry.entries || []) {
    if (!/^PDD-\d{3}$/.test(entry.id || "")) failures.push(`Identifiant invalide: ${entry.id || "vide"}`);
    if (seenIds.has(entry.id)) failures.push(`Identifiant dupliqué: ${entry.id}`);
    seenIds.add(entry.id);
    if (!allowed.has(entry.status)) failures.push(`${entry.id}: statut inconnu ${entry.status}`);

    if (entry.status === "actif") {
      if (!entry.canonicalSlug || !entry.canonicalName) failures.push(`${entry.id}: identité active incomplète`);
      if (entry.publicationStatus !== "public") failures.push(`${entry.id}: identité active non publique dans le registre P0`);
      if (seenSlugs.has(entry.canonicalSlug)) failures.push(`Slug dupliqué: ${entry.canonicalSlug}`);
      seenSlugs.add(entry.canonicalSlug);
    }

    if (entry.status === "ambigu") {
      if (entry.publicationStatus !== "non_publiable") failures.push(`${entry.id}: identité ambiguë publiable`);
      if (entry.canonicalSlug || entry.canonicalName) failures.push(`${entry.id}: identité ambiguë arbitrairement canonisée`);
      if (!Array.isArray(entry.candidates) || entry.candidates.length < 2) failures.push(`${entry.id}: candidats insuffisants`);
    }

    if (["remplace", "fusionne"].includes(entry.status) && !entry.successorId) {
      failures.push(`${entry.id}: successeur absent pour un identifiant ${entry.status}`);
    }
  }

  for (const id of ["PDD-006", "PDD-007", "PDD-008", "PDD-009"]) {
    const entry = (registry.entries || []).find((item) => item.id === id);
    if (!entry || entry.status !== "ambigu" || entry.publicationStatus !== "non_publiable") {
      failures.push(`${id}: le gel P0 n'est pas effectif`);
    }
  }

  return failures;
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  const registry = loadRegistry();
  const failures = validateRegistry(registry);
  if (failures.length) {
    console.error(failures.map((failure) => `- ${failure}`).join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`Registre d'identités valide: ${registry.entries.length} identifiants, 4 gelés.`);
  }
}

