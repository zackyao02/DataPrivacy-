import { realpathSync } from "node:fs";
import { defineConfig } from "vite";

// The desktop workspace is a mapped path. Using its real path keeps Vite's
// HTML entry and Rollup output names on the same Windows drive.
export default defineConfig({
  root: realpathSync.native(process.cwd()),
});

