import { GameState } from "./core/GameState.js";
import { DayController } from "./core/DayController.js";
import { SaveService } from "./core/SaveService.js";
import { DataClassifier } from "./data/DataClassifier.js";
import { InventoryService } from "./packaging/InventoryService.js";
import { RecipeMatcher } from "./packaging/RecipeMatcher.js";
import { PackageFactory } from "./packaging/PackageFactory.js";
import { TransactionService } from "./market/TransactionService.js";
import { EventName } from "./data/schemas.js";
import { content } from "./content/contentBridge.js";

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
  return withVisibleState(gameState, DayController.startDay(gameState));
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
    return withVisibleState(gameState, { ok: false, code: "CARD_NOT_FOUND", message: "Card not found in pool or workbench." });
  }
  return withVisibleState(gameState, DataClassifier.correctType(card, selectedType));
}

/**
 * Places a card on the workbench (slots 0-2).
 */
export function placeCardToSlot(gameState, cardId, slotIndex) {
  return withVisibleState(gameState, InventoryService.placeCardToSlot(gameState, cardId, slotIndex));
}

/**
 * Removes a card from a workbench slot, returning it to the daily pool.
 */
export function removeCardFromSlot(gameState, slotIndex) {
  return withVisibleState(gameState, InventoryService.removeCardFromSlot(gameState, slotIndex));
}

/**
 * Moves or swaps cards between workbench slots.
 */
export function moveWorkbenchCard(gameState, fromSlotIndex, toSlotIndex) {
  return withVisibleState(gameState, InventoryService.moveCardBetweenSlots(gameState, fromSlotIndex, toSlotIndex));
}

/**
 * Attempts to compile the workbench slots into a packaged product.
 * In case of a conflict (e.g. precise_profile vs career_competitiveness),
 * it returns ambiguous status unless a preferredPackageType is supplied.
 */
export function createPackage(gameState, preferredPackageType = null) {
  const slots = gameState.workbench;
  const activeCards = slots.filter(c => c !== null && c !== undefined);
  const activeCardsCount = activeCards.length;

  if (activeCardsCount !== 3) {
    return withVisibleState(gameState, {
      ok: false,
      code: "INVALID_CARD_COUNT",
      message: `Packaging requires exactly 3 data cards. You have placed ${activeCardsCount}.`
    });
  }

  const selectedCardIds = activeCards.map(c => c.id);
  if (new Set(selectedCardIds).size !== selectedCardIds.length) {
    return withVisibleState(gameState, {
      ok: false,
      code: "DUPLICATE_CARD",
      message: "Each package must use 3 unique card instances."
    });
  }

  // 1. Evaluate recipe match
  const previewResult = content.findPackagePreviews(selectedCardIds, {
    onlyReady: true,
    cards: activeCards,
    preferredPackageType
  });
  const matchResult = RecipeMatcher.match(slots, preferredPackageType);

  // 2. Handle ambiguous match
  if (matchResult.ambiguous) {
    return withVisibleState(gameState, {
      ok: false,
      code: "AMBIGUOUS_COMBINATION",
      message: matchResult.message,
      candidates: matchResult.candidates.map(r => ({
        id: r.id,
        packageType: r.id,
        name: r.name,
        description: r.description
      })),
      previews: previewResult.previews
    });
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

  const event = compiledPackage.isWaste ? EventName.WASTE_CREATED : EventName.PACKAGE_CREATED;
  return withVisibleState(gameState, {
    ok: true,
    event,
    package: compiledPackage,
    packageId: compiledPackage.id,
    packageType: compiledPackage.packageType,
    isWaste: compiledPackage.isWaste
  }, event, { packageId: compiledPackage.id, packageType: compiledPackage.packageType });
}

/**
 * Sells a packaged dossier to an active daily corporate buyer.
 */
export function sellPackage(gameState, packageId, buyerId) {
  const result = TransactionService.sellPackage(gameState, packageId, buyerId);
  const event = result.ok ? EventName.TRANSACTION_SUCCESS : EventName.TRANSACTION_FAILED;
  return withVisibleState(gameState, { ...result, event }, event, { packageId, buyerId });
}

/**
 * Triggers end-of-day risk calculations and moves to tomorrow.
 */
export function endDay(gameState) {
  return withVisibleState(gameState, DayController.endDay(gameState));
}

/**
 * Returns a copy of the visible state suitable for the frontend.
 */
export function getVisibleState(gameState) {
  if (!gameState) return null;
  return gameState.toVisibleState();
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

export function findPackagePreviews(gameState, selectedCardIds, options = {}) {
  const cards = selectedCardIds
    .map(cardId => gameState.rawCards.find(card => card.id === cardId) || gameState.workbench.find(card => card && card.id === cardId))
    .filter(Boolean);
  return content.findPackagePreviews(selectedCardIds, { ...options, cards });
}

export function findChallengeByDay(day) {
  return content.findChallengeByDay(day);
}

export function pickProfilePuzzleByDay(day) {
  return content.pickProfilePuzzleByDay(day);
}

export function pickBuyerNegotiationScript(packageType) {
  return content.pickBuyerNegotiationScript(packageType);
}

export function pickPublicOpinionScript(packageType) {
  return content.pickPublicOpinionScript(packageType);
}

export function findDailyMonologueByDay(day) {
  return content.findDailyMonologueByDay(day);
}

export function pickEvidenceChainTemplate() {
  return content.pickEvidenceChainTemplate();
}

export function resolveDay7Route(gameState) {
  const route = gameState.conscience < 5 ? "final_package" : "evidence_chain";
  gameState.endingRoute = route;
  if (gameState.conscience < 5) {
    return { route: "final_package", reason: "LOW_CONSCIENCE" };
  }
  return { route: "evidence_chain", reason: "CONSCIENCE_THRESHOLD_MET" };
}

function withVisibleState(gameState, result, event = null, eventPayload = {}) {
  if (event) {
    gameState.lastEvent = {
      type: event,
      day: gameState.day,
      payload: eventPayload
    };
    gameState.events.push(gameState.lastEvent);
  }

  return {
    ...result,
    visibleState: getVisibleState(gameState)
  };
}
