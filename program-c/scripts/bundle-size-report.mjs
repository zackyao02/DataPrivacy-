import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const rootPath = fileURLToPath(new URL("..", import.meta.url));
const budgetBytes = 8 * 1024 * 1024;
const trackedDirs = ["data", "src", "dist"];
const excludedFiles = new Set([
  "dist\\gzip-size-report.json",
  "dist/gzip-size-report.json",
  "dist\\week1-vertical-slice-report.json",
  "dist/week1-vertical-slice-report.json",
]);

function walk(dir) {
  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

const files = trackedDirs
  .flatMap((dir) => {
    const fullPath = join(rootPath, dir);
    return existsSync(fullPath) ? walk(fullPath) : [];
  })
  .filter((file) => !excludedFiles.has(relative(rootPath, file)));
const rows = files
  .map((file) => ({
    file,
    relativePath: relative(rootPath, file),
    bytes: statSync(file).size,
  }))
  .sort((a, b) => b.bytes - a.bytes);

const totalBytes = rows.reduce((sum, row) => sum + row.bytes, 0);

console.log("Program C asset/source size report");
console.log(`total=${totalBytes} bytes`);
console.log(`budget=${budgetBytes} bytes`);
console.log(`remaining=${budgetBytes - totalBytes} bytes`);
console.log("");

for (const row of rows) {
  console.log(`${String(row.bytes).padStart(7, " ")}  ${row.relativePath}`);
}

if (totalBytes > budgetBytes) {
  throw new Error("Program C tracked files exceed 8MB budget.");
}
