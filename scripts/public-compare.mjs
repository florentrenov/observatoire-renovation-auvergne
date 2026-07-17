import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { SITE_ROOT, walk } from "./site-utils.mjs";

const auditRoot = process.env.PUBLIC_AUDIT_DIR || path.join(process.env.TEMP || process.env.TMP || "", "voltcity-public-audit-observatoire-renovation-auvergne");

function digest(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function tree(root) {
  const out = new Map();
  for (const file of walk(root)) {
    if (file.includes(`${path.sep}.git${path.sep}`)) continue;
    out.set(path.relative(root, file).split(path.sep).join("/"), digest(file));
  }
  return out;
}

if (!existsSync(auditRoot)) {
  console.error(`Clone d'audit introuvable: ${auditRoot}`);
  console.error("Créer un clone d'audit hors vault puis relancer avec PUBLIC_AUDIT_DIR.");
  process.exit(1);
}

const local = tree(SITE_ROOT);
const remote = tree(auditRoot);
const onlyLocal = [...local.keys()].filter((key) => !remote.has(key)).sort();
const onlyPublic = [...remote.keys()].filter((key) => !local.has(key)).sort();
const changed = [...local.keys()].filter((key) => remote.has(key) && local.get(key) !== remote.get(key)).sort();

const report = {
  auditRoot,
  localFiles: local.size,
  publicFiles: remote.size,
  onlyLocal,
  onlyPublic,
  changed,
};

const md = [
  "# Comparaison avec le dépôt public",
  "",
  `Clone d'audit : \`${auditRoot}\``,
  "",
  `- Fichiers locaux : ${local.size}`,
  `- Fichiers publics : ${remote.size}`,
  `- Uniquement locaux : ${onlyLocal.length}`,
  `- Uniquement publics : ${onlyPublic.length}`,
  `- Modifiés : ${changed.length}`,
  "",
  "## Uniquement locaux",
  "",
  ...(onlyLocal.length ? onlyLocal.map((item) => `- ${item}`) : ["- Aucun"]),
  "",
  "## Uniquement publics",
  "",
  ...(onlyPublic.length ? onlyPublic.map((item) => `- ${item}`) : ["- Aucun"]),
  "",
  "## Modifiés",
  "",
  ...(changed.length ? changed.map((item) => `- ${item}`) : ["- Aucun"]),
  "",
];

writeFileSync(path.join(SITE_ROOT, "docs", "public-compare.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(path.join(SITE_ROOT, "docs", "public-compare.md"), md.join("\n"), "utf8");
console.log(`Comparaison publique: ${onlyLocal.length} locaux, ${onlyPublic.length} publics, ${changed.length} modifiés`);
