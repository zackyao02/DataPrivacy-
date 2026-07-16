import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const rootPath = fileURLToPath(new URL("..", import.meta.url));
const scannedDirs = ["data", "src", "dist"];
const remoteUrlPattern = /\bhttps?:\/\//i;

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

const offlineManifestPath = join(rootPath, "dist", "offline-assets.json");

if (!existsSync(offlineManifestPath)) {
  throw new Error("Missing dist/offline-assets.json. Run npm run build first.");
}

const offlineManifest = JSON.parse(readFileSync(offlineManifestPath, "utf8"));

for (const requiredFile of offlineManifest.requiredFiles ?? []) {
  const fullPath = join(rootPath, requiredFile);

  if (!existsSync(fullPath)) {
    throw new Error(`Offline manifest references missing file: ${requiredFile}`);
  }
}

const files = scannedDirs
  .flatMap((dir) => {
    const fullPath = join(rootPath, dir);
    return existsSync(fullPath) ? walk(fullPath) : [];
  })
  .filter((file) => /\.(json|ts|mjs|md|txt)$/i.test(file));

for (const file of files) {
  const text = readFileSync(file, "utf8");

  if (remoteUrlPattern.test(text)) {
    throw new Error(`Program C offline check found remote URL in ${relative(rootPath, file)}`);
  }
}

console.log("Program C offline readiness passed.");
console.log(`requiredFiles=${offlineManifest.requiredFiles?.length ?? 0}`);
console.log(`externalNetworkRequired=${offlineManifest.externalNetworkRequired}`);
console.log(`scannedFiles=${files.length}`);
