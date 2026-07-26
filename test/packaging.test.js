import { createGame, placeCardToSlot, createPackage, findPackagePreviews, moveWorkbenchCard, sellPackage } from "../src/game/index.js";
import { CardStatus } from "../src/game/data/schemas.js";

/**
 * Runs testing assertions for packaging.
 * Returns { passed: boolean, errors: Array }
 */
export function runPackagingTests() {
  const errors = [];
  const log = (msg) => console.log(`[TEST-PACKAGING] ${msg}`);

  try {
    // 1. Setup a game and seed
    const game = createGame({ seed: "test-packaging-seed-1" });
    
    // Create manual cards for tests
    const cardLocation = { id: "C-LOC", actualType: "location", displayedType: "location", sensitivity: "low", baseValue: 100, riskWeight: 1.0, status: CardStatus.AVAILABLE };
    const cardConsumption = { id: "C-CON", actualType: "consumption", displayedType: "consumption", sensitivity: "low", baseValue: 100, riskWeight: 1.0, status: CardStatus.AVAILABLE };
    const cardSocial = { id: "C-SOC", actualType: "social", displayedType: "social", sensitivity: "low", baseValue: 100, riskWeight: 1.0, status: CardStatus.AVAILABLE };
    const cardBiometric = { id: "C-BIO", actualType: "biometric", displayedType: "biometric", sensitivity: "low", baseValue: 100, riskWeight: 1.0, status: CardStatus.AVAILABLE };

    game.rawCards = [cardLocation, cardConsumption, cardSocial, cardBiometric];

    // Test Case 1: Incomplete Workbench cards
    const failRes = createPackage(game);
    if (failRes.ok) {
      errors.push("Failed: Expected error compiling package with empty workbench slots.");
    }
    if (!failRes.visibleState || failRes.visibleState.workbench.length !== 3) {
      errors.push("Failed: Public action result should include 3-slot visibleState.");
    }

    const invalidSlotRes = placeCardToSlot(game, "C-LOC", 3);
    if (invalidSlotRes.ok || invalidSlotRes.code !== "INVALID_SLOT") {
      errors.push("Failed: slotIndex 3 should be rejected after the 3-slot contract update.");
    }

    // Place Location + Consumption + Social
    placeCardToSlot(game, "C-LOC", 0);
    placeCardToSlot(game, "C-CON", 1);
    placeCardToSlot(game, "C-SOC", 2);

    const duplicatePlaceRes = placeCardToSlot(game, "C-LOC", 1);
    if (!duplicatePlaceRes.ok) {
      errors.push("Failed: Replacing/moving a workbench card by cardId + slotIndex should be supported.");
    }
    if (game.workbench.filter(c => c && c.id === "C-LOC").length !== 1) {
      errors.push("Failed: A card instance appeared in multiple slots.");
    }
    // Put cards back into the original ambiguous combination.
    moveWorkbenchCard(game, 1, 0);
    placeCardToSlot(game, "C-CON", 1);

    // Test Case 2: Ambiguous Combo (precise_profile vs career_competitiveness)
    const ambigRes = createPackage(game);
    if (ambigRes.ok || ambigRes.code !== "AMBIGUOUS_COMBINATION") {
      errors.push(`Failed: Expected AMBIGUOUS_COMBINATION, got: ${JSON.stringify(ambigRes)}`);
    }
    if (!ambigRes.candidates.every(candidate => candidate.packageType)) {
      errors.push("Failed: Ambiguous candidates should expose packageType.");
    }

    const previewRes = findPackagePreviews(game, ["C-LOC", "C-CON", "C-SOC"], { onlyReady: true });
    if (!previewRes.ok || !previewRes.ambiguous || previewRes.previews.length !== 2) {
      errors.push(`Failed: Expected package previews for the ambiguous card set, got: ${JSON.stringify(previewRes)}`);
    }

    // Test Case 3: Resolving ambiguity with preferredPackageType
    const resolvedRes = createPackage(game, "precise_profile");
    if (!resolvedRes.ok || resolvedRes.package.packageType !== "precise_profile") {
      errors.push(`Failed: Expected successful precise_profile creation, got: ${JSON.stringify(resolvedRes)}`);
    }
    if (resolvedRes.event !== "packageCreated") {
      errors.push(`Failed: Expected packageCreated event, got ${resolvedRes.event}`);
    }

    game.buyers = [
      {
        id: "BUYER-OK",
        name: "Test Buyer",
        allowedRecipes: ["precise_profile"],
        priceMultiplier: 1,
        riskContribution: { regulatory: 1, publicOpinion: 1, internalSuspicion: 1 }
      },
      {
        id: "BUYER-BAD",
        name: "Wrong Buyer",
        allowedRecipes: ["health_risk"],
        priceMultiplier: 1,
        riskContribution: { regulatory: 1, publicOpinion: 1, internalSuspicion: 1 }
      }
    ];

    const failedTx = sellPackage(game, resolvedRes.package.id, "BUYER-BAD");
    if (failedTx.ok || failedTx.event !== "transactionFailed") {
      errors.push(`Failed: Expected transactionFailed event, got: ${JSON.stringify(failedTx)}`);
    }

    const okTx = sellPackage(game, resolvedRes.package.id, "BUYER-OK");
    if (!okTx.ok || okTx.event !== "transactionSuccess" || okTx.transaction.packageType !== "precise_profile") {
      errors.push(`Failed: Expected successful transaction with packageType, got: ${JSON.stringify(okTx)}`);
    }

    // Workbench slots should be cleared after a successful packaging
    if (game.workbench[0] !== null || game.workbench[1] !== null || game.workbench[2] !== null) {
      errors.push("Failed: Slots not cleared after compilation.");
    }

    // Test Case 4: Creating a waste package
    // Reset cards status to AVAILABLE to re-test
    cardLocation.status = CardStatus.AVAILABLE;
    cardConsumption.status = CardStatus.AVAILABLE;
    cardBiometric.status = CardStatus.AVAILABLE;

    placeCardToSlot(game, "C-LOC", 0);
    placeCardToSlot(game, "C-CON", 1);
    placeCardToSlot(game, "C-BIO", 2); // Biometric + Location + Consumption is not a valid recipe

    const wasteRes = createPackage(game);
    if (!wasteRes.ok || wasteRes.package.recipeId !== "waste") {
      errors.push(`Failed: Expected waste package compilation for invalid combo, got: ${JSON.stringify(wasteRes)}`);
    }
    if (wasteRes.event !== "wasteCreated") {
      errors.push(`Failed: Expected wasteCreated event, got ${wasteRes.event}`);
    }

    log("Packaging tests complete.");
  } catch (e) {
    errors.push(`Crash during packaging tests: ${e.message}\n${e.stack}`);
  }

  return {
    name: "Packaging Unit Tests",
    passed: errors.length === 0,
    errors
  };
}
