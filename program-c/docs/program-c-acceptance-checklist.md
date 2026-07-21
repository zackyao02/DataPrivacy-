# Program C Acceptance Checklist

Updated: 2026-07-21

This checklist records the current Program C delivery state for content tools, audio, build, performance, the D7 Week 1 baseline, D8 playable mini-games, and the D9 Day 7 evidence-chain prototype.

## Completed Milestones

- D1: local development toolchain, content validation, offline readiness check, bundle size check, and Web Audio manager scaffold.
- D2: initial card templates, 20 user profiles, variable filling, data-flow audio, and empathy / anger / numbness emotion audio events.
- D3: 10 initial news templates, package-to-news matching, and package / neon / transaction audio events.
- D4: news templates expanded to 20, protocol disguise terms expanded to 20, news broadcast audio, and BGM switching events.
- D5: data-cleaning icon configs, public-opinion manipulation scripts, black-box lines, challenge success/fail audio, and black-box line audio binding.
- D6: 3 profile puzzle sets, 6 buyer negotiation scripts, 7 daily monologues, challenge BGM, and monologue typewriter audio.
- D7: `report:week1` checks Week 1 content coverage, audio integration, package seal audio, preview-page consistency, package size, and JSON parse timing, then generates the handoff report; latest Feishu text config is synced into existing Program C content data as the D7 acceptance content baseline.
- D8: integrated `mini-game` scene now uses content-driven Day 1 / 2 / 3 / 4 / 5 / 6 rules instead of generic success/fail buttons, including Day 3 public-opinion choice scoring, protocol-scan scoring, and an ending-branch prototype.
- D9: Day 7 evidence-chain prototype is playable with 18 evidence fragments, 3 causal connections, a report upload action, low-awareness final-package branch display, and emotion-driven awareness scoring.

## Current Data Scale

| Data | Count |
| --- | ---: |
| Card templates | 20 |
| User profiles | 20 |
| Buyers | 15 |
| Package recipes | 5 |
| News templates | 20 |
| Protocol terms | 20 |
| Day challenges | 7 |
| Data-cleaning icons | 18 |
| Public-opinion scripts | 10 |
| Profile puzzles | 3 |
| Buyer negotiation scripts | 6 |
| Protocol scan templates | 5 |
| Evidence chain templates | 1 |
| Daily monologues | 7 |
| Black-box lines | 71 |
| Audio events | 28 |

## Current Size Check

| Metric | Value |
| --- | ---: |
| Raw tracked bytes | 171832 |
| Gzip tracked bytes | 43354 |
| Budget bytes | 8388608 |
| Remaining raw bytes | 8216776 |
| Remaining gzip bytes | 8345254 |

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

This verifies TypeScript, JSON content references, generated manifests, offline readiness, raw/gzip size budgets, and the vertical-slice report.

## Handoff Notes

- Program A can call `audio.handleGameEvent(eventName)` through the Program C audio manager.
- Program B can call `findPackagePreviews(cardIds, { onlyReady: true })` to determine valid card-slot packages.
- Program B can call `pickNewsForPackage(packageType)`, `findChallengeByDay(1/2/3/4/5/6/7)`, `pickPublicOpinionScript(packageType)`, `pickProfilePuzzleByDay(4)`, `pickBuyerNegotiationScript(packageType)`, `pickProtocolScanTemplate()`, `pickEvidenceChainTemplate()`, and `findDailyMonologueByDay(day)`.
- Latest Feishu text config is local content/reference data. Current playable rule coverage is Day 1 / 2 / 3 / 4 / 5 / 6 / 7.
- Planning/content edits should happen in `program-c/data/*.json`, followed by `npm run check`.

## Remaining Work

- Implement real workbench drag-and-drop instead of click-to-select card placement.
- Implement D10 ending report generation, sharing, save-state polish, and final UI/system copy from the Feishu text config when those slices enter development.
- Run a human end-to-end playtest for Day 1 / 2 / 3 / 4 / 5 / 6 / 7 spacing, wording, and audio feel.
- Later: rerun `npm run check` after real audio assets or final copy changes are added.
