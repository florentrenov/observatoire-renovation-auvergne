import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const PORT = Number(process.env.OBSERVATOIRE_PREVIEW_PORT || 8878);
const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"],
]);

function publicFile(rawUrl) {
  const publicBase = "/observatoire-renovation-auvergne";
  let pathname = decodeURIComponent(new URL(rawUrl, "http://127.0.0.1").pathname);
  if (pathname === publicBase) pathname = "/";
  else if (pathname.startsWith(`${publicBase}/`)) pathname = pathname.slice(publicBase.length);
  const normalized = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
  const candidate = path.resolve(DIST, `.${normalized}`);
  if (candidate !== DIST && !candidate.startsWith(`${DIST}${path.sep}`)) return null;
  return candidate;
}

createServer((request, response) => {
  const candidate = publicFile(request.url || "/");
  if (candidate && existsSync(candidate) && statSync(candidate).isFile()) {
    response.writeHead(200, { "Content-Type": MIME_TYPES.get(path.extname(candidate)) || "application/octet-stream" });
    response.end(readFileSync(candidate));
    return;
  }
  response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
  response.end(readFileSync(path.join(DIST, "404.html")));
}).listen(PORT, "127.0.0.1", () => {
  console.log(`Prévisualisation locale: http://127.0.0.1:${PORT}/`);
});
