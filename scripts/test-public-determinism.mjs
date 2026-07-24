import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function buildAndReadHash() {
  execFileSync(process.execPath, [path.join(ROOT, "scripts", "build-public.mjs")], { cwd: ROOT, stdio: "pipe" });
  return JSON.parse(readFileSync(path.join(ROOT, "dist", "RELEASE-MANIFEST.json"), "utf8")).artifactSha256;
}

const first = buildAndReadHash();
const second = buildAndReadHash();
if (first !== second) {
  console.error(`Build non déterministe: ${first} != ${second}`);
  process.exitCode = 1;
} else {
  console.log(`Build public déterministe: ${first}`);
}

