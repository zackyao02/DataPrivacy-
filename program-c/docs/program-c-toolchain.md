# Program C Toolchain

This document is the D7 handoff note for Program C content, audio, build, and performance tooling.

## Commands

Run from `program-c/`.

```bash
npm run validate:content
npm run build
npm run verify:offline
npm run report:size
npm run report:gzip
npm run report:week1
npm run check
```

## What Each Command Checks

| Command | Purpose |
| --- | --- |
| `validate:content` | Checks JSON IDs, package references, placeholders, challenge references, audio event references, D6 narrative-only negotiation rules, and required data counts. |
| `build` | Generates `dist/content-manifest.json` and `dist/offline-assets.json`. |
| `verify:offline` | Confirms Program C data, source, and generated manifests do not depend on remote URLs. |
| `report:size` | Prints raw tracked file size against the 8MB budget. |
| `report:gzip` | Writes `dist/gzip-size-report.json` and prints gzip size against the 8MB budget. |
| `report:week1` | Writes D7 Week 1 vertical slice reports to `dist/week1-vertical-slice-report.json` and `docs/week1-vertical-slice-report.md`. |
| `check` | Runs the full Program C validation and reporting chain. |

## Edit Workflow

1. Edit content in `data/*.json`.
2. If a new content type is added, update `src/content/schema.ts`, `src/content/defaultContentBundle.ts`, `src/content/ContentRepository.ts`, `scripts/validate-content.mjs`, and `scripts/build-content-manifest.mjs`.
3. If a new audio event is added, update `src/audio/soundMap.ts`, `src/audio/AudioManager.ts`, and `docs/audio-preview.html`.
4. Run `npm run check`.
5. Update README or handoff docs only with stable project progress and integration information.

## D7 Vertical Slice Notes

Program C D7 covers Week 1 content integration, JSON completeness, audio integration, and initial performance reporting. FPS itself must be measured in the integrated Program A canvas build; Program C reports asset size, offline readiness, JSON parse timing, and audio event consistency.
