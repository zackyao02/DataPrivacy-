# Program C Vertical Slice Report

Generated: 2026-07-19T15:15:15.549Z

## Scope

This report keeps the D7 Week 1 acceptance baseline and adds the D8/D9 playable mini-game plus D10 ending report / save-state readiness check.

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
| Ending report templates | 1 |
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
| Raw tracked bytes | 175727 |
| Gzip tracked bytes | 44852 |
| Budget bytes | 8388608 |
| Remaining raw bytes | 8212881 |
| Remaining gzip bytes | 8343756 |
| Data JSON files | 17 |
| JSON parse average per full pass | 0.182 ms |

FPS risk proxy: low for Program C assets. Program C currently ships JSON presets and procedural Web Audio only. Actual FPS still needs Program A to measure in the integrated canvas build.

## Handoff

- Program B: run Day 1/2/3/4/5/6/7 loop with `findChallengeByDay`, package news, emotion responses, public opinion choices, protocol scan state, evidence chain state, ending report state, save state, and daily monologues.
- Program A: verify `audio.handleGameEvent` for package seal, transaction seal, challenge feedback, BGM, monologue typing, `endingTriggered` prototype events, and the ending report scene route.
- Program C: rerun `npm run check` before each content or audio handoff.
