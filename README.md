# Data Privacy Irony Game

H5 Canvas / React prototype for the data privacy irony game. This branch contains the current Program B logic framework plus the AI Studio preview app.

## Program B Entry Points

- `src/game/index.js`: public game-logic API for Program A UI integration.
- `src/data/mockContent.js`: mock data source for Program C content replacement.
- `src/game/content/contentBridge.js`: Program C content contract fallback.
- `test/`: pure logic tests for packaging, day loop, and save/load.

## Program A Integration Contract

- Place a card: `placeCardToSlot(gameState, cardId, slotIndex)` where `slotIndex` is `0 | 1 | 2`.
- Remove a card: `removeCardFromSlot(gameState, slotIndex)`.
- Move/swap slots: `moveWorkbenchCard(gameState, fromSlotIndex, toSlotIndex)`.
- Compile package: `createPackage(gameState, preferredPackageType?)`.
- Sell package: `sellPackage(gameState, packageId, buyerId)`.
- Read UI state: `getVisibleState(gameState)`.

Action results include `visibleState`. Standard event names are `packageCreated`, `wasteCreated`, `transactionSuccess`, and `transactionFailed`.

Fixed `packageType` values:

```text
precise_profile
health_risk
career_competitiveness
credit_score
relationship_infiltration
```

## Program C Content Contract

Program B expects these content methods:

```js
content.findPackagePreviews(selectedCardIds, { onlyReady: true })
content.pickNewsForPackage(packageType)
content.findChallengeByDay(day)
content.pickProfilePuzzleByDay(4)
content.pickBuyerNegotiationScript(packageType)
content.pickPublicOpinionScript(packageType)
content.findDailyMonologueByDay(day)
content.pickEvidenceChainTemplate()
```

## Run Locally

Prerequisite: Node.js

```bash
npm install
npm test
npm run dev
```

Default local URL:

```text
http://localhost:3000/
```
