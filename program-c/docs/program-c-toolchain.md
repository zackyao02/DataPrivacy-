# Program C Toolchain

This document is the D7 handoff note for Program C content, audio, build, and performance tooling.

## Commands

Run from `program-c/`.

```bash
npm run typecheck
npm run validate:content
npm run build
npm run verify:offline
npm run report:size
npm run report:gzip
npm run report:week1
npm run check
node scripts/sync-feishu-text-config.mjs
```

## What Each Command Checks

| Command | Purpose |
| --- | --- |
| `typecheck` | Runs TypeScript validation for Program C source and JSON imports. |
| `validate:content` | Checks JSON IDs, package references, placeholders, challenge references, protocol-scan templates, audio event references, D6 narrative-only negotiation rules, and required data counts. |
| `build` | Generates `dist/content-manifest.json` and `dist/offline-assets.json`. |
| `verify:offline` | Confirms Program C data, source, and generated manifests do not depend on remote URLs. |
| `report:size` | Prints raw tracked file size against the 8MB budget. |
| `report:gzip` | Writes `dist/gzip-size-report.json` and prints gzip size against the 8MB budget. |
| `report:week1` | Writes the D7 baseline plus D8/D9 playable mini-game and D10 ending report / save-state report to `dist/week1-vertical-slice-report.json` and `docs/week1-vertical-slice-report.md`. |
| `check` | Runs the full Program C TypeScript, validation, build, offline, size, gzip, and vertical-slice reporting chain. |
| `node scripts/sync-feishu-text-config.mjs` | Syncs the local Feishu text-config Markdown snapshot into existing Program C JSON content. Set `FEISHU_TEXT_CONFIG_MD=...` to use a different snapshot. |

## Edit Workflow

1. Edit content in `data/*.json`, or refresh the local Feishu text-config snapshot and run `node scripts/sync-feishu-text-config.mjs`.
2. If a new content type is added, update `src/content/schema.ts`, `src/content/defaultContentBundle.ts`, `src/content/ContentRepository.ts`, `scripts/validate-content.mjs`, and `scripts/build-content-manifest.mjs`.
3. If a new audio event is added, update `src/audio/soundMap.ts`, `src/audio/AudioManager.ts`, and `docs/audio-preview.html`.
4. Run `npm run check`.
5. Update README or handoff docs only with stable project progress and integration information.

Generated reports are written only when their stable content changes. To refresh the volatile JSON parse benchmark in the vertical-slice report, set `PROGRAM_C_REFRESH_BENCHMARK=1` before running `npm run report:week1`.

## D7 Vertical Slice Notes

Program C D7 covers Week 1 content integration, JSON completeness, audio integration, and initial performance reporting. FPS itself must be measured in the integrated Program A canvas build; Program C reports asset size, offline readiness, JSON parse timing, and audio event consistency.

D8 adds Day 1-6 content-driven mini-games on top of the D7 baseline. D9 adds Day 7 evidence-chain data, scoring state, black-box feedback, and a branch-aware ending prototype. D10 adds the ending report template, report scene route, share-text action, and local save-state loop.
