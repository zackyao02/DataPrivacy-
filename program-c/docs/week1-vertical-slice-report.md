# Program C Week 1 Vertical Slice Report

Generated: 2026-07-19T15:15:15.549Z

## Scope

This D7 report checks Program C content, audio, build, and initial performance readiness for the Week 1 vertical slice.

## Content Coverage

| Item | Count |
| --- | ---: |
| Card templates | 20 |
| Users | 20 |
| Buyers | 15 |
| Package recipes | 5 |
| News templates | 20 |
| Day challenges | 4 |
| Profile puzzles | 3 |
| Buyer negotiation scripts | 6 |
| Daily monologues | 7 |

Supported Week 1 challenge days: 1, 2, 4, 5.

Package types: precise_profile, health_risk, career_competitiveness, credit_score, relationship_infiltration.

## Audio Integration

Audio event count: 28.

Package sealing check:

| Event | Sound ID |
| --- | --- |
| packageCreated | package-seal |
| packageSealed | package-seal |
| transactionSealed | transaction-seal |

Audio preview buttons matched: yes (28 buttons).

## Initial Performance Check

| Metric | Value |
| --- | ---: |
| Raw tracked bytes | 146193 |
| Gzip tracked bytes | 36504 |
| Budget bytes | 8388608 |
| Remaining raw bytes | 8242415 |
| Remaining gzip bytes | 8352104 |
| Data JSON files | 14 |
| JSON parse average per full pass | 0.182 ms |

FPS risk proxy: low for Program C assets. Program C currently ships JSON presets and procedural Web Audio only. Actual FPS still needs Program A to measure in the integrated canvas build.

## Handoff

- Program B: run Day 1-5 loop with `findChallengeByDay(1/2/4/5)`, package news, emotion responses, and daily monologues.
- Program A: verify `audio.handleGameEvent` for package seal, transaction seal, challenge feedback, BGM, and monologue typing events.
- Program C: rerun `npm run check` before each content or audio handoff.
