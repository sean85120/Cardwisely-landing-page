import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const skip = new Set(["node_modules", ".git", ".github", ".husky", "scripts"]);

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (skip.has(e.name)) return [];
    const p = join(dir, e.name);
    if (e.isDirectory()) return htmlFiles(p);
    return e.name.endsWith(".html") ? [p] : [];
  });
}

function resolves(target) {
  if (!existsSync(target)) return false;
  return statSync(target).isFile() || existsSync(join(target, "index.html"));
}

const errors = [];
const files = htmlFiles(root);
for (const file of files) {
  const rel = relative(root, file);
  const html = readFileSync(file, "utf8");
  for (const [, url] of html.matchAll(/(?:href|src)="([^"]*)"/g)) {
    if (/^(https?:|mailto:|tel:|data:|#)/.test(url) || url === "") continue;
    const path = url.split(/[?#]/)[0];
    if (path.startsWith("/")) {
      if (rel !== "404.html") errors.push(`${rel}: root-absolute ${url}`);
      continue;
    }
    if (!resolves(join(dirname(file), path)))
      errors.push(`${rel}: missing ${url}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`links ok in ${files.length} html files`);
