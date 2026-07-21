# Program C Acceptance Checklist

Updated: 2026-07-21

This checklist records the current Program C delivery state for content tools, audio, build, performance, and the integrated Week 1 slice.

## Completed Milestones

- D1: local development toolchain, content validation, offline readiness check, bundle size check, and Web Audio manager scaffold.
- D2: initial card templates, 20 user profiles, variable filling, data-flow audio, and empathy / anger / numbness emotion audio events.
- D3: 10 initial news templates, package-to-news matching, and package / neon / transaction audio events.
- D4: news templates expanded to 20, protocol disguise terms expanded to 20, news broadcast audio, and BGM switching events.
- D5: 10 data-cleaning icon configs, 5 public-opinion manipulation scripts, 12 black-box lines, challenge success/fail audio, and black-box line audio binding.
- D6: 4 profile puzzle sets, 6 buyer negotiation scripts, 7 daily monologues, challenge BGM, and monologue typewriter audio.
- D7: `report:week1` checks Week 1 content coverage, audio integration, package seal audio, preview-page consistency, package size, and JSON parse timing, then generates the handoff report; latest Feishu text config is synced into existing Program C content data as the D7 acceptance content baseline.
- D8: integrated `mini-game` scene now uses content-driven Day 1 / 2 / 4 / 5 rules instead of generic success/fail buttons.

## Current Data Scale

| Data | Count |
| --- | ---: |
| Card templates | 20 |
| User profiles | 20 |
| Buyers | 15 |
| Package recipes | 5 |
| News templates | 20 |
| Protocol terms | 20 |
| Day challenges | 4 |
| Data-cleaning icons | 18 |
| Public-opinion scripts | 10 |
| Profile puzzles | 3 |
| Buyer negotiation scripts | 6 |
| Daily monologues | 7 |
| Black-box lines | 62 |
| Audio events | 28 |

## Current Size Check

| Metric | Value |
| --- | ---: |
| Raw tracked bytes | 146193 |
| Gzip tracked bytes | 36504 |
| Budget bytes | 8388608 |
| Remaining raw bytes | 8242415 |
| Remaining gzip bytes | 8352104 |

## Generated Artifacts

- `program-c/dist/content-manifest.json`
- `program-c/dist/offline-assets.json`
- `program-c/dist/gzip-size-report.json`
- `program-c/dist/week1-vertical-slice-report.json`
- `program-c/docs/week1-vertical-slice-report.md`

## One-Command Verification

Run from `program-c/`:

```bash
npm run check
```

This verifies TypeScript, JSON content references, generated manifests, offline readiness, raw/gzip size budgets, and the Week 1 vertical-slice report.

## Handoff Notes

- Program A can call `audio.handleGameEvent(eventName)` through the Program C audio manager.
- Program B can call `findPackagePreviews(cardIds, { onlyReady: true })` to determine valid card-slot packages.
- Program B can call `pickNewsForPackage(packageType)`, `findChallengeByDay(1/2/4/5)`, `pickProfilePuzzleByDay(4)`, `pickBuyerNegotiationScript(packageType)`, and `findDailyMonologueByDay(day)`.
- Latest Feishu text config is local content/reference data. Current playable rule coverage is still Day 1 / 2 / 4 / 5 only.
- Planning/content edits should happen in `program-c/data/*.json`, followed by `npm run check`.

## Remaining Work

- Implement real workbench drag-and-drop instead of click-to-select card placement.
- Implement Day 3 public-opinion gameplay, Day 6 protocol scan, Day 7 branches, endings, report generation, and UI/system copy from the Feishu text config when those slices enter development.
- Run a human end-to-end playtest for Day 1 / 2 / 4 / 5 spacing, wording, and audio feel.
- Later: rerun `npm run check` after real audio assets or final copy changes are added.
