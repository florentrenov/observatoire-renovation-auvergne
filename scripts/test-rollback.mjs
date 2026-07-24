import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.resolve(ROOT, "dist");
const CACHE_ROOT = path.resolve(ROOT, ".release-cache");
const TEST_ROOT = path.resolve(CACHE_ROOT, "rollback-test");
const STABLE = path.resolve(TEST_ROOT, "stable");
const DEPLOYED = path.resolve(TEST_ROOT, "deployed");

function assertSafeTargets() {
  for (const target of [CACHE_ROOT, TEST_ROOT, STABLE, DEPLOYED]) {
    if (!target.startsWith(`${ROOT}${path.sep}`)) throw new Error(`Cible rollback hors dépôt: ${target}`);
  }
  if (!existsSync(DIST)) throw new Error("Artefact dist absent");
}

function walk(directory, files = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function treeHash(directory) {
  const digest = crypto.createHash("sha256");
  for (const file of walk(directory).sort()) {
    digest.update(path.relative(directory, file).split(path.sep).join("/")).update("\0").update(readFileSync(file)).update("\n");
  }
  return digest.digest("hex");
}

assertSafeTargets();
const statusBefore = execFileSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf8" });
rmSync(TEST_ROOT, { recursive: true, force: true });
mkdirSync(TEST_ROOT, { recursive: true });
cpSync(DIST, STABLE, { recursive: true });
cpSync(DIST, DEPLOYED, { recursive: true });

const stableHash = treeHash(STABLE);
writeFileSync(path.join(DEPLOYED, "ROLLBACK-SIMULATION.txt"), "artefact instable simulé\n", "utf8");
const changedHash = treeHash(DEPLOYED);
if (changedHash === stableHash) throw new Error("La simulation de dérive n'a pas modifié l'artefact");

rmSync(DEPLOYED, { recursive: true, force: true });
cpSync(STABLE, DEPLOYED, { recursive: true });
const restoredHash = treeHash(DEPLOYED);
if (restoredHash !== stableHash) throw new Error("Le rollback simulé n'a pas restauré l'artefact stable");

const statusAfter = execFileSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf8" });
if (statusAfter !== statusBefore) throw new Error("Le test de rollback a modifié les sources suivies");

const report = {
  schemaVersion: "1.0.0",
  testedAt: new Date().toISOString(),
  stableArtifactHash: stableHash,
  simulatedChangedHash: changedHash,
  restoredArtifactHash: restoredHash,
  restorationSucceeded: true,
  trackedSourcesUnchanged: true,
  publicDeploymentTouched: false
};
writeFileSync(path.join(TEST_ROOT, "result.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`Rollback local simulé réussi: ${restoredHash}`);

