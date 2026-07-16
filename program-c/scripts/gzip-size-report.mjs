import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const rootPath = fileURLToPath(new URL("..", import.meta.url));
const outputPath = join(rootPath, "dist", "gzip-size-report.json");
const budgetBytes = 8 * 1024 * 1024;
const trackedDirs = ["data", "src", "dist"];
const excludedFiles = new Set([
  "dist\\gzip-size-report.json",
  "dist/gzip-size-report.json",
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
  .map((file) => {
    const buffer = readFileSync(file);
    return {
      file: relative(rootPath, file),
      rawBytes: statSync(file).size,
      gzipBytes: gzipSync(buffer, { level: 9 }).length,
    };
  })
  .sort((a, b) => b.gzipBytes - a.gzipBytes);

const totalRawBytes = rows.reduce((sum, row) => sum + row.rawBytes, 0);
const totalGzipBytes = rows.reduce((sum, row) => sum + row.gzipBytes, 0);

const report = {
  budgetBytes,
  totalRawBytes,
  totalGzipBytes,
  remainingRawBytes: budgetBytes - totalRawBytes,
  remainingGzipBytes: budgetBytes - totalGzipBytes,
  files: rows,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("Program C gzip size report");
console.log(`raw=${totalRawBytes} bytes`);
console.log(`gzip=${totalGzipBytes} bytes`);
console.log(`budget=${budgetBytes} bytes`);
console.log(`remainingGzip=${budgetBytes - totalGzipBytes} bytes`);
console.log("");

for (const row of rows) {
  console.log(`${String(row.gzipBytes).padStart(7, " ")} gzip  ${String(row.rawBytes).padStart(7, " ")} raw  ${row.file}`);
}

if (totalRawBytes > budgetBytes || totalGzipBytes > budgetBytes) {
  throw new Error("Program C tracked files exceed 8MB budget.");
}
