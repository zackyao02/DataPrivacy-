import { CardStatus, WORKBENCH_SLOT_COUNT } from "../data/schemas.js";
import { dailyRhythm } from "../../data/textConfig.js";

/**
 * Service to manage player workbench slots and packaged inventory.
 */
export class InventoryService {
  /**
   * Places a data card into a specific workbench slot.
   * @param {object} gameState - The current state object
   * @param {string} cardId - The ID of the card to place
   * @param {number} slotIndex - The index of the slot (0 to 2)
   * @returns {object} Action result
   */
  static placeCardToSlot(gameState, cardId, slotIndex) {
    if (!isValidSlot(slotIndex)) {
      return { ok: false, code: "INVALID_SLOT", message: "Slot index must be 0, 1, or 2." };
    }

    const currentSlotIndex = gameState.workbench.findIndex(c => c && c.id === cardId);
    if (currentSlotIndex !== -1) {
      return this.moveCardBetweenSlots(gameState, currentSlotIndex, slotIndex);
    }

    const card = gameState.rawCards.find(c => c.id === cardId);
    if (!card) {
      return { ok: false, code: "CARD_NOT_FOUND", message: "Card not found in daily pool." };
    }

    if (card.status !== CardStatus.AVAILABLE) {
      return { ok: false, code: "CARD_NOT_AVAILABLE", message: `Card is already ${card.status}.` };
    }

    // If slot is occupied, return the existing card to the available pool first
    const existingCard = gameState.workbench[slotIndex];
    if (existingCard) {
      existingCard.status = CardStatus.AVAILABLE;
    }

    // Place new card
    card.status = CardStatus.WORKBENCH;
    gameState.workbench[slotIndex] = card;

    return { ok: true, workbench: gameState.workbench };
  }

  /**
   * Removes a data card from a specific workbench slot.
   * @param {object} gameState - The current state object
   * @param {number} slotIndex - The index of the slot (0 to 2)
   * @returns {object} Action result
   */
  static removeCardFromSlot(gameState, slotIndex) {
    if (!isValidSlot(slotIndex)) {
      return { ok: false, code: "INVALID_SLOT", message: "Slot index must be 0, 1, or 2." };
    }

    const card = gameState.workbench[slotIndex];
    if (!card) {
      return { ok: false, code: "SLOT_EMPTY", message: "Slot is already empty." };
    }

    card.status = CardStatus.AVAILABLE;
    gameState.workbench[slotIndex] = null;

    return { ok: true, workbench: gameState.workbench };
  }

  /**
   * Moves a card between workbench slots. If the destination is occupied,
   * the two cards are swapped.
   */
  static moveCardBetweenSlots(gameState, fromSlotIndex, toSlotIndex) {
    if (!isValidSlot(fromSlotIndex) || !isValidSlot(toSlotIndex)) {
      return { ok: false, code: "INVALID_SLOT", message: "Slot index must be 0, 1, or 2." };
    }

    if (fromSlotIndex === toSlotIndex) {
      return { ok: true, workbench: gameState.workbench };
    }

    const fromCard = gameState.workbench[fromSlotIndex];
    if (!fromCard) {
      return { ok: false, code: "SLOT_EMPTY", message: "Source slot is empty." };
    }

    const toCard = gameState.workbench[toSlotIndex];
    gameState.workbench[toSlotIndex] = fromCard;
    gameState.workbench[fromSlotIndex] = toCard || null;

    return { ok: true, workbench: gameState.workbench };
  }

  /**
   * Adds a compiled package to inventory
   */
  static addPackage(gameState, dataPackage) {
    if (!this.canAddPackage(gameState)) {
      return { ok: false, code: "INVENTORY_FULL", message: "库存已满，请先出售" };
    }

    gameState.packageInventory.push(dataPackage);
    
    // Clear the workbench slots where these cards were
    for (let i = 0; i < gameState.workbench.length; i++) {
      const slotCard = gameState.workbench[i];
      if (slotCard && dataPackage.cardIds.includes(slotCard.id)) {
        gameState.workbench[i] = null;
      }
    }

    return { ok: true, packageInventory: gameState.packageInventory };
  }

  static canAddPackage(gameState) {
    return gameState.packageInventory.length < dailyRhythm.packageInventoryLimit;
  }

  /**
   * Removes a package from inventory (e.g., sold)
   */
  static removePackage(gameState, packageId) {
    const initialLength = gameState.packageInventory.length;
    gameState.packageInventory = gameState.packageInventory.filter(p => p.id !== packageId);
    return gameState.packageInventory.length < initialLength;
  }
}

function isValidSlot(slotIndex) {
  return Number.isInteger(slotIndex) && slotIndex >= 0 && slotIndex < WORKBENCH_SLOT_COUNT;
}
