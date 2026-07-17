import { readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { SITE_ROOT, htmlFiles, readUtf8, relativeToSite, walk } from "./site-utils.mjs";

function dimensions(file) {
  const buffer = readFileSync(file);
  if (buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer.slice(0, 4).toString("ascii") === "RIFF" && buffer.slice(8, 12).toString("ascii") === "WEBP") {
    const type = buffer.slice(12, 16).toString("ascii");
    if (type === "VP8X") return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
    if (type === "VP8 ") return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xc3) return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      offset += 2 + length;
    }
  }
  return { width: null, height: null };
}

const media = walk().filter((file) => /\.(png|jpe?g|webp|gif|svg|ico)$/i.test(file));
const html = htmlFiles().map((file) => ({ rel: relativeToSite(file), text: readUtf8(file) }));
const css = walk().filter((file) => file.endsWith(".css")).map((file) => ({ rel: relativeToSite(file), text: readUtf8(file) }));

const rows = media.map((file) => {
  const rel = relativeToSite(file);
  const usage = [
    ...html.filter((item) => item.text.includes(rel) || item.text.includes(path.basename(rel))).map((item) => item.rel),
    ...css.filter((item) => item.text.includes(rel) || item.text.includes(path.basename(rel))).map((item) => item.rel),
  ];
  const dim = dimensions(file);
  return {
    path: rel,
    bytes: statSync(file).size,
    format: path.extname(file).slice(1).toLowerCase(),
    width: dim.width,
    height: dim.height,
    usage: [...new Set(usage)].sort(),
    rights: rel.includes("la-fayette") ? "à vérifier avant publication sociale" : "à documenter",
  };
});

const md = [
  "# Inventaire médias",
  "",
  "| Fichier | Format | Poids | Dimensions | Usage | Droits |",
  "|---|---|---:|---|---|---|",
  ...rows.map((row) => `| ${row.path} | ${row.format} | ${row.bytes} | ${row.width || "?"}×${row.height || "?"} | ${row.usage.join(", ") || "non détecté"} | ${row.rights} |`),
  "",
];

writeFileSync(path.join(SITE_ROOT, "docs", "media-inventory.json"), `${JSON.stringify(rows, null, 2)}\n`, "utf8");
writeFileSync(path.join(SITE_ROOT, "docs", "media-inventory.md"), md.join("\n"), "utf8");
console.log(`Médias inventoriés: ${rows.length}`);
