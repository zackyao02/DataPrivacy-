import { GameState } from "./core/GameState.js";
import { DayController } from "./core/DayController.js";
import { SaveService } from "./core/SaveService.js";
import { DataClassifier } from "./data/DataClassifier.js";
import { InventoryService } from "./packaging/InventoryService.js";
import { RecipeMatcher } from "./packaging/RecipeMatcher.js";
import { PackageFactory } from "./packaging/PackageFactory.js";
import { TransactionService } from "./market/TransactionService.js";

/**
 * Creates a brand new game state instance.
 * @param {object} [options] - Optional custom configs (like seed)
 * @returns {GameState} Re-initialized GameState
 */
export function createGame(options = {}) {
  const seed = options.seed || `seed-${Math.floor(Math.random() * 89999 + 10000)}`;
  return new GameState(seed);
}

/**
 * Starts a new game day (e.g. Day 1, Day 2).
 */
export function startDay(gameState) {
  return DayController.startDay(gameState);
}

/**
 * Corrects a card's displayed type label to something selected by the user.
 */
export function correctCardType(gameState, cardId, selectedType) {
  let card = gameState.rawCards.find(c => c.id === cardId);
  if (!card) {
    card = gameState.workbench.find(c => c && c.id === cardId);
  }
  if (!card) {
    return { ok: false, code: "CARD_NOT_FOUND", message: "Card not found in pool or workbench." };
  }
  return DataClassifier.correctType(card, selectedType);
}

/**
 * Places a card on the workbench (slots 0-3).
 */
export function placeCardToSlot(gameState, cardId, slotIndex) {
  return InventoryService.placeCardToSlot(gameState, cardId, slotIndex);
}

/**
 * Removes a card from a workbench slot, returning it to the daily pool.
 */
export function removeCardFromSlot(gameState, slotIndex) {
  return InventoryService.removeCardFromSlot(gameState, slotIndex);
}

/**
 * Attempts to compile the workbench slots into a packaged product.
 * In case of a conflict (e.g. precise_profile vs career_competitiveness),
 * it returns ambiguous status unless a preferredRecipeId is supplied.
 */
export function createPackage(gameState, preferredRecipeId = null) {
  const slots = gameState.workbench;
  const activeCardsCount = slots.filter(c => c !== null && c !== undefined).length;

  if (activeCardsCount !== 3) {
    return {
      ok: false,
      code: "INVALID_CARD_COUNT",
      message: `Packaging requires exactly 3 data cards. You have placed ${activeCardsCount}.`
    };
  }

  // 1. Evaluate recipe match
  const matchResult = RecipeMatcher.match(slots, preferredRecipeId);

  // 2. Handle ambiguous match
  if (matchResult.ambiguous) {
    return {
      ok: false,
      code: "AMBIGUOUS_COMBINATION",
      message: matchResult.message,
      candidates: matchResult.candidates.map(r => ({ id: r.id, name: r.name, description: r.description }))
    };
  }

  // 3. Create the package based on results
  let compiledPackage;
  if (matchResult.matched) {
    compiledPackage = PackageFactory.create(matchResult.recipe, slots, gameState.day);
  } else {
    // Generates a waste pack if it doesn't match any recipes
    compiledPackage = PackageFactory.create(null, slots, gameState.day);
  }

  // 4. Save package to inventory & clear slots
  InventoryService.addPackage(gameState, compiledPackage);

  return {
    ok: true,
    package: compiledPackage,
    isWaste: compiledPackage.isWaste
  };
}

/**
 * Sells a packaged dossier to an active daily corporate buyer.
 */
export function sellPackage(gameState, packageId, buyerId) {
  return TransactionService.sellPackage(gameState, packageId, buyerId);
}

/**
 * Triggers end-of-day risk calculations and moves to tomorrow.
 */
export function endDay(gameState) {
  return DayController.endDay(gameState);
}

/**
 * Returns a copy of the visible state suitable for the frontend.
 */
export function getVisibleState(gameState) {
  if (!gameState) return null;
  return gameState.serialize();
}

/**
 * Saves state to localStorage or mock storage
 */
export function saveGame(gameState, storage) {
  return SaveService.saveGame(gameState, storage);
}

/**
 * Loads state from localStorage or mock storage
 */
export function loadGame(storage) {
  return SaveService.loadGame(storage);
}
