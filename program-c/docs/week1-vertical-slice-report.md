# Program C Vertical Slice Report

Generated: 2026-07-19T15:15:15.549Z

## Scope

This report keeps the D7 Week 1 acceptance baseline and adds the D8/D9 playable mini-game / ending-prototype readiness check.

## Content Coverage

| Item | Count |
| --- | ---: |
| Card templates | 20 |
| Users | 20 |
| Buyers | 15 |
| Package recipes | 5 |
| News templates | 20 |
| Day challenges | 7 |
| Profile puzzles | 3 |
| Buyer negotiation scripts | 6 |
| Protocol scan templates | 5 |
| Evidence chain templates | 1 |
| Daily monologues | 7 |

D7 required challenge days: 1, 2, 3, 4, 5.

D8 prototype challenge days: 6.

D9 prototype challenge days: 7.

Supported Program C challenge days: 1, 2, 3, 4, 5, 6, 7.

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
| Raw tracked bytes | 171832 |
| Gzip tracked bytes | 43354 |
| Budget bytes | 8388608 |
| Remaining raw bytes | 8216776 |
| Remaining gzip bytes | 8345254 |
| Data JSON files | 16 |
| JSON parse average per full pass | 0.182 ms |

FPS risk proxy: low for Program C assets. Program C currently ships JSON presets and procedural Web Audio only. Actual FPS still needs Program A to measure in the integrated canvas build.

## Handoff

- Program B: run Day 1/2/3/4/5/6/7 loop with `findChallengeByDay`, package news, emotion responses, public opinion choices, protocol scan state, evidence chain state, and daily monologues.
- Program A: verify `audio.handleGameEvent` for package seal, transaction seal, challenge feedback, BGM, monologue typing, and `endingTriggered` prototype events.
- Program C: rerun `npm run check` before each content or audio handoff.
