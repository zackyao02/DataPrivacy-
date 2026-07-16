import { createGame, placeCardToSlot, createPackage } from "../src/game/index.js";
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

    // Place Location + Consumption + Social
    placeCardToSlot(game, "C-LOC", 0);
    placeCardToSlot(game, "C-CON", 1);
    placeCardToSlot(game, "C-SOC", 2);

    // Test Case 2: Ambiguous Combo (precise_profile vs career_competitiveness)
    const ambigRes = createPackage(game);
    if (ambigRes.ok || ambigRes.code !== "AMBIGUOUS_COMBINATION") {
      errors.push(`Failed: Expected AMBIGUOUS_COMBINATION, got: ${JSON.stringify(ambigRes)}`);
    }

    // Test Case 3: Resolving ambiguity with preferredRecipeId
    const resolvedRes = createPackage(game, "precise_profile");
    if (!resolvedRes.ok || resolvedRes.package.recipeId !== "precise_profile") {
      errors.push(`Failed: Expected successful precise_profile creation, got: ${JSON.stringify(resolvedRes)}`);
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
